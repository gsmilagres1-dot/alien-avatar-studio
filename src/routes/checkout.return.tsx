import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    const dest = next && next.startsWith("/") ? next : "/criar";
    const t = setTimeout(() => navigate({ to: dest }), 1800);
    return () => clearTimeout(t);
  }, [navigate, next]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 text-center max-w-sm">
        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
        <h1 className="font-display text-xl mt-4 text-gradient-neon">Pagamento recebido</h1>
        <p className="text-xs text-muted-foreground mt-2">Confirmando transmissão na Federação...</p>
      </div>
    </main>
  );
}
