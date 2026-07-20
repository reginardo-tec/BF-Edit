import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OrderStatus =
  | "pending"
  | "paid"
  | "in_production"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled";

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders" as any)
      .select("*, order_items(*)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as any;
    if (!i || typeof i.id !== "string") throw new Error("Pedido inválido");
    return { id: i.id };
  })
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders" as any)
      .select("*, order_items(*)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Pedido não encontrado");
    return order;
  });

// Admin — list all
export const listAllOrdersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin" as any,
    });
    if (!isAdmin) throw new Error("Acesso negado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders" as any)
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const VALID_STATUSES = new Set<OrderStatus>([
  "pending",
  "paid",
  "in_production",
  "shipped",
  "delivered",
  "failed",
  "cancelled",
]);

export const updateOrderAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as any;
    if (!i || typeof i.id !== "string") throw new Error("Pedido inválido");
    const patch: Record<string, any> = {};
    if (typeof i.status === "string") {
      if (!VALID_STATUSES.has(i.status)) throw new Error("Status inválido");
      patch.status = i.status;
      if (i.status === "shipped") patch.shipped_at = new Date().toISOString();
      if (i.status === "delivered") patch.delivered_at = new Date().toISOString();
    }
    if (typeof i.tracking_code === "string") patch.tracking_code = i.tracking_code || null;
    if (typeof i.tracking_url === "string") patch.tracking_url = i.tracking_url || null;
    return { id: i.id, patch };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin" as any,
    });
    if (!isAdmin) throw new Error("Acesso negado");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders" as any)
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });