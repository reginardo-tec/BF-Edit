import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Heart, Leaf, Sparkles } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — BF Arte & Design" },
      { name: "description", content: "Conheça a história da BF Arte & Design, ateliê de papelaria personalizada." },
      { property: "og:title", content: "Sobre a BF Arte & Design" },
      { property: "og:description", content: "Papelaria personalizada feita à mão com carinho." },
      { property: "og:url", content: "https://bfartedesign.shop/sobre" },
    ],
    links: [{ rel: "canonical", href: "https://bfartedesign.shop/sobre" }],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--coral)]">Nossa história</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl text-balance">
          Um ateliê feito de <span className="italic">papel, tinta</span> e afeto
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          A BF Arte & Design nasceu do desejo de transformar objetos do dia a dia em pequenas
          lembranças especiais. Cada agenda, caderno, foto e cartão é pensado, desenhado e
          finalizado à mão, respeitando o gosto de quem vai receber.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { icon: Heart, title: "Feito à mão", text: "Cada peça é única e produzida com muito cuidado." },
            { icon: Leaf, title: "Materiais escolhidos", text: "Papéis, tintas e acabamentos selecionados a dedo." },
            { icon: Sparkles, title: "100% personalizado", text: "Tudo pode ser ajustado ao seu estilo e ocasião." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/20">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="mt-4 font-display text-xl">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}