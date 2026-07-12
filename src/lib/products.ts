import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export const CATEGORIES = [
  { value: "agendas", label: "Agendas" },
  { value: "cadernos", label: "Cadernos" },
  { value: "polaroids", label: "Polaroids" },
  { value: "fotos", label: "Fotos" },
  { value: "cartoes", label: "Cartões de visita" },
  { value: "personalizados", label: "Personalizados" },
];

const BUCKET = "product-images";
const signedCache = new Map<string, { url: string; expires: number }>();

export async function resolveImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cached = signedCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (!data?.signedUrl) return null;
  signedCache.set(path, { url: data.signedUrl, expires: Date.now() + 1000 * 60 * 60 * 24 * 6 });
  return data.signedUrl;
}

export async function fetchProducts(opts: { includeInactive?: boolean; category?: string } = {}) {
  let q = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (!opts.includeInactive) q = q.eq("active", true);
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function deleteProductImage(path: string | null) {
  if (!path || path.startsWith("http")) return;
  await supabase.storage.from(BUCKET).remove([path]);
}