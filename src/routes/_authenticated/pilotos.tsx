import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Trophy, X, Rocket, Sparkles, ChevronRight, Users } from "lucide-react";
import { listPilotsRanking, getPilotDetail } from "@/lib/pilots.functions";

export const Route = createFileRoute("/_authenticated/pilotos")({ component: PilotosPage });

const SPECIES_EMOJI: Record<string, string> = {
  starseed: "✨",
  nordico: "💫",
  grey: "👽",
  reptiliano: "🐉",
  draconiano: "🔥",
  insectoide: "🦋",
};

function speciesEmoji(planetId?: string | null, species?: string | null) {
  if (planetId && SPECIES_EMOJI[planetId]) return SPECIES_EMOJI[planetId];
  const s = (species ?? "").toLowerCase();
  for (const k of Object.keys(SPECIES_EMOJI)) if (s.includes(k)) return SPECIES_EMOJI[k];
  return "🛸";
}

function PilotosPage() {
  const listFn = useServerFn(listPilotsRanking);
  const { data, isLoading } = useQuery({
    queryKey: ["pilots-ranking"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });
  const [openUser, setOpenUser] = useState<string | null>(null);

  return (
    <main className="max-w-3xl mx-auto px-3 py-5">
      <header className="mb-4">
        <h1 className="font-display text-2xl text-gradient-neon flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" /> Pilotos inscritos
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Ranking dos alienígenas inscritos na Federação. Clique em um piloto para ver a identidade em uso.
        </p>
        {data && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-mono">
            <Sparkles className="w-3 h-3 text-accent" /> {data.total} pilotos na Federação
          </div>
        )}
      </header>

      {isLoading && (
        <div className="py-10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
        </div>
      )}

      {!isLoading && (data?.rows ?? []).length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-10">Ninguém por aqui ainda.</div>
      )}

      <ol className="space-y-2">
        {(data?.rows ?? []).map((row, i) => {
          const pos = i + 1;
          const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : null;
          const flag = speciesEmoji(row.identity?.planet_id, row.identity?.species);
          return (
            <li key={row.userId}>
              <button
                onClick={() => setOpenUser(row.userId)}
                className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  pos <= 3
                    ? "border-accent/60 bg-gradient-to-r from-accent/10 to-transparent shadow-neon"
                    : "border-border/50 bg-black/30 hover:border-accent/40"
                }`}
              >
                <div className="shrink-0 w-9 text-center">
                  <div className={`font-display text-lg ${pos <= 3 ? "text-accent" : "text-white/70"}`}>
                    {medal ?? pos}
                  </div>
                </div>
                <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden border border-accent/30 bg-black/60 flex items-center justify-center">
                  {row.identity?.avatar_url ? (
                    <img
                      src={row.identity.avatar_url}
                      alt={row.displayName}
                      loading="lazy"
                      className="w-full h-full object-cover object-[center_25%]"
                    />
                  ) : (
                    <Rocket className="w-4 h-4 text-accent/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg leading-none">{flag}</span>
                    <span className="font-display truncate">{row.displayName}</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono truncate">
                    {row.identity?.alien_name ?? "sem identidade ativa"}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 pr-1">
                  <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_6px_oklch(0.85_0.2_90)]" />
                  <span className="font-mono text-sm">{row.visas}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {openUser && <PilotDetailModal userId={openUser} onClose={() => setOpenUser(null)} />}
    </main>
  );
}

function PilotDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const detailFn = useServerFn(getPilotDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["pilot-detail", userId],
    queryFn: () => detailFn({ data: { userId } }),
  });
  const identity = data?.identity ?? null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-auto rounded-3xl border-2 border-accent/60 bg-background shadow-neon"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
          <div className="font-display text-sm text-gradient-neon flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Identidade em uso
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        {isLoading && (
          <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
        )}
        {!isLoading && !identity && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Este piloto ainda não tem identidade ativa.
          </div>
        )}
        {identity && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-[112px_1fr] gap-4">
              <div className="relative">
                <div className="w-28 h-32 rounded-xl overflow-hidden border border-accent/40 shadow-neon bg-black/60">
                  {identity.avatar_url ? (
                    <img src={identity.avatar_url} alt={identity.alien_name ?? ""} className="w-full h-full object-cover object-[center_25%]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Rocket className="w-6 h-6 text-accent/60" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-mono font-bold">
                  VERIFIED
                </div>
              </div>
              <div className="space-y-1.5">
                <Row label="Nome alien" value={identity.alien_name} highlight />
                <Row label="Espécie" value={identity.species} />
                <Row label="Origem" value={identity.planet_id} />
                <Row label="Nasc. galáctico" value={identity.galactic_birth} />
                <Row label="Nº Universal" value={identity.id_number} mono />
              </div>
            </div>
            {identity.ship_image_url && (
              <div className="rounded-xl overflow-hidden border border-accent/20">
                <img src={identity.ship_image_url} alt="Nave" loading="lazy" className="w-full h-40 object-cover" />
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Nave · {identity.ship_category ?? "—"}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-black/40 px-3 py-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Selos conquistados</div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="font-mono text-sm">{data?.visasCount ?? 0}</span>
              </div>
            </div>
            <Link
              to="/galeria"
              className="block text-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent"
            >
              ver minha própria galeria →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight, mono }: { label: string; value?: string | null; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-sm leading-tight ${highlight ? "text-gradient-neon font-display text-base" : ""} ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}
