import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BF Arte & Design — Papelaria Personalizada" },
      { name: "description", content: "Agendas, cadernos, polaroids, fotos e cartões de visita feitos à mão pela BF Arte & Design." },
      { name: "author", content: "BF Arte & Design" },
      { property: "og:site_name", content: "BF Arte & Design" },
      { property: "og:title", content: "BF Arte & Design — Papelaria Personalizada" },
      { property: "og:description", content: "Agendas, cadernos, polaroids, fotos e cartões de visita feitos à mão pela BF Arte & Design." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "BF Arte & Design — Papelaria Personalizada" },
      { name: "twitter:description", content: "Agendas, cadernos, polaroids, fotos e cartões de visita feitos à mão pela BF Arte & Design." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/49d3601d-0e02-468e-abcf-2111bf935453/id-preview-9bd1e3c1--d6a3091f-57de-4337-bf32-57a9c682ffe5.lovable.app-1783036138786.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/49d3601d-0e02-468e-abcf-2111bf935453/id-preview-9bd1e3c1--d6a3091f-57de-4337-bf32-57a9c682ffe5.lovable.app-1783036138786.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "BF Arte & Design",
          url: "https://bfartedesign.shop",
          inLanguage: "pt-BR",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "BF Arte & Design",
          url: "https://bfartedesign.shop",
          logo: "https://bfartedesign.shop/favicon.ico",
          sameAs: ["https://www.instagram.com/bf.arte.design/"],
          contactPoint: [
            {
              "@type": "ContactPoint",
              telephone: "+55-88-99646-4278",
              contactType: "customer service",
              areaServed: "BR",
              availableLanguage: ["Portuguese"],
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <MaintenanceGate />
        <Outlet />
        <Toaster position="top-right" richColors />
      </CartProvider>
    </QueryClientProvider>
  );
}

const MAINTENANCE_ALLOWED_PREFIXES = ["/manutencao", "/admin", "/auth", "/_authenticated"];

function MaintenanceGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [uploadsMaint, setUploadsMaint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("maintenance_mode, uploads_maintenance")
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setEnabled(!!data?.maintenance_mode);
        setUploadsMaint(!!data?.uploads_maintenance);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const isUploads = pathname === "/enviar" || pathname.startsWith("/enviar/");
    if (isUploads) {
      if (uploadsMaint) navigate({ to: "/manutencao", replace: true });
      return;
    }
    if (!enabled) return;
    const allowed = MAINTENANCE_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!allowed) navigate({ to: "/manutencao", replace: true });
  }, [enabled, uploadsMaint, pathname, navigate]);

  return null;
}
