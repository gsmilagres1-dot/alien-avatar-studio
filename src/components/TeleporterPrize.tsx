import teleporterImg from "@/assets/teleporter-prize.jpg";
import { Lock, Sparkles, Trophy } from "lucide-react";

interface Props {
  visitedCount: number;
  totalCount: number;
  /** "banner" = teaser no topo do painel, "reward" = revelação completa do prêmio. */
  variant?: "banner" | "reward";
}

/**
 * Prêmio final por cumprir os 15 destinos: Teletransportador Cabine Vermelha.
 * - variant="banner": cartão de objetivo no topo do seletor de destinos.
 * - variant="reward": cartão grande que revela o prêmio quando os 15 destinos forem concluídos.
 */
export function TeleporterPrize({ visitedCount, totalCount, variant = "banner" }: Props) {
  const unlocked = visitedCount >= totalCount;
  const remaining = Math.max(0, totalCount - visitedCount);
  const pct = Math.min(100, Math.round((visitedCount / totalCount) * 100));

  if (variant === "reward") {
    return (
      <div className="relative rounded-3xl overflow-hidden border-2 border-accent shadow-neon animate-pulse-neon">
        <img
          src={teleporterImg}
          alt="Teletransportador Cabine Cósmica"
          className="w-full aspect-square object-cover animate-pulse-glow"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {/* cintilação contínua — faíscas de energia */}
        <div className="pointer-events-none absolute inset-0 animate-twinkle">
          <div className="absolute top-[12%] left-[20%] w-1 h-1 rounded-full bg-white shadow-[0_0_10px_3px_oklch(0.85_0.24_155)]" />
          <div className="absolute top-[22%] right-[26%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_12px_4px_oklch(0.75_0.25_200)]" />
          <div className="absolute bottom-[30%] left-[30%] w-1 h-1 rounded-full bg-white shadow-[0_0_10px_3px_oklch(0.85_0.24_155)]" />
          <div className="absolute bottom-[18%] right-[22%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_14px_5px_oklch(0.88_0.26_150)]" />
        </div>
        {/* brilho de vidro percorrendo a imagem */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12" />
        </div>
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest shadow-neon">
          <Trophy className="w-3 h-3" /> Prêmio desbloqueado
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-[10px] uppercase tracking-widest text-accent font-mono">{visitedCount}/{totalCount} destinos quaisquer conquistados</div>
          <h3 className="font-display text-xl text-gradient-neon mt-1">Teletransportador Cósmico</h3>
          <p className="text-xs text-white/90 mt-1">
            Cabine vermelha com 4 turbinas a jato e portal de energia — sua nave pessoal para viajar pelo cosmos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative mb-4 rounded-2xl overflow-hidden border ${unlocked ? "border-accent shadow-neon" : "border-accent/30"} bg-gradient-to-r from-black/60 to-accent/10`}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          <img
            src={teleporterImg}
            alt="Prêmio final"
            width={216}
            height={216}
            loading="lazy"
            className={`w-[216px] h-[216px] rounded-2xl object-cover border-2 brightness-110 ${unlocked ? "border-accent animate-pulse-glow" : "border-accent/40"}`}
          />
          {!unlocked && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-accent/40 text-[10px] font-mono uppercase tracking-widest text-accent font-bold">
              {visitedCount}/{totalCount}
            </div>
          )}
          {unlocked && (
            <>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-accent drop-shadow-[0_0_10px_rgba(0,255,200,0.9)] animate-twinkle" />
              <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-accent drop-shadow-[0_0_8px_rgba(0,255,200,0.8)] animate-twinkle [animation-delay:0.6s]" />
            </>
          )}
          {/* cintilação contínua de energia — visível em ambos os estados */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl animate-twinkle overflow-hidden">
            <div className="absolute top-[15%] left-[20%] w-1 h-1 rounded-full bg-white shadow-[0_0_10px_3px_oklch(0.85_0.24_155)]" />
            <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_12px_4px_oklch(0.75_0.25_200)]" />
            <div className="absolute bottom-[35%] left-[30%] w-1 h-1 rounded-full bg-white shadow-[0_0_10px_3px_oklch(0.85_0.24_155)]" />
            <div className="absolute bottom-[20%] right-[22%] w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_14px_5px_oklch(0.88_0.26_150)]" />
          </div>
          {/* brilho contínuo de vidro */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className={`w-4 h-4 ${unlocked ? "text-accent" : "text-muted-foreground"}`} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Objetivo · Prêmio final
            </span>
          </div>
          <div className="font-display text-base text-gradient-neon truncate">
            Teletransportador Cósmico
          </div>
          <div className="text-xs text-muted-foreground leading-snug">
            {unlocked
              ? "Conquistado! Cabine vermelha com turbinas e portal de energia — sua nave pessoal."
              : `Conquiste ${totalCount} destinos quaisquer e ganhe a cabine sob medida — faltam ${remaining}.`}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
