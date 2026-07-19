import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Rocket, Images, Globe2, Home, Share2, Users, Gamepad2, Map, Menu, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  if (auth.loading || !auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xs font-mono text-muted-foreground animate-pulse">
          Conectando à Federação Galáctica…
        </div>
      </div>
    );
  }

  const navItems = [
    { to: "/criar", label: "Criar", icon: Rocket },
    { to: "/galaxia", label: "Viagem", icon: Globe2 },
    { to: "/rota", label: "Across Age (Rota)", icon: Gamepad2 },
    { to: "/galeria", label: "Galeria", icon: Images },
    { to: "/pilotos", label: "Pilotos", icon: Users },
  ];

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 glass border-b border-accent/20">
        <div className="max-w-5xl mx-auto px-3 h-14 flex items-center justify-between gap-2">
          <Link to="/criar" className="flex items-center gap-1.5 font-display font-bold shrink-0 whitespace-nowrap min-w-0">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span className="text-gradient-neon truncate">Identidade Alien</span>
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Link to="/" className="p-2 rounded-full hover:bg-accent/10 inline-flex items-center" title="Página inicial">
              <Home className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-accent/10 inline-flex items-center"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Dropdown — cabe em qualquer largura de tela, sem cortar nada */}
        {menuOpen && (
          <div className="absolute right-2 top-14 z-40 w-56 rounded-xl border border-accent/20 glass shadow-lg overflow-hidden">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent/10"
              >
                <Icon className="w-4 h-4 shrink-0" /> <span>{label}</span>
              </Link>
            ))}
            <button
              onClick={() => { shareApp(); setMenuOpen(false); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent/10 w-full text-left border-t border-accent/10"
            >
              <Share2 className="w-4 h-4 shrink-0" /> <span>Compartilhar app</span>
            </button>
            <div className="px-4 py-2.5 border-t border-accent/10">
              <LanguageSwitcher compact />
            </div>
          </div>
        )}
      </nav>
      <Outlet />
    </div>
  );
}
