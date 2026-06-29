import wormholeImg from "@/assets/wormhole-prize.jpg";
import { Lock, Sparkles, Trophy } from "lucide-react";
import { WORMHOLE_RING_THRESHOLDS, WORMHOLE_RING_TOTAL } from "@/lib/intergalactic";

interface Props {
  visitedCount: number;
  /** "banner" = teaser compacto. "reward" = revelação grande. */
  variant?: "banner" | "reward";
}

/**
 * Prêmio progressivo após o Teletransportador: 6 segmentos do anel do buraco
 * de minhoca, conquistados a cada 5 destinos extras (15, 20, 25, 30, 35, 40).
 *
 * A imagem cósmica é dividida em uma grade 2x3. Cada célula só revela sua
 * fatia da imagem depois que o número de destinos exigido for atingido.
 */
export function WormholePrize({ visitedCount, variant = "banner" }: Props) {
  const earnedCount = WORMHOLE_RING_THRESHOLDS.filter((t) => visitedCount >= t).length;
  const fullyUnlocked = earnedCount >= WORMHOLE_RING_TOTAL;
  const nextThreshold = WORMHOLE_RING_THRESHOLDS[earnedCount] ?? null;
  const remaining = nextThreshold ? Math.max(0, nextThreshold - visitedCount) : 0;

  // Grid 2 colunas x 3 linhas. Cada célula mostra um pedaço fixo da imagem
  // via background-position, montando a imagem completa quando todos os 6
  // segmentos forem conquistados.
  const cells = Array.from({ length: WORMHOLE_RING_TOTAL }, (_, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const threshold = WORMHOLE_RING_THRESHOLDS[i];
    const unlocked = visitedCount >= threshold;
    return { i, col, row, threshold, unlocked };
  });

  const size = variant === "reward" ? "w-full" : "w-[216px]";

  const mosaic = (
    <div
      className={`relative grid grid-cols-2 grid-rows-3 gap-0.5 rounded-2xl overflow-hidden border-2 aspect-square ${size} ${
        fullyUnlocked ? "border-accent shadow-neon animate-pulse-glow" : "border-accent/40"
      } bg-black`}
    >
      {cells.map((c) => (
        <div key={c.i} className="relative overflow-hidden bg-black/60">
          {c.unlocked ? (
            <div
              className="absolute inset-0 animate-pulse-glow"
              style={{
                backgroundImage: `url(${wormholeImg})`,
                backgroundSize: "200% 300%",
                backgroundPosition: `${c.col * 100}% ${c.row * 50}%`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black via-accent/5 to-black">
              <Lock className="w-4 h-4 text-accent/40" />
              <span className="absolute bottom-1 right-1 text-[8px] font-mono text-accent/60">
                {c.threshold}
              </span>
            </div>
          )}
        </div>
      ))}
      {/* brilho de vidro percorrendo o mosaico */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shine bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
      </div>
    </div>
  );

  if (variant === "reward") {
    return (
      <div className="relative rounded-3xl overflow-hidden border-2 border-accent/60 bg-gradient-to-b from-black/60 to-accent/10 p-4">
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest shadow-neon z-10">
          <Trophy className="w-3 h-3" /> Buraco de minhoca {earnedCount}/{WORMHOLE_RING_TOTAL}
        </div>
        {mosaic}
        <div className="mt-4">
          <h3 className="font-display text-xl text-gradient-neon">Túnel do Buraco de Minhoca</h3>
          <p className="text-xs text-white/80 mt-1">
            {fullyUnlocked
              ? "Túnel completo! Os 6 segmentos do anel formam seu portal pessoal entre galáxias."
              : `Conquiste mais ${remaining} destino${remaining === 1 ? "" : "s"} para ganhar o próximo segmento do anel.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative mb-4 rounded-2xl overflow-hidden border ${
        fullyUnlocked ? "border-accent shadow-neon" : "border-accent/30"
      } bg-gradient-to-r from-black/60 to-accent/10`}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="relative shrink-0">
          {mosaic}
          {fullyUnlocked && (
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-accent drop-shadow-[0_0_10px_rgba(0,255,200,0.9)] animate-twinkle" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className={`w-4 h-4 ${fullyUnlocked ? "text-accent" : "text-muted-foreground"}`} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Prêmio progressivo · {earnedCount}/{WORMHOLE_RING_TOTAL} segmentos
            </span>
          </div>
          <div className="font-display text-base text-gradient-neon truncate">
            Túnel do Buraco de Minhoca
          </div>
          <div className="text-xs text-muted-foreground leading-snug">
            {fullyUnlocked
              ? "Túnel completo — portal pessoal entre galáxias."
              : nextThreshold
                ? `Próximo segmento aos ${nextThreshold} destinos · faltam ${remaining}.`
                : "Conquiste o Teletransportador para começar a montar o anel."}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${(earnedCount / WORMHOLE_RING_TOTAL) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
