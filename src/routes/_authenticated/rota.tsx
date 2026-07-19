import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock, CheckCircle2 } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";
import { getRouteState } from "@/lib/mining.functions";
import { getBiomeTheme } from "@/lib/space-biomes";

export const Route = createFileRoute("/_authenticated/rota")({
  component: Rota,
  head: () => ({
    meta: [
      { title: "Rota Intergaláctica" },
      { name: "description", content: "Sua jornada de mineração pelo sistema solar e além." },
    ],
  }),
});

function Rota() {
  const getRoute = useServerFn(getRouteState);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["route-state"], queryFn: () => getRoute() });

  if (isLoading || !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground text-sm">
        Carregando rota...
      </div>
    );
  }

  const unlockedSet = new Set(data.unlockedDestinations);
  const clearedSet = new Set(data.clearedDestinations);

  return (
    <main className="px-4 py-6 max-w-2xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl text-gradient-neon">Rota Intergaláctica</h1>
        <WalletBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Sua jornada de mineração pelo sistema solar (e além). Complete um destino pra liberar o próximo.
      </p>

      <div className="flex flex-col gap-3">
        {data.routeOrder.map((id, i) => {
          const theme = getBiomeTheme(id);
          const unlocked = unlockedSet.has(id);
          const cleared = clearedSet.has(id);
          return (
            <div
              key={id}
              className={`relative rounded-2xl overflow-hidden border-2 min-h-[84px] ${
                unlocked ? "border-accent/40" : "border-border"
              }`}
            >
              {theme.bgImageUrl && (
                <img
                  src={theme.bgImageUrl}
                  alt=""
                  loading="lazy"
                  className={`absolute inset-0 w-full h-full object-cover ${
                    unlocked ? "opacity-60" : "opacity-20 grayscale"
                  }`}
                />
              )}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, ${theme.skyTop}55, ${theme.skyBottom}cc)` }}
              />
              <div className="relative z-10 p-4 flex items-center gap-3 h-full">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-display bg-black/40 border border-white/20 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-display text-sm truncate" style={{ color: theme.glowColor }}>
                      {theme.label}
                    </h3>
                    {theme.danger && <span className="text-[10px]" title="Combustível some mais rápido aqui">☢️</span>}
                    {cleared && <CheckCircle2 className="w-3.5 h-3.5 text-teal-300 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-white/70">
                    {cleared ? "Fase completa" : unlocked ? "Disponível pra minerar" : "Bloqueado — complete o anterior"}
                  </p>
                </div>
                {unlocked ? (
                  <button
                    onClick={() => navigate({ to: "/across-age", search: { destinationId: id } })}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-accent text-accent-foreground font-bold whitespace-nowrap"
                  >
                    ⛏️ Minerar
                  </button>
                ) : (
                  <Lock className="w-4 h-4 text-white/50 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        <Link to="/" className="underline">← voltar à home</Link>
      </div>
    </main>
  );
}
