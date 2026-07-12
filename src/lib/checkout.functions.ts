import { createServerFn } from "@tanstack/react-start";

type CheckoutItemInput = { id: string; quantity: number };

type CheckoutInput = {
  items: CheckoutItemInput[];
  shipping_cents?: number;
  buyer?: { name?: string; email?: string };
};

export type CheckoutResult = {
  provider: "mercado_pago" | "stripe";
  url: string;
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
  return {
    items,
    shipping_cents:
      typeof i.shipping_cents === "number" && i.shipping_cents >= 0
        ? Math.floor(i.shipping_cents)
        : 0,
    buyer: i.buyer && typeof i.buyer === "object" ? i.buyer : undefined,
  };
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<CheckoutResult> => {
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
    const shippingCents = data.shipping_cents ?? 0;
    const totalCents = itemsTotalCents + shippingCents;

    async function recordOrder(provider: string, externalId: string | null) {
      try {
        const { data: order, error: oErr } = await supabaseAdmin
          .from("orders" as any)
          .insert({
            status: "pending",
            total_cents: totalCents,
            shipping_cents: shippingCents,
            currency: "BRL",
            provider,
            external_id: externalId,
            buyer_email: data.buyer?.email ?? null,
            buyer_name: data.buyer?.name ?? null,
          })
          .select("id")
          .single();
        if (oErr || !order) return;
        const rows = data.items
          .map((it) => {
            const p = priceMap.get(it.id);
            if (!p) return null;
            const unit = Math.round(p.price * 100);
            return {
              order_id: (order as any).id,
              product_id: it.id,
              product_name: p.name,
              unit_price_cents: unit,
              quantity: it.quantity,
              subtotal_cents: unit * it.quantity,
            };
          })
          .filter(Boolean);
        if (rows.length) {
          await supabaseAdmin.from("order_items" as any).insert(rows as any);
        }
      } catch (e) {
        console.error("[checkout] failed to record order", e);
      }
    }

    let origin = "";
    try {
      const mod = await import("@tanstack/react-start/server");
      const host = mod.getRequestHost();
      if (host) origin = `https://${host}`;
    } catch {
      origin = "";
    }

    const shipping = (data.shipping_cents ?? 0) / 100;

    if (active.provider === "mercado_pago") {
      const body = {
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
              success: `${origin}/?pagamento=sucesso`,
              failure: `${origin}/?pagamento=falha`,
              pending: `${origin}/?pagamento=pendente`,
            }
          : undefined,
        auto_return: origin ? "approved" : undefined,
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
      await recordOrder("mercado_pago", json?.id ? String(json.id) : null);
      return { provider: "mercado_pago", url };
    }

    if (active.provider === "stripe") {
      const params = new URLSearchParams();
      params.append("mode", "payment");
      if (origin) {
        params.append("success_url", `${origin}/?pagamento=sucesso`);
        params.append("cancel_url", `${origin}/?pagamento=falha`);
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
      await recordOrder("stripe", json?.id ? String(json.id) : null);
      return { provider: "stripe", url: json.url };
    }

    throw new Error(`Provider desconhecido: ${active.provider}`);
  });