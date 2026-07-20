import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          let paymentId =
            url.searchParams.get("data.id") ||
            url.searchParams.get("id") ||
            null;
          let type = url.searchParams.get("type") || url.searchParams.get("topic") || null;
          try {
            const body = await request.json();
            if (body?.data?.id) paymentId = String(body.data.id);
            if (body?.type) type = String(body.type);
          } catch {}

          if (!paymentId) return new Response("ok");
          if (type && type !== "payment") return new Response("ok");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Load MP access token
          const { data: settings } = await supabaseAdmin
            .from("payment_settings" as any)
            .select("access_token")
            .eq("provider", "mercado_pago")
            .eq("enabled", true)
            .maybeSingle();
          const token = (settings as any)?.access_token;
          if (!token) {
            console.error("[mp webhook] no MP token configured");
            return new Response("ok");
          }

          const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            console.error("[mp webhook] fetch payment failed", res.status);
            return new Response("ok");
          }
          const payment: any = await res.json();
          const orderId = payment.external_reference;
          if (!orderId) return new Response("ok");

          const status = payment.status;
          const patch: Record<string, any> = {};
          if (status === "approved") {
            patch.status = "paid";
            patch.paid_at = new Date().toISOString();
          } else if (status === "rejected" || status === "cancelled") {
            patch.status = "failed";
          } else if (status === "refunded") {
            patch.status = "cancelled";
          }
          if (Object.keys(patch).length) {
            await supabaseAdmin.from("orders" as any).update(patch).eq("id", orderId);
          }
          return new Response("ok");
        } catch (e) {
          console.error("[mp webhook] error", e);
          return new Response("ok");
        }
      },
      GET: async () => new Response("ok"),
    },
  },
});