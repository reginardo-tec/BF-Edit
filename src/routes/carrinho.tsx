import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart, formatBRL } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/carrinho")({
  component: Carrinho,
});

function Carrinho() {
  const { items, remove, setQty, clear, total, count } = useCart();

  const handleWhatsApp = () => {
    if (items.length === 0) return;
    
    const pedido = items.map(item => 
      `* ${item.name} (x${item.quantity}) - ${formatBRL(item.price * item.quantity)}`
    ).join("\n");

    const mensagem = `Olá! Gostaria de fazer o seguinte pedido:\n\n${pedido}\n\n*Total: ${formatBRL(total)}`;
    
    const url = `https://wa.me/5588996464278?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
          <ShoppingBag className="h-20 w-20 text-muted-foreground mb-6" />
          <h2 className="text-3xl font-display">Seu carrinho está vazio</h2>
          <p className="mt-3 text-muted-foreground">Que tal explorar nosso catálogo?</p>
          <Link to="/catalogo">
            <Button className="mt-8 rounded-full">Ver produtos</Button>
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-12">
        <h1 className="font-display text-4xl">Seu Carrinho ({count})</h1>

        <div className="mt-8 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="flex gap-6 rounded-2xl border border-border/60 bg-card p-6">
              {item.image && (
                <img src={item.image} alt={item.name} className="h-28 w-28 rounded-xl object-cover" />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{formatBRL(item.price)}</p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center rounded-full border">
                    <Button variant="ghost" size="sm" onClick={() => setQty(item.id, item.quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="px-4 font-medium">{item.quantity}</span>
                    <Button variant="ghost" size="sm" onClick={() => setQty(item.id, item.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove(item.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right font-semibold">
                {formatBRL(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-end border-t pt-8">
          <p className="text-2xl font-semibold">Total: {formatBRL(total)}</p>
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={clear}>Limpar Carrinho</Button>
            <Button onClick={handleWhatsApp} className="rounded-full">
              Finalizar pedido no WhatsApp
            </Button>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
