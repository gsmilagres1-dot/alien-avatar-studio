import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe2, Telescope, Sparkles, Orbit, Star, Layers, Radio } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";
import { TEAM_DESTINATIONS, TEAM_KIND_LABEL, type TeamDestKind } from "@/lib/team-destinations";

export const Route = createFileRoute("/_authenticated/equipes/destinos")({
  component: TeamDestinations,
  head: () => ({
    meta: [
      { title: "Destinos de Equipe — Disputa Intergaláctica" },
      { name: "description", content: "30 destinos exclusivos do modo Equipe: galáxias, nebulosas, exoplanetas, sistemas estelares, aglomerados e quasares." },
    ],
  }),
});

const ICON: Record<TeamDestKind, typeof Globe2> = {
  galaxy: Sparkles,
  nebula: Layers,
  exoplanet: Globe2,
  star_system: Star,
  cluster: Orbit,
  quasar: Radio,
};

function TeamDestinations() {
  return (
    <main className="px-4 py-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl text-gradient-neon">Destinos de Equipe</h1>
        <WalletBadge />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        <Telescope className="inline w-4 h-4 mr-1 text-accent" />
        30 destinos exclusivos do modo Equipe — cada um com 15 perguntas em 3 níveis.
        Disponíveis nas batalhas online de equipe.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEAM_DESTINATIONS.map((d) => {
          const Icon = ICON[d.kind];
          return (
            <div key={d.id} className="glass rounded-xl p-4 border border-accent/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm leading-tight">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                    {TEAM_KIND_LABEL[d.kind]} · {d.constellation} · nível {d.level}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Distância: <span className="text-foreground/80">{d.distance}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Transporte: <span className="text-foreground/80">{d.transport}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-foreground/70 mt-2 line-clamp-2">{d.highlight}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        <Link to="/equipes" className="underline">← voltar para Equipes</Link>
      </div>
    </main>
  );
}
