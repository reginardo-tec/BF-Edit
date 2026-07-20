import { createFileRoute } from "@tanstack/react-router";
import logo from "@/assets/LOGO.png";

export const Route = createFileRoute("/manutencao")({
  head: () => ({
    meta: [
      { title: "Em manutenção — BF Arte & Design" },
      { name: "description", content: "Estamos preparando super novidades. Voltamos em breve." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--cream)]">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[var(--coral)]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <img
          src={logo}
          alt="BF Arte & Design"
          className="h-28 w-28 rounded-full object-contain shadow-lg ring-4 ring-background md:h-36 md:w-36"
        />

        <h1
          className="mt-8 text-3xl font-semibold tracking-wide text-black md:text-5xl"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          BF ARTE & DESIGN
        </h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-muted-foreground md:text-xs">
          papelaria personalizada
        </p>

        <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--coral)]" />
          Em manutenção
        </div>

        <h2
          className="mt-6 max-w-xl text-2xl leading-tight text-foreground md:text-4xl"
          style={{ fontFamily: '"Fraunces", serif' }}
        >
          Estamos preparando super novidades para você
        </h2>
        <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
          Nosso site está passando por uma atualização especial. Voltamos muito em breve com novidades incríveis feitas à mão, com todo carinho. ✨
        </p>

        <p className="mt-10 text-xs text-muted-foreground">
          Enquanto isso, fale com a gente pelo WhatsApp ou Instagram.
        </p>
      </main>
    </div>
  );
}