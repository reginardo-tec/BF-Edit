import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { resolveImageUrl } from "@/lib/products";
import { formatBRL, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const [img, setImg] = useState<string | null>(null);
  const { add } = useCart();

  useEffect(() => {
    let alive = true;
    resolveImageUrl(product.image_url).then((u) => alive && setImg(u));
    return () => {
      alive = false;
    };
  }, [product.image_url]);

  const soldOut = product.stock <= 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:shadow-[var(--shadow-soft)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center bg-[var(--gradient-brand)] text-primary-foreground/70 font-display text-2xl">bf</div>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-full bg-[var(--coral)] px-3 py-1 text-xs font-semibold text-[var(--coral-foreground)]">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{product.category}</p>
        <h3 className="font-display text-lg leading-tight">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-semibold">{formatBRL(Number(product.price))}</span>
          <Button
            size="sm"
            disabled={soldOut}
            onClick={() => {
              add({ id: product.id, name: product.name, price: Number(product.price), image: img });
              toast.success(`${product.name} adicionado ao carrinho`);
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}