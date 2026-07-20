import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatBRL } from "@/lib/cart";
import { useServerFn } from "@tanstack/react-start";
import { quoteShipping, type ShippingOption } from "@/lib/shipping.functions";
import { createCheckoutSession } from "@/lib/checkout.functions";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Finalizar compra — BF Arte & Design" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type Step = "auth" | "address" | "payment";

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, count } = useCart();
  const [step, setStep] = useState<Step>("auth");
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? null });
        setStep("address");
      }
      setCheckingSession(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? null });
        setStep((s) => (s === "auth" ? "address" : s));
      } else {
        setUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!checkingSession && count === 0) {
      toast.info("Seu carrinho está vazio.");
      navigate({ to: "/catalogo", replace: true });
    }
  }, [checkingSession, count, navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-5 py-16 text-center text-muted-foreground">
          Carregando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl md:text-4xl">Finalizar compra</h1>
        <Stepper step={step} />

        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <div>
            {step === "auth" && <AuthStep onDone={() => setStep("address")} />}
            {step === "address" && user && (
              <AddressStep
                userEmail={user.email}
                items={items}
                onDone={() => setStep("payment")}
                onBack={() => setStep("auth")}
                onSubmit={(data) => setCheckoutData(data)}
                data={checkoutData}
                setData={setCheckoutData}
              />
            )}
            {step === "payment" && user && checkoutData && (
              <PaymentStep
                items={items}
                data={checkoutData}
                user={user}
                onBack={() => setStep("address")}
              />
            )}
          </div>
          <OrderSummary
            items={items}
            total={total}
            shipping={step === "payment" && checkoutData ? checkoutData.shipping.price : 0}
          />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

type CheckoutData = {
  address: {
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
  };
  shipping: ShippingOption;
};

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "auth", label: "Cadastro" },
    { key: "address", label: "Endereço & Frete" },
    { key: "payment", label: "Pagamento" },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <div className="mt-6 flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
              i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i < idx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`text-sm ${i <= idx ? "font-medium" : "text-muted-foreground"}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="mx-2 h-px w-8 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function AuthStep({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/checkout`,
        },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Cadastro criado!");
      onDone();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Bem-vindo(a)!");
      onDone();
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="font-display text-2xl">
        {mode === "signup" ? "Crie sua conta" : "Entrar"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Para acompanhar seu pedido e receber o código de rastreamento.
      </p>

      <div className="mt-4 flex gap-2 text-sm">
        <button
          onClick={() => setMode("signup")}
          className={`rounded-full px-3 py-1 ${mode === "signup" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          Criar conta
        </button>
        <button
          onClick={() => setMode("signin")}
          className={`rounded-full px-3 py-1 ${mode === "signin" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          Já tenho conta
        </button>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "signup" && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "Aguarde..." : mode === "signup" ? "Criar conta e continuar" : "Entrar e continuar"}
        </Button>
      </form>
    </div>
  );
}

function AddressStep({
  userEmail,
  items,
  onDone,
  onBack,
  data,
  setData,
}: {
  userEmail: string | null;
  items: { id: string; quantity: number }[];
  onDone: () => void;
  onBack: () => void;
  onSubmit: (d: CheckoutData) => void;
  data: CheckoutData | null;
  setData: (d: CheckoutData | null) => void;
}) {
  const quote = useServerFn(quoteShipping);
  const [addr, setAddr] = useState({
    zip: data?.address.zip ?? "",
    street: data?.address.street ?? "",
    number: data?.address.number ?? "",
    complement: data?.address.complement ?? "",
    neighborhood: data?.address.neighborhood ?? "",
    city: data?.address.city ?? "",
    state: data?.address.state ?? "",
  });
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selected, setSelected] = useState<string>(data?.shipping.id ?? "");
  const [loadingCep, setLoadingCep] = useState(false);
  const [quoting, setQuoting] = useState(false);

  const lookupCep = async (rawZip: string) => {
    const zip = rawZip.replace(/\D/g, "");
    if (zip.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setAddr((a) => ({
          ...a,
          zip,
          street: d.logradouro || a.street,
          neighborhood: d.bairro || a.neighborhood,
          city: d.localidade || a.city,
          state: (d.uf || a.state).toUpperCase(),
        }));
      }
    } catch {}
    setLoadingCep(false);
  };

  const getQuote = async () => {
    const zip = addr.zip.replace(/\D/g, "");
    if (zip.length !== 8) return toast.error("Digite um CEP válido");
    setQuoting(true);
    try {
      const opts = await quote({ data: { zip, items: items.map((i) => ({ id: i.id, quantity: i.quantity })) } });
      setOptions(opts);
      if (opts.length && !selected) setSelected(opts[0].id);
      if (opts.length === 0) toast.error("Nenhum serviço disponível para este CEP");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setQuoting(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addr.street || !addr.number || !addr.city || !addr.state)
      return toast.error("Preencha o endereço completo");
    const opt = options.find((o) => o.id === selected);
    if (!opt) return toast.error("Escolha uma forma de envio");
    setData({ address: { ...addr, zip: addr.zip.replace(/\D/g, "") }, shipping: opt });
    onDone();
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border/60 bg-card p-6 space-y-6">
      <div>
        <h2 className="font-display text-2xl">Endereço de entrega</h2>
        <p className="mt-1 text-sm text-muted-foreground">Conta: {userEmail}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="zip">CEP</Label>
          <div className="flex gap-2">
            <Input
              id="zip"
              value={addr.zip}
              onChange={(e) => setAddr({ ...addr, zip: e.target.value })}
              onBlur={(e) => lookupCep(e.target.value)}
              placeholder="00000-000"
              inputMode="numeric"
              required
            />
            <Button type="button" variant="outline" onClick={getQuote} disabled={quoting || loadingCep}>
              {quoting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calcular"}
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="street">Rua</Label>
          <Input id="street" required value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="number">Número</Label>
          <Input id="number" required value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="complement">Complemento</Label>
          <Input id="complement" value={addr.complement} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" value={addr.neighborhood} onChange={(e) => setAddr({ ...addr, neighborhood: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">Estado (UF)</Label>
          <Input id="state" required maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase() })} />
        </div>
      </div>

      {options.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Forma de envio</h3>
          <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
            {options.map((o) => (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 ${
                  selected === o.id ? "border-primary bg-primary/5" : "border-border/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={o.id} id={`ship-${o.id}`} />
                  <div>
                    <p className="font-medium">
                      {o.company} · {o.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Entrega em até {o.delivery_time} dia(s) úteis
                    </p>
                  </div>
                </div>
                <span className="font-semibold">{formatBRL(o.price)}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      )}

      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" size="lg">
          Continuar para pagamento
        </Button>
      </div>
    </form>
  );
}

function PaymentStep({
  items,
  data,
  user,
  onBack,
}: {
  items: { id: string; quantity: number; name: string; price: number }[];
  data: CheckoutData;
  user: { id: string; email: string | null };
  onBack: () => void;
}) {
  const checkout = useServerFn(createCheckoutSession);
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      const res = await checkout({
        data: {
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          shipping_option_id: data.shipping.id,
          shipping_address: data.address,
          buyer: { email: user.email ?? undefined },
        },
      });
      window.location.href = res.url;
    } catch (e) {
      toast.error((e as Error).message);
      setPaying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
      <h2 className="font-display text-2xl">Pagamento</h2>
      <div className="rounded-lg bg-muted/50 p-4 text-sm">
        <p><strong>Endereço:</strong> {data.address.street}, {data.address.number}{data.address.complement ? ` — ${data.address.complement}` : ""}</p>
        <p>{data.address.neighborhood ? `${data.address.neighborhood} · ` : ""}{data.address.city}/{data.address.state} · CEP {data.address.zip}</p>
        <p className="mt-2"><strong>Envio:</strong> {data.shipping.company} — {data.shipping.name} ({formatBRL(data.shipping.price)})</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Você será redirecionado ao ambiente seguro para escolher cartão, Pix ou boleto.
      </p>
      <div className="flex justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={paying}>
          Voltar
        </Button>
        <Button onClick={pay} disabled={paying} size="lg">
          {paying ? "Redirecionando..." : "Pagar agora"}
        </Button>
      </div>
    </div>
  );
}

function OrderSummary({
  items,
  total,
  shipping,
}: {
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  shipping: number;
}) {
  return (
    <aside className="h-fit rounded-2xl border border-border/60 bg-card p-6">
      <h3 className="font-semibold">Resumo do pedido</h3>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between gap-2">
            <span>{i.quantity}x {i.name}</span>
            <span>{formatBRL(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-border/60 pt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatBRL(total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Frete</span>
          <span>{shipping > 0 ? formatBRL(shipping) : "—"}</span>
        </div>
        <div className="mt-2 flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatBRL(total + shipping)}</span>
        </div>
      </div>
    </aside>
  );
}