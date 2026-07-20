export type ShippingOption = {
  id: string;
  name: string;
  company: string;
  price: number;
  delivery_time: number;
};

export async function computeShippingOptions(
  zip: string,
  items: { id: string; quantity: number }[],
): Promise<ShippingOption[]> {
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) throw new Error("Serviço de frete não configurado. Contate o administrador.");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: settings } = await supabaseAdmin
    .from("shipping_settings" as any)
    .select("sender_zip,sender_name")
    .eq("provider", "melhor_envio")
    .maybeSingle();
  const senderZip = String((settings as any)?.sender_zip ?? "").replace(/\D/g, "") || "01001000";
  const senderName = (settings as any)?.sender_name ?? "BF Arte & Design";

  const ids = items.map((i) => i.id);
  const { data: products } = await supabaseAdmin
    .from("products")
    .select("id,price")
    .in("id", ids);
  const priceMap = new Map<string, number>();
  for (const p of products ?? []) priceMap.set(p.id, Number(p.price));
  const insurance = items.reduce((s, it) => s + (priceMap.get(it.id) ?? 0) * it.quantity, 0);

  const products_payload = items.map((it) => ({
    id: it.id,
    width: 15,
    height: 5,
    length: 20,
    weight: 0.3,
    insurance_value: (priceMap.get(it.id) ?? 0) * it.quantity,
    quantity: it.quantity,
  }));

  const res = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": `${senderName} (contato@bfartedesign.shop)`,
    },
    body: JSON.stringify({
      from: { postal_code: senderZip },
      to: { postal_code: zip },
      products: products_payload,
      options: { insurance_value: insurance, receipt: false, own_hand: false },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[shipping] melhor envio failed", res.status, text);
    throw new Error("Não foi possível calcular o frete. Verifique o CEP.");
  }

  const raw = (await res.json()) as any[];
  const options: ShippingOption[] = [];
  for (const s of raw) {
    if (s.error) continue;
    if (s.price == null) continue;
    options.push({
      id: String(s.id),
      name: String(s.name ?? "Serviço"),
      company: String(s.company?.name ?? ""),
      price: Number(s.price),
      delivery_time: Number(s.delivery_time ?? 0),
    });
  }
  return options;
}