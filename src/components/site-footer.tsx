import { Link } from "@tanstack/react-router";
import { Instagram, MessageCircle, MapPin } from "lucide-react";
import logo from "@/assets/LOGO.png";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-[var(--cream)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <img src={logo} alt="BF Arte & Design" className="h-16 w-16 rounded-full object-contain" />
          <p className="mt-3 text-xl font-semibold tracking-wide text-black" style={{ fontFamily: '"Cormorant Garamond", serif' }}>BF ARTE & DESIGN</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Papelaria personalizada feita à mão com carinho, para eternizar os seus momentos.
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> Quixeré — CE
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Navegue</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/catalogo" className="hover:text-primary">Catálogo</Link></li>
            <li><Link to="/sobre" className="hover:text-primary">Sobre</Link></li>
            <li><Link to="/contato" className="hover:text-primary">Contato</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fale com a gente</p>
          <div className="flex gap-3">
            <a href="https://wa.me/5588996464278" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"><MessageCircle className="h-4 w-4" /></a>
            <a href="https://www.instagram.com/bf.arte.design/" target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"><Instagram className="h-4 w-4" /></a>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">(88) 99646-4278</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BF Arte & Design — Todos os direitos reservados
      </div>
    </footer>
  );
}