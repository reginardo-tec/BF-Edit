import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllOrdersAdmin, updateOrderAdmin } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/cart";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "pending", label: "Aguardando pagamento" },
  { value: "paid", label: "Pagamento aprovado" },
  { value: "in_production", label: "Em produção" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "failed", label: "Pagamento não aprovado" },
  { value: "cancelled", label: "Cancelado" },
];

export function AdminOrdersPanel() {
  const list = useServerFn(listAllOrdersAdmin);
  const update = useServerFn(updateOrderAdmin);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    list()
      .then((d) => setOrders(d as any[]))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (id: string, patch: Record<string, any>) => {
    try {
      await update({ data: { id, ...patch } });
      toast.success("Pedido atualizado");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Pedidos</h2>
          <p className="text-sm text-muted-foreground">Atualize o status e o código de rastreio.</p>
        </div>
        <Button variant="outline" onClick={load}>Atualizar</Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Nenhum pedido ainda.
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs">{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("pt-BR")} · {o.buyer_email ?? "sem email"}
                  </p>
                  <p className="mt-1 text-sm">Total: <strong>{formatBRL(o.total_cents / 100)}</strong></p>
                </div>
                <div className="min-w-[200px]">
                  <Select value={o.status} onValueChange={(v) => save(o.id, { status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ul className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                {(o.order_items ?? []).map((it: any) => (
                  <li key={it.id}>{it.quantity}x {it.product_name}</li>
                ))}
              </ul>

              {o.shipping_address && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {o.shipping_address.street}, {o.shipping_address.number} · {o.shipping_address.city}/{o.shipping_address.state} · CEP {o.shipping_address.zip}
                </p>
              )}

              <TrackingEditor
                initial={{ code: o.tracking_code ?? "", url: o.tracking_url ?? "" }}
                onSave={(code, url) => save(o.id, { tracking_code: code, tracking_url: url, status: o.status === "paid" || o.status === "in_production" ? "shipped" : o.status })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TrackingEditor({ initial, onSave }: { initial: { code: string; url: string }; onSave: (code: string, url: string) => void }) {
  const [code, setCode] = useState(initial.code);
  const [url, setUrl] = useState(initial.url);
  return (
    <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
      <Input placeholder="Código de rastreio" value={code} onChange={(e) => setCode(e.target.value)} />
      <Input placeholder="URL de rastreio (opcional)" value={url} onChange={(e) => setUrl(e.target.value)} />
      <Button variant="outline" size="sm" onClick={() => onSave(code, url)}>Salvar rastreio</Button>
    </div>
  );
}