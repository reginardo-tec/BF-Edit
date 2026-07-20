import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CheckoutItemInput = { id: string; quantity: number };

type CheckoutInput = {
  items: CheckoutItemInput[];
  shipping_option_id?: string;
  buyer?: { name?: string; email?: string };
  shipping_address?: {
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
  };
};

export type CheckoutResult = {
  provider: "mercado_pago" | "stripe";
  url: string;
  order_id: string;
};

function validate(input: unknown): CheckoutInput {
  if (!input || typeof input !== "object") throw new Error("Requisição inválida");
  const i = input as any;
  if (!Array.isArray(i.items) || i.items.length === 0)
    throw new Error("Carrinho vazio");
  const items: CheckoutItemInput[] = i.items.map((it: any) => {
    if (!it || typeof it.id !== "string") throw new Error("Item inválido");
    const q = Number(it.quantity);
    if (!Number.isFinite(q) || q < 1) throw new Error("Quantidade inválida");
    return { id: it.id, quantity: Math.floor(q) };
  });
  let addr: CheckoutInput["shipping_address"];
  if (i.shipping_address && typeof i.shipping_address === "object") {
    const a = i.shipping_address;
    const zip = String(a.zip ?? "").replace(/\D/g, "");
    if (zip.length !== 8) throw new Error("CEP inválido");
    if (!a.street || !a.number || !a.city || !a.state)
      throw new Error("Endereço incompleto");
    addr = {
      zip,
      street: String(a.street),
      number: String(a.number),
      complement: a.complement ? String(a.complement) : undefined,
      neighborhood: a.neighborhood ? String(a.neighborhood) : undefined,
      city: String(a.city),
      state: String(a.state).toUpperCase().slice(0, 2),
    };
  }
  return {
    items,
    shipping_option_id:
      typeof i.shipping_option_id === "string" && i.shipping_option_id.length > 0
        ? i.shipping_option_id
        : undefined,
    buyer: i.buyer && typeof i.buyer === "object" ? i.buyer : undefined,
    shipping_address: addr,
  };
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load active payment provider
    const { data: settings, error: sErr } = await supabaseAdmin
      .from("payment_settings" as any)
      .select("*")
      .eq("enabled", true)
      .order("provider");
    if (sErr) {
      console.error("[checkout] failed to load payment settings", sErr);
      throw new Error("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
    }
    const active = (settings ?? [])[0] as any;
    if (!active || !active.access_token) {
      throw new Error(
        "Nenhum gateway de pagamento ativo. Peça ao administrador para configurar.",
      );
    }

    // Re-fetch product prices from DB (never trust client)
    const ids = data.items.map((i) => i.id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,name,price,active")
      .in("id", ids);
    if (pErr) {
      console.error("[checkout] failed to load products", pErr);
      throw new Error("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
    }

    const priceMap = new Map<string, { name: string; price: number }>();
    for (const p of products ?? []) {
      if (!p.active) continue;
      priceMap.set(p.id, { name: p.name, price: Number(p.price) });
    }

    const lineItems = data.items
      .map((it) => {
        const p = priceMap.get(it.id);
        if (!p) return null;
        return { name: p.name, price: p.price, quantity: it.quantity };
      })
      .filter(Boolean) as { name: string; price: number; quantity: number }[];

    if (lineItems.length === 0) throw new Error("Nenhum produto válido no carrinho");

    const itemsTotalCents = lineItems.reduce(
      (s, li) => s + Math.round(li.price * 100) * li.quantity,
      0,
    );
    // Re-quote shipping server-side; never trust a client-supplied price.
    let shippingCents = 0;
    let shippingService: string | null = null;
    if (data.shipping_option_id && data.shipping_address?.zip) {
      const { computeShippingOptions } = await import("./shipping-quote.server");
      const opts = await computeShippingOptions(
        data.shipping_address.zip,
        data.items,
      );
      const chosen = opts.find((o) => o.id === data.shipping_option_id);
      if (!chosen) {
        throw new Error("Serviço de envio indisponível. Recalcule o frete e tente novamente.");
      }
      shippingCents = Math.round(Number(chosen.price) * 100);
      shippingService = `${chosen.company} - ${chosen.name}`;
    }
    const totalCents = itemsTotalCents + shippingCents;

    // Create order upfront linked to the authenticated user
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders" as any)
      .insert({
        user_id: context.userId,
        status: "pending",
        total_cents: totalCents,
        shipping_cents: shippingCents,
        currency: "BRL",
        provider: active.provider,
        buyer_email: data.buyer?.email ?? null,
        buyer_name: data.buyer?.name ?? null,
        shipping_service: shippingService,
        shipping_zip: data.shipping_address?.zip ?? null,
        shipping_address: data.shipping_address ?? null,
      })
      .select("id")
      .single();
    if (oErr || !order) {
      console.error("[checkout] failed to create order", oErr);
      throw new Error("Não foi possível registrar o pedido.");
    }
    const orderId = (order as any).id as string;
    const itemRows = data.items
      .map((it) => {
        const p = priceMap.get(it.id);
        if (!p) return null;
        const unit = Math.round(p.price * 100);
        return {
          order_id: orderId,
          product_id: it.id,
          product_name: p.name,
          unit_price_cents: unit,
          quantity: it.quantity,
          subtotal_cents: unit * it.quantity,
        };
      })
      .filter(Boolean);
    if (itemRows.length) {
      await supabaseAdmin.from("order_items" as any).insert(itemRows as any);
    }

    let origin = "";
    try {
      const mod = await import("@tanstack/react-start/server");
      const host = mod.getRequestHost();
      if (host) origin = `https://${host}`;
    } catch {
      origin = "";
    }

    const shipping = shippingCents / 100;

    if (active.provider === "mercado_pago") {
      const body = {
        external_reference: orderId,
        items: lineItems.map((li) => ({
          title: li.name,
          quantity: li.quantity,
          currency_id: "BRL",
          unit_price: Number(li.price.toFixed(2)),
        })),
        shipments: shipping > 0 ? { cost: shipping, mode: "not_specified" } : undefined,
        payer: data.buyer?.email ? { email: data.buyer.email, name: data.buyer.name } : undefined,
        back_urls: origin
          ? {
              success: `${origin}/pagamento/sucesso?order_id=${orderId}`,
              failure: `${origin}/pagamento/falha?order_id=${orderId}`,
              pending: `${origin}/pagamento/sucesso?order_id=${orderId}&pendente=1`,
            }
          : undefined,
        auto_return: origin ? "approved" : undefined,
        notification_url: origin ? `${origin}/api/public/webhooks/mercadopago` : undefined,
      };
      const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${active.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const json: any = await res.json();
      if (!res.ok) {
        console.error("[checkout] mercado pago error", json);
        throw new Error("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
      }
      const url = active.sandbox ? json.sandbox_init_point : json.init_point;
      if (json?.id) {
        await supabaseAdmin
          .from("orders" as any)
          .update({ external_id: String(json.id) })
          .eq("id", orderId);
      }
      return { provider: "mercado_pago", url, order_id: orderId };
    }

    if (active.provider === "stripe") {
      const params = new URLSearchParams();
      params.append("mode", "payment");
      params.append("client_reference_id", orderId);
      params.append("metadata[order_id]", orderId);
      if (origin) {
        params.append("success_url", `${origin}/pagamento/sucesso?order_id=${orderId}`);
        params.append("cancel_url", `${origin}/pagamento/falha?order_id=${orderId}`);
      }
      lineItems.forEach((li, idx) => {
        params.append(`line_items[${idx}][price_data][currency]`, "brl");
        params.append(`line_items[${idx}][price_data][product_data][name]`, li.name);
        params.append(
          `line_items[${idx}][price_data][unit_amount]`,
          String(Math.round(li.price * 100)),
        );
        params.append(`line_items[${idx}][quantity]`, String(li.quantity));
      });
      if (shipping > 0) {
        const idx = lineItems.length;
        params.append(`line_items[${idx}][price_data][currency]`, "brl");
        params.append(`line_items[${idx}][price_data][product_data][name]`, "Frete");
        params.append(
          `line_items[${idx}][price_data][unit_amount]`,
          String(Math.round(shipping * 100)),
        );
        params.append(`line_items[${idx}][quantity]`, "1");
      }
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${active.access_token}`,
        },
        body: params.toString(),
      });
      const json: any = await res.json();
      if (!res.ok) {
        console.error("[checkout] stripe error", json);
        throw new Error("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
      }
      if (json?.id) {
        await supabaseAdmin
          .from("orders" as any)
          .update({ external_id: String(json.id) })
          .eq("id", orderId);
      }
      return { provider: "stripe", url: json.url, order_id: orderId };
    }

    throw new Error(`Provider desconhecido: ${active.provider}`);
  });