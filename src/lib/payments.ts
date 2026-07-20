import { supabase } from "@/integrations/supabase/client";

export type PaymentProvider = "mercado_pago" | "stripe";

export type PaymentSetting = {
  id: string;
  provider: string;
  enabled: boolean;
  access_token: string | null;
  public_key: string | null;
  sandbox: boolean;
  updated_at: string;
};

export const PAYMENT_PROVIDERS: {
  value: PaymentProvider;
  label: string;
  help: string;
  tokenLabel: string;
  publicKeyLabel: string;
}[] = [
  {
    value: "mercado_pago",
    label: "Mercado Pago",
    help:
      "Crie uma aplicação em mercadopago.com.br/developers → Suas integrações. Copie o Access Token (produção ou teste) e a Public Key.",
    tokenLabel: "Access Token",
    publicKeyLabel: "Public Key",
  },
  {
    value: "stripe",
    label: "Stripe",
    help:
      "No dashboard Stripe → Developers → API keys. Use a Secret Key (sk_live_ ou sk_test_) e a Publishable Key (pk_...).",
    tokenLabel: "Secret Key",
    publicKeyLabel: "Publishable Key",
  },
];

export async function fetchPaymentSettings(): Promise<PaymentSetting[]> {
  const { data, error } = await (supabase as any)
    .from("payment_settings")
    .select("*")
    .order("provider");
  if (error) throw error;
  return (data ?? []) as PaymentSetting[];
}

export async function upsertPaymentSetting(
  provider: string,
  patch: {
    enabled?: boolean;
    access_token?: string | null;
    public_key?: string | null;
    sandbox?: boolean;
  },
) {
  const { error } = await (supabase as any)
    .from("payment_settings")
    .update(patch)
    .eq("provider", provider);
  if (error) throw error;
}