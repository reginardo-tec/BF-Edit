import { createServerFn } from "@tanstack/react-start";

export type { ShippingOption } from "./shipping-quote.server";

type QuoteInput = {
  zip: string;
  items: { id: string; quantity: number }[];
};

function validate(input: unknown): QuoteInput {
  if (!input || typeof input !== "object") throw new Error("Requisição inválida");
  const i = input as any;
  const zip = String(i.zip ?? "").replace(/\D/g, "");
  if (zip.length !== 8) throw new Error("CEP inválido");
  if (!Array.isArray(i.items) || i.items.length === 0) throw new Error("Carrinho vazio");
  const items = i.items.map((it: any) => {
    if (!it || typeof it.id !== "string") throw new Error("Item inválido");
    const q = Number(it.quantity);
    if (!Number.isFinite(q) || q < 1) throw new Error("Quantidade inválida");
    return { id: it.id, quantity: Math.floor(q) };
  });
  return { zip, items };
}

export const quoteShipping = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const { computeShippingOptions } = await import("./shipping-quote.server");
    return computeShippingOptions(data.zip, data.items);
  });