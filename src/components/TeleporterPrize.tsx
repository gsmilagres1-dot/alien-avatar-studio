import teleporterImg from "@/assets/teleporter-prize.jpg";
import { Sparkles, Trophy } from "lucide-react";

interface Props {
  visitedCount: number;
  totalCount: number;
  /** "banner" = teaser pequeno no topo do painel, "reward" = revelação completa do prêmio. */
  variant?: "banner" | "reward";
}

/**
 * Prêmio final por cumprir os 15 destinos: Teletransportador Cabine Vermelha.
 * - variant="banner": pequeno cartão de objetivo no topo do seletor de destinos.
 * - variant="reward": cartão grande que revela o prêmio quando os 15 destinos forem concluídos.
 */
export function TeleporterPrize({ visitedCount, totalCount, variant = "banner" }: Props) {
  const unlocked = visitedCount >= totalCount;
  const remaining = Math.max(0, totalCount - visitedCount);
  const pct = Math.min(100, Math.round((visitedCount / totalCount) * 100));

  if (variant === "reward") {
    return (
      <div className="relative rounded-3xl overflow-hidden border-2 border-accent shadow-neon">
        <img
          src={teleporterImg}
          alt="Teletransportador Cabine Cósmica"
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest shadow-neon">
          <Trophy className="w-3 h-3" /> Prêmio desbloqueado
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-[10px] uppercase tracking-widest text-accent font-mono">15/15 destinos conquistados</div>
          <h3 className="font-display text-xl text-gradient-neon mt-1">Teletransportador Cósmico</h3>
          <p className="text-xs text-white/85 mt-1">
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
      <div className="flex items-center gap-3 p-3">
        <div className="relative shrink-0">
          <img
            src={teleporterImg}
            alt="Prêmio final"
            width={72}
            height={72}
            loading="lazy"
            className={`w-[72px] h-[72px] rounded-xl object-cover border ${unlocked ? "border-accent" : "border-accent/40 opacity-80"}`}
          />
          {!unlocked && (
            <div className="absolute inset-0 rounded-xl bg-black/45 flex items-center justify-center">
              <span className="text-[9px] font-mono uppercase tracking-widest text-accent font-bold">
                {visitedCount}/{totalCount}
              </span>
            </div>
          )}
          {unlocked && (
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-accent drop-shadow-[0_0_6px_rgba(0,255,200,0.8)]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className={`w-3.5 h-3.5 ${unlocked ? "text-accent" : "text-muted-foreground"}`} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Objetivo · Prêmio final
            </span>
          </div>
          <div className="font-display text-sm text-gradient-neon truncate">
            Teletransportador Cósmico
          </div>
          <div className="text-[11px] text-muted-foreground leading-tight">
            {unlocked
              ? "Conquistado! Cabine vermelha com turbinas e portal de energia — sua nave pessoal."
              : `Conquiste os ${totalCount} destinos e ganhe a cabine sob medida — faltam ${remaining}.`}
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
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
