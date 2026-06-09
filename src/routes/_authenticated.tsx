import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Sparkles, Rocket, Images, Globe2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/criar" className="flex items-center gap-2 font-display font-bold">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-gradient-neon">Identidade Alien</span>
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <Link to="/criar" className="px-3 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5" /> Criar
            </Link>
            <Link to="/galaxia" className="px-3 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" /> Galáxia
            </Link>
            <Link to="/galeria" className="px-3 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5" /> Galeria
            </Link>
            <LanguageSwitcher compact />

          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
