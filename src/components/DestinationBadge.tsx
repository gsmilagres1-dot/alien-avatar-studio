import type * as React from "react";
import { getDestination, type DestinationKind } from "@/lib/intergalactic";

interface Props {
  destinationId: string;
  destinationName: string;
  kind?: DestinationKind;
  size?: number; // px, default 64
}

/**
 * Selo metálico conquistado por destino. Forma e cor variam por tipo:
 * - sun     → estrela em ouro
 * - planet  → hexágono em prata
 * - moon    → escudo em cobre/bronze
 * - fatal   → estrela jagged em chumbo/vermelho
 */
export function DestinationBadge({ destinationId, destinationName, kind, size = 64 }: Props) {
  const dest = getDestination(destinationId);
  const k: DestinationKind = kind ?? dest?.kind ?? "planet";
  const palette = METAL[k];
  const Shape = SHAPE[k];
  const gradId = `g-${destinationId}`;
  const rimId = `r-${destinationId}`;

  return (
    <div
      className="relative inline-flex flex-col items-center group"
      style={{ width: size + 18 }}
      title={destinationName}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] transition-transform group-hover:scale-105"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="45%" stopColor={palette.mid} />
            <stop offset="60%" stopColor={palette.shine} />
            <stop offset="100%" stopColor={palette.dark} />
          </linearGradient>
          <linearGradient id={rimId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.dark} />
            <stop offset="50%" stopColor={palette.light} />
            <stop offset="100%" stopColor={palette.dark} />
          </linearGradient>
        </defs>
        <Shape gradId={gradId} rimId={rimId} />
        {/* Nome curto gravado no selo */}
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill={palette.engrave}
          style={{ fontFamily: "ui-sans-serif, system-ui", letterSpacing: "0.5px" }}
        >
          {short(destinationName)}
        </text>
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fontSize="5"
          fill={palette.engrave}
          opacity="0.7"
          style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "1px" }}
        >
          VISTO · OK
        </text>
      </svg>
      <span className="mt-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-center leading-tight">
        {destinationName}
      </span>
    </div>
  );
}

function short(name: string) {
  const n = name.replace(/\(.*\)/, "").trim();
  return n.length > 10 ? n.slice(0, 9) + "·" : n;
}

const METAL: Record<DestinationKind, { light: string; mid: string; shine: string; dark: string; engrave: string }> = {
  sun:    { light: "#fff3c2", mid: "#e6c067", shine: "#fff7d6", dark: "#7a5418", engrave: "#3a2606" },
  planet: { light: "#f4f6fa", mid: "#b8bec8", shine: "#ffffff", dark: "#4a5160", engrave: "#1f2430" },
  moon:   { light: "#f3d7b3", mid: "#c89164", shine: "#ffe6c8", dark: "#5b3211", engrave: "#2a1607" },
  fatal:  { light: "#d8a8a8", mid: "#7a3030", shine: "#f0c8c8", dark: "#2a0808", engrave: "#150202" },
};

interface ShapeProps { gradId: string; rimId: string }

function HexShape({ gradId, rimId }: ShapeProps) {
  return (
    <>
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill={`url(#${rimId})`} />
      <polygon points="50,10 87,30 87,70 50,90 13,70 13,30" fill={`url(#${gradId})`} />
      <polygon points="50,14 83,32 83,68 50,86 17,68 17,32" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6" />
    </>
  );
}

function SunShape({ gradId, rimId }: ShapeProps) {
  // Starburst
  const pts: string[] = [];
  const cx = 50, cy = 50;
  const rOuter = 48, rInner = 36;
  const spikes = 16;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return (
    <>
      <polygon points={pts.join(" ")} fill={`url(#${rimId})`} />
      <circle cx="50" cy="50" r="34" fill={`url(#${gradId})`} stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.4" />
    </>
  );
}

function ShieldShape({ gradId, rimId }: ShapeProps) {
  return (
    <>
      <path d="M50 4 L92 16 L92 56 Q92 80 50 96 Q8 80 8 56 L8 16 Z" fill={`url(#${rimId})`} />
      <path d="M50 10 L87 20 L87 56 Q87 76 50 90 Q13 76 13 56 L13 20 Z" fill={`url(#${gradId})`} />
      <path d="M50 14 L83 23 L83 56 Q83 73 50 85 Q17 73 17 56 L17 23 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
    </>
  );
}

function JaggedStarShape({ gradId, rimId }: ShapeProps) {
  const pts: string[] = [];
  const cx = 50, cy = 50, rO = 48, rI = 20;
  const spikes = 8;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? rO : rI;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return (
    <>
      <polygon points={pts.join(" ")} fill={`url(#${rimId})`} />
      <circle cx="50" cy="50" r="26" fill={`url(#${gradId})`} />
    </>
  );
}

const SHAPE: Record<DestinationKind, (p: ShapeProps) => React.ReactElement> = {
  sun: SunShape,
  planet: HexShape,
  moon: ShieldShape,
  fatal: JaggedStarShape,
};
