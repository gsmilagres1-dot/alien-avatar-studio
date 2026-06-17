import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Sparkles, Rocket, Images, Globe2, Home, Share2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";

async function shareApp() {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const text = "Vire um alien! Crie sua identidade galáctica grátis 👽🚀";
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try { await (navigator as any).share({ title: "Identidade Alien", text, url }); return; } catch {}
  }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast.success("Link copiado!"); } catch {}
}

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { auth } = Route.useRouteContext();


  if (auth.loading || !auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xs font-mono text-muted-foreground animate-pulse">
          Conectando à Federação Galáctica…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 glass border-b border-accent/20">
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <Link to="/criar" className="flex items-center gap-1.5 font-display font-bold shrink-0 whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span className="text-gradient-neon hidden sm:inline">Identidade Alien</span>
          </Link>
          <div className="flex items-center gap-0.5 text-xs whitespace-nowrap">
            <Link to="/" className="px-2 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center" title="Página inicial">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <button onClick={shareApp} className="px-2 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center" title="Compartilhar app">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <Link to="/criar" className="px-2 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1">
              <Rocket className="w-3.5 h-3.5" /> <span>Criar</span>
            </Link>
            <Link to="/galaxia" className="px-2 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5" /> <span>Viagem</span>
            </Link>
            <Link to="/galeria" className="px-2 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1">
              <Images className="w-3.5 h-3.5" /> <span>Galeria</span>
            </Link>
            <LanguageSwitcher compact />
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
