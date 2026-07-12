import { supabase } from "@/integrations/supabase/client";

export type Period = "day" | "week" | "month" | "year";

export type OrderRow = {
  id: string;
  status: string;
  total_cents: number;
  shipping_cents: number;
  provider: string | null;
  created_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  subtotal_cents: number;
  created_at: string;
};

export function periodStart(period: Period, now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (period === "day") return d;
  if (period === "week") {
    const day = d.getDay(); // 0 Sun
    const diff = (day + 6) % 7; // segunda-feira
    d.setDate(d.getDate() - diff);
    return d;
  }
  if (period === "month") {
    d.setDate(1);
    return d;
  }
  d.setMonth(0, 1);
  return d;
}

export async function fetchOrdersSince(sinceIso: string): Promise<OrderRow[]> {
  const { data, error } = await (supabase as any)
    .from("orders")
    .select("id,status,total_cents,shipping_cents,provider,created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

export async function fetchOrderItemsSince(sinceIso: string): Promise<OrderItemRow[]> {
  const { data, error } = await (supabase as any)
    .from("order_items")
    .select("id,order_id,product_id,product_name,unit_price_cents,quantity,subtotal_cents,created_at")
    .gte("created_at", sinceIso);
  if (error) throw error;
  return (data ?? []) as OrderItemRow[];
}

export function bucketKey(period: Period, iso: string): string {
  const d = new Date(iso);
  if (period === "day") {
    return `${d.getHours().toString().padStart(2, "0")}h`;
  }
  if (period === "week" || period === "month") {
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  }
  return d.toLocaleDateString("pt-BR", { month: "short" });
}

export function aggregateSeries(period: Period, orders: OrderRow[]) {
  const map = new Map<string, { label: string; revenue: number; orders: number }>();
  for (const o of orders) {
    const key = bucketKey(period, o.created_at);
    const prev = map.get(key) ?? { label: key, revenue: 0, orders: 0 };
    prev.revenue += o.total_cents / 100;
    prev.orders += 1;
    map.set(key, prev);
  }
  return Array.from(map.values());
}

export function topProducts(items: OrderItemRow[], limit = 5) {
  const map = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const it of items) {
    const key = it.product_id ?? it.product_name;
    const prev = map.get(key) ?? { name: it.product_name, quantity: 0, revenue: 0 };
    prev.quantity += it.quantity;
    prev.revenue += it.subtotal_cents / 100;
    map.set(key, prev);
  }
  return Array.from(map.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}