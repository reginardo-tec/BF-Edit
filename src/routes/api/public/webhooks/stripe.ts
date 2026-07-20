import { createFileRoute } from "@tanstack/react-router";

// Verify Stripe webhook signature per https://stripe.com/docs/webhooks/signatures
// Format of Stripe-Signature header: t=<unix_ts>,v1=<sig>,v1=<sig>,...
async function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim());
  let timestamp: string | null = null;
  const sigs: string[] = [];
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "t") timestamp = v;
    else if (k === "v1" && v) sigs.push(v);
  }
  if (!timestamp || sigs.length === 0) return false;

  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time compare against each provided v1 signature.
  for (const provided of sigs) {
    if (provided.length !== expected.length) continue;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
    }
    if (diff === 0) return true;
  }
  return false;
}

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const secret = process.env.STRIPE_WEBHOOK_SECRET;
          if (!secret) {
            console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured");
            return new Response("Webhook not configured", { status: 500 });
          }
          const body = await request.text();
          const signatureHeader = request.headers.get("stripe-signature");
          const valid = await verifyStripeSignature(body, signatureHeader, secret);
          if (!valid) {
            return new Response("Invalid signature", { status: 400 });
          }
          const event = JSON.parse(body);
          if (event?.type !== "checkout.session.completed") return new Response("ok");
          const session = event.data?.object;
          const orderId = session?.metadata?.order_id || session?.client_reference_id;
          if (!orderId) return new Response("ok");
          if (session?.payment_status !== "paid") return new Response("ok");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin
            .from("orders" as any)
            .update({ status: "paid", paid_at: new Date().toISOString() })
            .eq("id", orderId);
          return new Response("ok");
        } catch (e) {
          console.error("[stripe webhook] error", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});