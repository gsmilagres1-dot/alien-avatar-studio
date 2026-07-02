import wormholeImg from "@/assets/wormhole-prize.jpg";
import { Lock, Sparkles, Orbit } from "lucide-react";
import { WORMHOLE_SURPRISE_THRESHOLD } from "@/lib/intergalactic";

interface Props {
  visitedCount: number;
  /** "banner" = teaser compacto (mistério até desbloquear). "reward" = revelação grande. */
  variant?: "banner" | "reward";
}

/**
 * Prêmio SURPRESA intermediário — Portal do Buraco de Minhoca.
 * Aparece antes do Telescópio Jimmy Wath: ao atingir 42 destinos com selo,
 * o portal é revelado. Enquanto bloqueado, aparece como "?" e imagem borrada.
 */
export function WormholeSurprisePrize({ visitedCount, variant = "banner" }: Props) {
  const total = WORMHOLE_SURPRISE_THRESHOLD;
  const unlocked = visitedCount >= total;
  const remaining = Math.max(0, total - visitedCount);
  const pct = Math.min(100, Math.round((visitedCount / total) * 100));

  if (variant === "reward") {
    return (
      <div className="relative rounded-3xl overflow-hidden border-2 border-fuchsia-400 shadow-[0_0_40px_-5px_oklch(0.75_0.25_320)] animate-pulse-neon">
        <img
          src={wormholeImg}
          alt="Portal do Buraco de Minhoca"
          className="w-full aspect-square object-cover animate-pulse-glow"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 animate-twinkle">
          <div className="absolute top-[18%] left-[26%] w-1 h-1 rounded-full bg-white shadow-[0_0_10px_3px_oklch(0.85_0.25_320)]" />
          <div className="absolute top-[30%] right-[22%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_14px_5px_oklch(0.8_0.25_300)]" />
          <div className="absolute bottom-[30%] left-[24%] w-1 h-1 rounded-full bg-white shadow-[0_0_10px_3px_oklch(0.85_0.25_320)]" />
          <div className="absolute bottom-[20%] right-[28%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_14px_5px_oklch(0.8_0.25_280)]" />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" />
        </div>
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-400 text-black text-[10px] font-bold uppercase tracking-widest shadow-[0_0_18px_oklch(0.85_0.25_320)]">
          <Orbit className="w-3 h-3" /> Prêmio surpresa
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-[10px] uppercase tracking-widest text-fuchsia-200 font-mono">
            {visitedCount}/{total} destinos · portal aberto
          </div>
          <h3 className="font-display text-xl text-fuchsia-100 mt-1">Portal do Buraco de Minhoca</h3>
          <p className="text-xs text-white/90 mt-1">
            Atalho cósmico exclusivo — encurta o caminho até o Telescópio Jimmy Wath.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative mb-4 rounded-2xl overflow-hidden border ${unlocked ? "border-fuchsia-400 shadow-[0_0_24px_-6px_oklch(0.85_0.25_320)]" : "border-fuchsia-500/30"} bg-gradient-to-r from-black/60 to-fuchsia-500/10`}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          <img
            src={wormholeImg}
            alt={unlocked ? "Portal do Buraco de Minhoca" : "Prêmio surpresa"}
            width={140}
            height={140}
            loading="lazy"
            className={`w-[140px] h-[140px] rounded-2xl object-cover border-2 transition-[filter] ${unlocked ? "border-fuchsia-400 animate-pulse-glow blur-0" : "border-fuchsia-500/40 blur-2xl scale-95 opacity-40"}`}
          />
          {!unlocked && (
            <>
              <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-display text-fuchsia-300/80 drop-shadow-[0_0_12px_oklch(0.85_0.25_320)]">?</div>
                  <Lock className="w-5 h-5 text-fuchsia-300/70 mx-auto mt-1" />
                </div>
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-fuchsia-500/40 text-[10px] font-mono uppercase tracking-widest text-fuchsia-300 font-bold">
                {visitedCount}/{total}
              </div>
            </>
          )}
          {unlocked && (
            <>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-fuchsia-300 drop-shadow-[0_0_10px_oklch(0.85_0.25_320)] animate-twinkle" />
              <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-fuchsia-300 drop-shadow-[0_0_8px_oklch(0.85_0.25_320)] animate-twinkle [animation-delay:0.6s]" />
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Orbit className={`w-4 h-4 ${unlocked ? "text-fuchsia-300" : "text-muted-foreground"}`} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Prêmio surpresa · {total} destinos
            </span>
          </div>
          <div className={`font-display text-base truncate ${unlocked ? "text-fuchsia-100" : "text-muted-foreground"}`}>
            {unlocked ? "Portal do Buraco de Minhoca" : "?? ? ??? surpresa ??"}
          </div>
          <div className="text-xs text-muted-foreground leading-snug">
            {unlocked
              ? "Portal aberto! Um atalho cósmico antes do telescópio."
              : `Alcance ${total} destinos com selo para abrir o portal — faltam ${remaining}.`}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-400 to-purple-300 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
