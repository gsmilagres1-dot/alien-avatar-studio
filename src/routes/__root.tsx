import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TranslationSync } from "@/components/TranslationSync";
import { Soundtrack } from "@/components/Soundtrack";

import appCss from "../styles.css?url";
import type { AuthState } from "@/router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">Esta dimensão não existe.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar à base
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Houve uma anomalia no subespaço</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; auth: AuthState }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Identidade Alien · Sua versão alienígena" },
      { name: "description", content: "Crie sua identidade alienígena com IA grátis: RG universal, passaporte e nave personalizada." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Identidade Alien" },
      { property: "og:description", content: "Vire um alien em segundos. Crie sua identidade, passaporte e nave — grátis." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=JetBrains+Mono:wght@400;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
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
      <AuthBridge />
      <TranslationSync />
      <Outlet />
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  );
}

/** Bridges Supabase session state into the router context and invalidates queries. */
function AuthBridge() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [, force] = useState(0);

  useEffect(() => {
    let mounted = true;

    function publish(auth: AuthState) {
      router.update({ context: { ...router.options.context, auth } });
      router.invalidate();
      queryClient.invalidateQueries();
      force((n) => n + 1);
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      let s = data.session;
      if (!s) {
        const { data: anon } = await supabase.auth.signInAnonymously();
        s = anon.session;
      }
      if (!mounted) return;
      publish({
        isAuthenticated: !!s,
        userId: s?.user.id ?? null,
        email: s?.user.email ?? null,
        loading: false,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      publish({
        isAuthenticated: !!session,
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
        loading: false,
      });
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router, queryClient]);

  return null;
}
