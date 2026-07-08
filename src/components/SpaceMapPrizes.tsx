import { useEffect, useState } from "react";
import { Lock, Sparkles, X, Trophy } from "lucide-react";
import {
  SPACE_MAP_PRIZES,
  loadClaimedPrizes,
  markPrizeClaimed,
  type SpaceMapPrize,
} from "@/lib/space-map-prizes";

interface Props {
  /** Selos conquistados no NOVO mapa (mapa espacial). */
  sealsCount: number;
  /** Se o mapa espacial já foi liberado (45/45 do mapa principal). */
  unlocked: boolean;
}

/**
 * Trilha de prêmios do Mapa Espacial: 5, 10, 15, 20, 25 selos.
 * Cada prêmio é uma surpresa (imagem borrada + "?") até o usuário
 * atingir o threshold, quando abre um modal celebrando a conquista.
 */
export function SpaceMapPrizes({ sealsCount, unlocked }: Props) {
  const [reveal, setReveal] = useState<SpaceMapPrize | null>(null);

  useEffect(() => {
    if (!unlocked) return;
    const claimed = loadClaimedPrizes();
    const next = SPACE_MAP_PRIZES.find(
      (p) => sealsCount >= p.threshold && !claimed.has(p.id),
    );
    if (next) {
      markPrizeClaimed(next.id);
      setReveal(next);
    }
  }, [sealsCount, unlocked]);

  return (
    <section className="mt-4">
      <header className="mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent" />
        <h3 className="font-display text-sm text-gradient-neon">Trilha de prêmios · Mapa Espacial</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          selos: {sealsCount}
        </span>
      </header>

      <div className="grid gap-3">
        {SPACE_MAP_PRIZES.map((p) => (
          <PrizeBanner key={p.id} prize={p} sealsCount={sealsCount} unlocked={unlocked} onOpen={() => setReveal(p)} />
        ))}
      </div>

      {reveal && <PrizeModal prize={reveal} onClose={() => setReveal(null)} />}
    </section>
  );
}

function PrizeBanner({
  prize,
  sealsCount,
  unlocked,
  onOpen,
}: {
  prize: SpaceMapPrize;
  sealsCount: number;
  unlocked: boolean;
  onOpen: () => void;
}) {
  const achieved = unlocked && sealsCount >= prize.threshold;
  const remaining = Math.max(0, prize.threshold - sealsCount);
  const pct = Math.min(100, Math.round((sealsCount / prize.threshold) * 100));

  return (
    <button
      onClick={achieved ? onOpen : undefined}
      disabled={!achieved}
      className={`text-left relative rounded-2xl overflow-hidden border bg-gradient-to-r from-black/60 to-accent/10 transition ${
        achieved ? `${prize.accent} hover:scale-[1.01]` : "border-accent/25"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative shrink-0">
          <img
            src={prize.image}
            alt={achieved ? prize.title : "Prêmio surpresa"}
            width={96}
            height={96}
            loading="lazy"
            className={`w-24 h-24 rounded-xl object-cover border-2 transition ${
              achieved ? "border-accent animate-pulse-glow" : "border-accent/30 blur-2xl scale-95 opacity-40"
            }`}
          />
          {!achieved && (
            <div className="absolute inset-0 rounded-xl bg-black/60 flex flex-col items-center justify-center">
              <div className="text-3xl font-display text-accent/80">?</div>
              <Lock className="w-4 h-4 text-accent/70 mt-0.5" />
            </div>
          )}
          {achieved && (
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-accent drop-shadow-[0_0_10px_currentColor] animate-twinkle" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
            {prize.threshold} selos · {achieved ? "conquistado" : `faltam ${remaining}`}
          </div>
          <div className={`font-display text-sm truncate ${achieved ? "text-gradient-neon" : "text-muted-foreground"}`}>
            {achieved ? prize.title : "?? ??? surpresa ???"}
          </div>
          <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
            {achieved ? prize.subtitle : `Complete ${prize.threshold} objetivos do novo mapa para revelar.`}
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${achieved ? "bg-accent" : "bg-accent/60"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function PrizeModal({ prize, onClose }: { prize: SpaceMapPrize; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-card rounded-2xl border-2 border-accent overflow-hidden animate-in fade-in zoom-in-95">
        <div className="relative">
          <img
            src={prize.image}
            alt={prize.title}
            width={512}
            height={512}
            loading="lazy"
            className="w-full aspect-square object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 hover:bg-black/80"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest">
            <Trophy className="w-3 h-3" /> {prize.threshold} selos
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="text-[10px] uppercase tracking-widest text-accent font-mono">{prize.subtitle}</div>
            <h3 className="font-display text-xl text-white mt-1">{prize.title}</h3>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-foreground/90 leading-relaxed">{prize.message}</p>
          {prize.extra && (
            <div className="text-xs text-muted-foreground leading-relaxed border-l-2 border-accent/60 pl-3">
              {prize.extra}
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-bold text-sm"
          >
            Continuar explorando
          </button>
        </div>
      </div>
    </div>
  );
}
