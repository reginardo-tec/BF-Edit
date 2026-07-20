import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/pagamento/sucesso")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    order_id: typeof s.order_id === "string" ? s.order_id : undefined,
    pendente: s.pendente === "1" || s.pendente === 1,
  }),
  head: () => ({
    meta: [
      { title: "Pagamento — BF Arte & Design" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { pendente } = useSearch({ from: "/pagamento/sucesso" });
  const navigate = useNavigate();
  const { clear } = useCart();

  useEffect(() => {
    clear();
    if (pendente) {
      toast.info("Pagamento em processamento. Você será avisado assim que aprovado.");
    } else {
      toast.success("Pagamento aprovado! 🎉");
    }
    supabase.auth.getUser().then(({ data }) => {
      const to = data.user ? "/meus-pedidos" : "/auth";
      const t = setTimeout(() => navigate({ to, replace: true }), 2500);
      return () => clearTimeout(t);
    });
  }, [clear, navigate, pendente]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
          {pendente ? <Clock className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
        </div>
        <h1 className="mt-6 font-display text-3xl">
          {pendente ? "Pagamento em análise" : "Pagamento aprovado!"}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {pendente
            ? "Assim que aprovado, você verá aqui e receberá um aviso."
            : "Seu pedido foi confirmado. Redirecionando para Meus Pedidos..."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/meus-pedidos">
            <Button size="lg">Ver meus pedidos</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}