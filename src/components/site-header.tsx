import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/cart-drawer";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/LOGO.png";

const nav = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
  { to: "/enviar", label: "Enviar arquivos" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const checkRole = async (userId: string | undefined) => {
      if (!userId) return setIsAdmin(false);
      const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" as any });
      setIsAdmin(!!data);
    };
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      checkRole(data.session?.user?.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
      checkRole(s?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="BF Arte & Design" className="h-11 w-11 rounded-full object-contain" />
          <span className="leading-tight" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            <span className="block text-xl font-semibold tracking-wide text-black">BF ARTE & DESIGN</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">papelaria personalizada</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground data-[status=active]:font-semibold"
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCartOpen(true)} aria-label="Abrir carrinho" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--coral)] text-[10px] font-semibold text-[var(--coral-foreground)]">
                {count}
              </span>
            )}
          </Button>
          {authed && (
            <Link to="/meus-pedidos" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm">Meus pedidos</Button>
            </Link>
          )}
          <Link to={authed ? (isAdmin ? "/admin" : "/meus-pedidos") : "/auth"} className="hidden md:inline-flex">
            <Button variant="outline" size="sm">
              {authed ? (isAdmin ? "Admin" : "Minha conta") : "Entrar"}
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium"
                data-active={pathname === n.to}
              >
                {n.label}
              </Link>
            ))}
            {authed && (
              <Link to="/meus-pedidos" onClick={() => setOpen(false)} className="py-3 text-sm font-medium">
                Meus pedidos
              </Link>
            )}
            <Link to={authed ? (isAdmin ? "/admin" : "/meus-pedidos") : "/auth"} onClick={() => setOpen(false)} className="py-3 text-sm font-medium text-primary">
              {authed ? (isAdmin ? "Área administrativa" : "Minha conta") : "Entrar"}
            </Link>
          </nav>
        </div>
      )}

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </header>
  );
}
