import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, formatBRL } from "@/lib/cart";
import { Trash2, MessageCircle, CreditCard } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession } from "@/lib/checkout.functions";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "5588996464278";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { items, remove, setQty, total, count, clear } = useCart();
  const checkout = useServerFn(createCheckoutSession);
  const [paying, setPaying] = useState(false);

  const sendWhatsApp = () => {
    if (!items.length) return;
    const lines = items.map((i) => `• ${i.quantity}x ${i.name} — ${formatBRL(i.price * i.quantity)}`).join("%0A");
    const message = `Olá, BF Arte & Design! Gostaria de fazer o pedido:%0A%0A${lines}%0A%0A*Total: ${formatBRL(total)}*`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  const payOnline = async () => {
    if (!items.length) return;
    setPaying(true);
    try {
      const res = await checkout({
        data: { items: items.map((i) => ({ id: i.id, quantity: i.quantity })) },
      });
      window.location.href = res.url;
    } catch (e) {
      toast.error((e as Error).message);
      setPaying(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Seu carrinho ({count})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Seu carrinho está vazio.
              <br />
              Explore o catálogo e adicione seus favoritos ✨
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-xl border border-border/60 bg-card p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <p className="font-medium leading-tight">{i.name}</p>
                    <p className="text-sm text-muted-foreground">{formatBRL(i.price)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={i.quantity}
                        onChange={(e) => setQty(i.id, Number(e.target.value) || 1)}
                        className="h-8 w-16"
                      />
                      <Button variant="ghost" size="icon" onClick={() => remove(i.id)} aria-label="Remover">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="ml-auto font-semibold">{formatBRL(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="border-t border-border/60 pt-4">
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatBRL(total)}</span>
              </div>
              <Button onClick={sendWhatsApp} className="w-full bg-[var(--coral)] text-[var(--coral-foreground)] hover:brightness-105" size="lg">
                <MessageCircle className="mr-2 h-4 w-4" /> Finalizar pelo WhatsApp
              </Button>
              <Button
                onClick={payOnline}
                disabled={paying}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {paying ? "Redirecionando..." : "Pagar online (cartão / Pix / boleto)"}
              </Button>
              <button onClick={clear} className="w-full text-xs text-muted-foreground hover:underline">
                Esvaziar carrinho
              </button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}