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
  silver: "PRATA · 80–90%",
  bronze: "BRONZE · 70%",
};

const TIER_GLOW: Record<BadgeTier, string> = {
  gold: "drop-shadow(0 0 10px rgba(230,192,103,0.55))",
  silver: "drop-shadow(0 0 10px rgba(200,210,225,0.45))",
  bronze: "drop-shadow(0 0 10px rgba(200,145,100,0.45))",
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
  const fitted = label.length > 16 ? label.slice(0, 15) + "…" : label;
  const ribbonFont = Math.max(8, Math.round(size * (fitted.length > 11 ? 0.085 : 0.11)));

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
        {/* Nome do destino gravado na fita inferior */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
          style={{
            bottom: `${Math.round(size * 0.14)}px`,
            height: `${Math.round(size * 0.16)}px`,
          }}
        >
          <span
            className="font-display font-extrabold tracking-wide text-center px-1 leading-none"
            style={{
              fontSize: `${ribbonFont}px`,
              color: TIER_TEXT[t],
              textShadow: "0 1px 0 rgba(255,255,255,0.35)",
              maxWidth: "78%",
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
