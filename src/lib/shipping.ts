import { supabase } from "@/integrations/supabase/client";

export type ShippingProvider = "melhor_envio" | "correios" | "jadlog";

export type ShippingSetting = {
  id: string;
  provider: string;
  enabled: boolean;
  api_token: string | null;
  sender_zip: string | null;
  sender_name: string | null;
  updated_at: string;
};

export const SHIPPING_PROVIDERS: { value: ShippingProvider; label: string; help: string }[] = [
  {
    value: "melhor_envio",
    label: "Melhor Envio",
    help: "Gere um token em Melhor Envio → Configurações → Tokens de API.",
  },
  {
    value: "correios",
    label: "Correios",
    help: "Use seu código administrativo + senha do contrato Correios (SIGEP).",
  },
  {
    value: "jadlog",
    label: "Jadlog",
    help: "Informe o token fornecido no portal Jadlog Expresso.",
  },
];

export async function fetchShippingSettings(): Promise<ShippingSetting[]> {
  const { data, error } = await supabase
    .from("shipping_settings")
    .select("*")
    .order("provider");
  if (error) throw error;
  return (data ?? []) as ShippingSetting[];
}

export async function upsertShippingSetting(
  provider: string,
  patch: {
    enabled?: boolean;
    api_token?: string | null;
    sender_zip?: string | null;
    sender_name?: string | null;
  },
) {
  const { error } = await supabase
    .from("shipping_settings")
    .update(patch)
    .eq("provider", provider);
  if (error) throw error;
}