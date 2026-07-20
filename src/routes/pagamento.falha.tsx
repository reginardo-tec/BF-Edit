import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/pagamento/falha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pagamento não concluído — BF Arte & Design" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FailurePage,
});

function FailurePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-600">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Pagamento não concluído</h1>
        <p className="mt-3 text-muted-foreground">
          O pagamento não foi aprovado ou foi cancelado. Você pode tentar novamente.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/checkout">
            <Button size="lg">Tentar novamente</Button>
          </Link>
          <Link to="/catalogo">
            <Button variant="outline" size="lg">Voltar ao catálogo</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}