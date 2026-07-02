import telescopeImg from "@/assets/prize-jimmy-wath.png";
import { Lock, Sparkles, Telescope } from "lucide-react";

interface Props {
  visitedCount: number;
  totalCount: number;
  /** "banner" = teaser no topo do painel, "reward" = revelação completa do prêmio. */
  variant?: "banner" | "reward";
}

/**
 * Prêmio surpresa por completar TODOS os 45 destinos com selo:
 * Super Telescópio Atômico "Jimmy Wath".
 * Enquanto bloqueado, aparece como "?" e imagem borrada — o prêmio
 * é uma surpresa que vai destravar os próximos passos do app.
 */
export function TelescopePrize({ visitedCount, totalCount, variant = "banner" }: Props) {
  const unlocked = visitedCount >= totalCount;
  const remaining = Math.max(0, totalCount - visitedCount);
  const pct = Math.min(100, Math.round((visitedCount / totalCount) * 100));

  if (variant === "reward") {
    return (
      <div className="relative rounded-3xl overflow-hidden border-2 border-yellow-400 shadow-[0_0_40px_-5px_oklch(0.85_0.2_90)] animate-pulse-neon">
        <img
          src={telescopeImg}
          alt="Super Telescópio Atômico Jimmy Wath"
          className="w-full aspect-square object-cover animate-pulse-glow"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 animate-twinkle">
          <div className="absolute top-[14%] left-[22%] w-1 h-1 rounded-full bg-white shadow-[0_0_10px_3px_oklch(0.9_0.2_90)]" />
          <div className="absolute top-[24%] right-[24%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_14px_5px_oklch(0.85_0.22_60)]" />
          <div className="absolute bottom-[28%] left-[28%] w-1 h-1 rounded-full bg-white shadow-[0_0_10px_3px_oklch(0.9_0.2_90)]" />
          <div className="absolute bottom-[16%] right-[24%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_14px_5px_oklch(0.9_0.22_80)]" />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" />
        </div>
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-bold uppercase tracking-widest shadow-[0_0_18px_oklch(0.9_0.2_90)]">
          <Telescope className="w-3 h-3" /> Prêmio surpresa
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-[10px] uppercase tracking-widest text-yellow-300 font-mono">
            {visitedCount}/{totalCount} destinos com selo · TODOS conquistados
          </div>
          <h3 className="font-display text-xl text-yellow-200 mt-1">Super Telescópio Jimmy Wath</h3>
          <p className="text-xs text-white/90 mt-1">
            Telescópio atômico exclusivo — abre os próximos capítulos do app: asteroides, cometas, naves e satélites.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative mb-4 rounded-2xl overflow-hidden border ${unlocked ? "border-yellow-400 shadow-[0_0_24px_-6px_oklch(0.9_0.2_90)]" : "border-yellow-500/30"} bg-gradient-to-r from-black/60 to-yellow-500/10`}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          <img
            src={telescopeImg}
            alt={unlocked ? "Super Telescópio Jimmy Wath" : "Prêmio surpresa"}
            width={140}
            height={140}
            loading="lazy"
            className={`w-[140px] h-[140px] rounded-2xl object-cover border-2 transition-[filter] ${unlocked ? "border-yellow-400 animate-pulse-glow blur-0" : "border-yellow-500/40 blur-2xl scale-95 opacity-40"}`}
          />
          {!unlocked && (
            <>
              <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-display text-yellow-300/80 drop-shadow-[0_0_12px_oklch(0.85_0.2_90)]">?</div>
                  <Lock className="w-5 h-5 text-yellow-300/70 mx-auto mt-1" />
                </div>
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-yellow-500/40 text-[10px] font-mono uppercase tracking-widest text-yellow-300 font-bold">
                {visitedCount}/{totalCount}
              </div>
            </>
          )}
          {unlocked && (
            <>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 drop-shadow-[0_0_10px_oklch(0.9_0.2_90)] animate-twinkle" />
              <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-300 drop-shadow-[0_0_8px_oklch(0.9_0.2_90)] animate-twinkle [animation-delay:0.6s]" />
            </>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Telescope className={`w-4 h-4 ${unlocked ? "text-yellow-300" : "text-muted-foreground"}`} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Prêmio surpresa · 45 destinos
            </span>
          </div>
          <div className={`font-display text-base truncate ${unlocked ? "text-yellow-200" : "text-muted-foreground"}`}>
            {unlocked ? "Super Telescópio Jimmy Wath" : "?? ? ??? surpresa ??"}
          </div>
          <div className="text-xs text-muted-foreground leading-snug">
            {unlocked
              ? "Desbloqueado! Novos módulos do app foram liberados."
              : `Complete os ${totalCount} destinos com selo para revelar o prêmio surpresa — faltam ${remaining}.`}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
