import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { CalendarDays, Ruler, Palette, Sparkles, MessageCircle } from "lucide-react";

const TITLE = "Como escolher um planner personalizado — Guia BF Arte & Design";
const DESCRIPTION =
  "Guia completo para escolher o planner personalizado ideal: layouts (diário, semanal, mensal), tamanhos, capas e personalização feita à mão pela BF Arte & Design.";
const URL = "https://bfartedesign.shop/guia-planner";

export const Route = createFileRoute("/guia-planner")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Como escolher um planner personalizado",
          description: DESCRIPTION,
          author: { "@type": "Organization", name: "BF Arte & Design" },
          publisher: { "@type": "Organization", name: "BF Arte & Design" },
          mainEntityOfPage: URL,
          inLanguage: "pt-BR",
        }),
      },
    ],
  }),
  component: GuiaPlanner,
});

function GuiaPlanner() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--coral)]">
          Guia BF Arte & Design
        </p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl text-balance">
          Como escolher o <span className="italic">planner personalizado</span> ideal
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Um planner personalizado une organização e afeto: acompanha seu ritmo, o seu estilo
          e ainda vira uma pequena obra feita à mão. Este guia mostra como escolher o layout,
          o tamanho e a personalização perfeitos para a sua rotina.
        </p>

        <section className="mt-12 space-y-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl">1. Defina o layout: diário, semanal ou mensal</h2>
          </div>
          <p className="text-muted-foreground">
            Se você tem muitos compromissos por dia (aulas, consultas, blocos de trabalho), o layout
            <strong> diário</strong> costuma render mais. Para quem planeja por metas e projetos,
            o layout <strong>semanal</strong> traz uma visão de conjunto sem sobrecarregar.
            Um layout <strong>mensal</strong> funciona como visão macro — ótimo para acompanhar
            hábitos, ciclos e prazos longos.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-3">
            <Ruler className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl">2. Escolha o tamanho pelo uso, não pelo gosto</h2>
          </div>
          <p className="text-muted-foreground">
            <strong>A5</strong> é o tamanho mais equilibrado: cabe na bolsa e ainda deixa espaço
            confortável para escrever. <strong>A4</strong> é ideal para quem faz mapas mentais,
            desenhos e listas longas. <strong>A6 / pocket</strong> serve como companheiro rápido,
            ótimo para quem já usa outro caderno principal.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl">3. Personalize a capa e as folhas internas</h2>
          </div>
          <p className="text-muted-foreground">
            Na BF Arte & Design cada planner pode ter nome, cores, papel de miolo (pautado,
            pontilhado ou liso) e acabamentos como wire-o, capa dura ou brochura. Envie sua
            paleta favorita, uma foto de referência ou uma frase — cuidamos do resto à mão.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl">4. Pense nas seções fixas</h2>
          </div>
          <p className="text-muted-foreground">
            Além do calendário, planners personalizados podem trazer páginas para metas anuais,
            controle financeiro, hábitos, leituras, viagens e gratidão. Escolha 2 a 4 seções
            fixas que você realmente vai usar — mais que isso costuma virar decoração.
          </p>
        </section>

        <section className="mt-12 rounded-2xl bg-[var(--gradient-warm)] p-8 text-center text-white md:p-12">
          <h2 className="font-display text-2xl md:text-3xl">Vamos desenhar o seu?</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/90">
            Nos conte como é a sua rotina e montamos um planner personalizado do zero para você.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5588996464278" target="_blank" rel="noreferrer">
              <Button size="lg" className="rounded-full bg-white text-[var(--coral)] hover:bg-white/95">
                <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
              </Button>
            </a>
            <Link to="/catalogo">
              <Button size="lg" variant="outline" className="rounded-full border-white text-white hover:bg-white/10">
                Ver catálogo
              </Button>
            </Link>
          </div>
        </section>
      </article>
      <SiteFooter />
    </div>
  );
}