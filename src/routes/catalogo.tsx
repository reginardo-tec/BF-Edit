import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { fetchProducts, type Product, CATEGORIES } from "@/lib/products";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — BF Arte & Design" },
      { name: "description", content: "Todos os produtos da BF Arte & Design: agendas, cadernos, polaroids, fotos e cartões personalizados." },
      { property: "og:title", content: "Catálogo — BF Arte & Design" },
      { property: "og:description", content: "Explore todos os personalizados da loja." },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (q && !`${p.name} ${p.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [products, cat, q]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--coral)]">Loja</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">Catálogo completo</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Escolha entre nossos personalizados feitos à mão. Adicione ao carrinho e finalize pelo WhatsApp.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar produtos..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat("")}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${cat === "" ? "border-primary bg-primary text-primary-foreground" : "border-border/60 hover:border-primary"}`}
            >
              Todos
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCat(c.value)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${cat === c.value ? "border-primary bg-primary text-primary-foreground" : "border-border/60 hover:border-primary"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-16 text-center text-muted-foreground">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}