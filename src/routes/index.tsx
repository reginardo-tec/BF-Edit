import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { fetchProducts, type Product, CATEGORIES } from "@/lib/products";
import { ArrowRight, Sparkles, Heart, Package } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  useEffect(() => {
    fetchProducts().then((p) => setFeatured(p.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
              <Sparkles className="h-3 w-3" /> Feito à mão com carinho
            </span>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-6xl text-balance">
              Papelaria que <span className="italic text-[var(--coral)]">conta</span> a sua história
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Agendas, cadernos, polaroids, fotos e cartões de visita personalizados —
              detalhes que transformam o cotidiano em memória.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/catalogo">
                <Button size="lg" className="rounded-full">
                  Ver catálogo <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <a href="https://wa.me/5588996464278" target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline" className="rounded-full">
                  Encomendar personalizado
                </Button>
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[var(--gradient-brand)] opacity-40 blur-3xl" />
            <img
              src={hero}
              alt="Papelaria personalizada da BF Arte & Design"
              width={1600}
              height={1200}
              className="rounded-3xl shadow-[var(--shadow-lifted)]"
            />
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--coral)]">O que fazemos</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Nossas categorias</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              to="/catalogo"
              search={{ cat: c.value } as never}
              className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card p-4 text-center transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-soft)]"
            >
              <Package className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--coral)]">Selecionados</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">Destaques da loja</h2>
          </div>
          <Link to="/catalogo" className="hidden text-sm font-medium text-primary hover:underline md:inline">
            Ver todos →
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-12 text-center text-muted-foreground">
            Em breve, novos produtos por aqui ✨
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Sobre */}
      <section className="mx-auto my-16 max-w-5xl rounded-[2rem] bg-[var(--gradient-brand)] px-6 py-14 text-center md:px-16">
        <Heart className="mx-auto mb-3 h-6 w-6 text-[var(--coral)]" />
        <h2 className="mx-auto max-w-2xl font-display text-3xl md:text-4xl text-balance">
          Cada peça é única — assim como as histórias que ela guarda
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/80">
          Trabalhamos com atenção aos detalhes, materiais escolhidos a dedo e muito
          amor pelo que fazemos. Encomende o seu personalizado e receba algo pensado só para você.
        </p>
        <Link to="/contato">
          <Button size="lg" className="mt-6 rounded-full bg-[var(--coral)] text-[var(--coral-foreground)] hover:brightness-105">
            Quero encomendar
          </Button>
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
