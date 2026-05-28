import { createFileRoute, redirect, Outlet, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Sparkles, Rocket, Images, Globe2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated && !context.auth.loading) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { auth } = Route.useRouteContext();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-30 glass border-b border-accent/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/_authenticated/criar" className="flex items-center gap-2 font-display font-bold">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-gradient-neon">Identidade Alien</span>
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <Link to="/_authenticated/criar" className="px-3 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5" /> Criar
            </Link>
            <Link to="/_authenticated/galeria" className="px-3 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5" /> Galeria
            </Link>
            <button onClick={logout} className="px-3 py-1.5 rounded-full hover:bg-accent/10 inline-flex items-center gap-1.5" title={auth.email ?? ""}>
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
