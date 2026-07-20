import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useServerFn } from "@tanstack/react-start";
import { listMyOrders } from "@/lib/orders.functions";
import { formatBRL } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, CheckCircle2, Clock, CreditCard, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meus-pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — BF Arte & Design" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyOrdersPage,
});

const STATUS_META: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "Aguardando pagamento", icon: Clock, className: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Pagamento aprovado", icon: CreditCard, className: "bg-blue-100 text-blue-800" },
  in_production: { label: "Em produção", icon: Package, className: "bg-purple-100 text-purple-800" },
  shipped: { label: "Enviado", icon: Truck, className: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Entregue", icon: CheckCircle2, className: "bg-green-100 text-green-800" },
  failed: { label: "Pagamento não aprovado", icon: XCircle, className: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelado", icon: XCircle, className: "bg-gray-100 text-gray-800" },
};

function MyOrdersPage() {
  const list = useServerFn(listMyOrders);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    list()
      .then((d) => setOrders(d as any[]))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [list]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="font-display text-3xl md:text-4xl">Meus pedidos</h1>
        <p className="mt-2 text-muted-foreground">Acompanhe o status e o rastreamento dos seus pedidos.</p>

        {loading ? (
          <div className="mt-10 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-card/50 p-12 text-center text-muted-foreground">
            Você ainda não fez pedidos.{" "}
            <Link to="/catalogo" className="text-primary underline">Ver catálogo</Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((o) => {
              const meta = STATUS_META[o.status] ?? STATUS_META.pending;
              const Icon = meta.icon;
              return (
                <li key={o.id} className="rounded-2xl border border-border/60 bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Pedido</p>
                      <p className="font-mono text-sm">{o.id.slice(0, 8)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <Badge className={`${meta.className} border-0 gap-1`}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </Badge>
                  </div>

                  <ul className="mt-4 space-y-1 text-sm">
                    {(o.order_items ?? []).map((it: any) => (
                      <li key={it.id} className="flex justify-between">
                        <span>{it.quantity}x {it.product_name}</span>
                        <span>{formatBRL(it.subtotal_cents / 100)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm">
                    <div className="text-muted-foreground">
                      {o.shipping_service && <span>Envio: {o.shipping_service}</span>}
                    </div>
                    <div className="font-semibold">
                      Total: {formatBRL(o.total_cents / 100)}
                    </div>
                  </div>

                  {o.tracking_code && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                      <p><strong>Código de rastreamento:</strong> {o.tracking_code}</p>
                      {o.tracking_url && (
                        <a href={o.tracking_url} target="_blank" rel="noreferrer" className="text-primary underline">
                          Rastrear pedido
                        </a>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}