import { useEffect, useMemo, useState } from "react";
import {
  Period,
  aggregateSeries,
  fetchOrderItemsSince,
  fetchOrdersSince,
  periodStart,
  topProducts,
  type OrderItemRow,
  type OrderRow,
} from "@/lib/analytics";
import { formatBRL } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { DollarSign, ShoppingBag, Package, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
];

export function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = periodStart(period).toISOString();
    setLoading(true);
    Promise.all([fetchOrdersSince(since), fetchOrderItemsSince(since)])
      .then(([o, i]) => {
        setOrders(o);
        setItems(i);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  const paid = useMemo(
    () => orders.filter((o) => o.status === "paid" || o.status === "approved"),
    [orders],
  );
  const revenue = useMemo(
    () => orders.reduce((s, o) => s + o.total_cents, 0) / 100,
    [orders],
  );
  const paidRevenue = useMemo(
    () => paid.reduce((s, o) => s + o.total_cents, 0) / 100,
    [paid],
  );
  const totalItems = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items],
  );
  const avgTicket = orders.length ? revenue / orders.length : 0;

  const series = useMemo(() => aggregateSeries(period, orders), [period, orders]);
  const top = useMemo(() => topProducts(items, 5), [items]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe vendas, faturamento e produtos mais vendidos.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-border/60 bg-background p-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Faturamento total"
          value={formatBRL(revenue)}
          hint={`${formatBRL(paidRevenue)} pagos`}
        />
        <MetricCard
          icon={ShoppingBag}
          label="Pedidos"
          value={String(orders.length)}
          hint={`${paid.length} confirmados`}
        />
        <MetricCard
          icon={Package}
          label="Itens vendidos"
          value={String(totalItems)}
        />
        <MetricCard
          icon={TrendingUp}
          label="Ticket médio"
          value={formatBRL(avgTicket)}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-background p-4">
        <h3 className="mb-3 font-display text-lg">Faturamento no período</h3>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : series.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum pedido registrado neste período ainda.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v: number, key) =>
                    key === "revenue" ? formatBRL(Number(v)) : String(v)
                  }
                />
                <Bar dataKey="revenue" name="Faturamento" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-background p-4">
        <h3 className="mb-3 font-display text-lg">Itens mais vendidos</h3>
        {top.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Sem dados suficientes.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {top.map((t, idx) => (
              <li key={t.name + idx} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{t.name}</span>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{t.quantity} un.</div>
                  <div className="text-muted-foreground">{formatBRL(t.revenue)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}