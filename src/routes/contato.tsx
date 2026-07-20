import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { MessageCircle, Instagram, MapPin } from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — BF Arte & Design" },
      { name: "description", content: "Entre em contato com a BF Arte & Design para encomendas personalizadas." },
      { property: "og:title", content: "Contato — BF Arte & Design" },
      { property: "og:description", content: "Fale conosco pelo WhatsApp, Instagram ou e-mail." },
      { property: "og:url", content: "https://bfartedesign.shop/contato" },
    ],
    links: [{ rel: "canonical", href: "https://bfartedesign.shop/contato" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "BF Arte & Design",
          url: "https://bfartedesign.shop",
          image: "https://bfartedesign.shop/favicon.ico",
          telephone: "+55-88-99646-4278",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Quixeré",
            addressRegion: "CE",
            addressCountry: "BR",
          },
          sameAs: ["https://www.instagram.com/bf.arte.design/"],
        }),
      },
    ],
  }),
  component: Contato,
});

function Contato() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--coral)]">Contato</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Vamos conversar?</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Encomendas personalizadas, dúvidas ou sugestões — respondemos com carinho por qualquer um destes canais.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <a href="https://wa.me/5588996464278" target="_blank" rel="noreferrer" className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary hover:shadow-[var(--shadow-soft)]">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground"><MessageCircle className="h-5 w-5" /></div>
            <div>
              <p className="font-display text-lg">WhatsApp</p>
              <p className="text-sm text-muted-foreground">(88) 99646-4278</p>
            </div>
          </a>
          <a href="https://www.instagram.com/bf.arte.design/" target="_blank" rel="noreferrer" className="group flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-primary hover:shadow-[var(--shadow-soft)]">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground"><Instagram className="h-5 w-5" /></div>
            <div>
              <p className="font-display text-lg">Instagram</p>
              <p className="text-sm text-muted-foreground">@bf.arte.design — veja nossas novidades</p>
            </div>
          </a>
          <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-6">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground"><MapPin className="h-5 w-5" /></div>
            <div>
              <p className="font-display text-lg">Endereço</p>
              <p className="text-sm text-muted-foreground">Quixeré — CE</p>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl bg-[var(--gradient-warm)] p-8 text-center text-white md:p-12">
          <h2 className="font-display text-2xl md:text-3xl">Quer algo totalmente único?</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/90">Nos conte a sua ideia e criamos um personalizado especial para você.</p>
          <a href="https://wa.me/5588996464278" target="_blank" rel="noreferrer">
            <Button size="lg" className="mt-6 rounded-full bg-white text-[var(--coral)] hover:bg-white/95">Chamar no WhatsApp</Button>
          </a>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}