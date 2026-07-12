import { getDestination, type BadgeTier } from "@/lib/intergalactic";
import badgeGold from "@/assets/badge-gold.png";
import badgeSilver from "@/assets/badge-silver.png";
import badgeBronze from "@/assets/badge-bronze.png";

interface Props {
  destinationId: string;
  destinationName: string;
  tier?: BadgeTier | null;
  size?: number; // px, default 80
}

const TIER_IMG: Record<BadgeTier, string> = {
  gold: badgeGold,
  silver: badgeSilver,
  bronze: badgeBronze,
};

const TIER_TEXT: Record<BadgeTier, string> = {
  gold: "#3a2606",
  silver: "#1f2430",
  bronze: "#2a1607",
};

const TIER_LABEL: Record<BadgeTier, string> = {
  gold: "OURO · 100%",
  silver: "PRATA · 8/9",
  bronze: "BRONZE · 6–7/9",
};

const TIER_GLOW: Record<BadgeTier, string> = {
  gold: "drop-shadow(0 0 10px rgba(230,192,103,0.55))",
  silver: "drop-shadow(0 0 10px rgba(200,210,225,0.45))",
  bronze: "drop-shadow(0 0 10px rgba(200,145,100,0.45))",
};

/** Posição vertical da fita (banner) onde gravamos o nome do destino,
 *  ajustada por formato do selo. */
const TIER_RIBBON: Record<BadgeTier, { bottomPct: number; heightPct: number; widthPct: number }> = {
  // arco/dome: fita estende abaixo, perto da base
  gold:   { bottomPct: 0.09, heightPct: 0.14, widthPct: 0.74 },
  // escudo: fita drapejada na base
  silver: { bottomPct: 0.10, heightPct: 0.13, widthPct: 0.78 },
  // medalha redonda: faixa curva no interior do selo, mais alta
  bronze: { bottomPct: 0.24, heightPct: 0.14, widthPct: 0.55 },
};

/**
 * Selo de destino conquistado — moldura metálica raster (ouro/prata/bronze)
 * com o nome do destino gravado na fita inferior do emblema.
 */
export function DestinationBadge({ destinationId, destinationName, tier, size = 80 }: Props) {
  const dest = getDestination(destinationId);
  const t: BadgeTier = tier ?? "bronze";
  const img = TIER_IMG[t];

  // Trim long names to fit the ribbon
  const label = (dest?.name ?? destinationName).toUpperCase();
  const fitted = label.length > 14 ? label.slice(0, 13) + "…" : label;
  const ribbon = TIER_RIBBON[t];
  const ribbonFont = Math.max(7, Math.round(size * (fitted.length > 10 ? 0.075 : 0.1) * (t === "bronze" ? 0.85 : 1)));

  return (
    <div
      className="relative inline-flex flex-col items-center group"
      style={{ width: size }}
      title={`${destinationName} · ${TIER_LABEL[t]}`}
    >
      <div
        className="relative transition-transform group-hover:scale-105"
        style={{ width: size, height: size, filter: TIER_GLOW[t] }}
      >
        <img
          src={img}
          alt={`Selo ${t} de ${destinationName}`}
          width={size}
          height={size}
          loading="lazy"
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
        {/* Nome do destino gravado na fita do emblema */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
          style={{
            bottom: `${Math.round(size * ribbon.bottomPct)}px`,
            height: `${Math.round(size * ribbon.heightPct)}px`,
            width: `${Math.round(size * ribbon.widthPct)}px`,
          }}
        >
          <span
            className="font-display font-extrabold tracking-wide text-center leading-none"
            style={{
              fontSize: `${ribbonFont}px`,
              color: TIER_TEXT[t],
              textShadow: "0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            {fitted}
          </span>
        </div>
      </div>
      <span
        className="mt-1 text-[9px] font-mono uppercase tracking-widest leading-none"
        style={{ color: t === "gold" ? "#e6c067" : t === "silver" ? "#c8d2e1" : "#c89164" }}
      >
        {TIER_LABEL[t]}
      </span>
    </div>
  );
}
