export interface BiomeTheme {
  label: string;
  skyTop: string;
  skyBottom: string;
  starColor: string;
  horizonColor: string;
  horizonGlow: string;
  glowColor: string;
  decor: string[];
  danger: boolean;
  bgImageUrl?: string;
}

const DEFAULT: BiomeTheme = {
  label: "Destino desconhecido",
  skyTop: "#0b0b2a",
  skyBottom: "#1a0b3a",
  starColor: "#ffffff",
  horizonColor: "#2a1a4a",
  horizonGlow: "#8a5cff",
  glowColor: "#a78bfa",
  decor: ["✨", "🪐", "☄️", "🌟"],
  danger: false,
};

const THEMES: Record<string, Partial<BiomeTheme>> = {
  marte: { label: "Marte", skyTop: "#3a0d05", skyBottom: "#7a2a10", horizonColor: "#a04020", horizonGlow: "#ff7a3a", glowColor: "#ff9060", decor: ["🪨", "🛸", "☄️"] },
  mercurio: { label: "Mercúrio", skyTop: "#2a1a10", skyBottom: "#5a3a20", horizonColor: "#7a5030", horizonGlow: "#ffb060", glowColor: "#ffcf80", danger: true },
  lua: { label: "Lua", skyTop: "#0a0a1a", skyBottom: "#2a2a3a", horizonColor: "#5a5a6a", horizonGlow: "#c0c0d0", glowColor: "#e0e0f0", decor: ["🌑", "🪨", "⭐"] },
  venus: { label: "Vênus", skyTop: "#4a2a05", skyBottom: "#8a5a15", horizonColor: "#a06025", horizonGlow: "#ffcf60", glowColor: "#ffdf80", danger: true },
  jupiter: { label: "Júpiter", skyTop: "#3a1a05", skyBottom: "#8a5030", horizonColor: "#a06040", horizonGlow: "#ffa060", glowColor: "#ffc080", decor: ["🌪️", "⚡", "☁️"] },
  plutao: { label: "Plutão", skyTop: "#0a0a2a", skyBottom: "#2a2a4a", horizonColor: "#4a4a6a", horizonGlow: "#8ac0ff", glowColor: "#b0d0ff", decor: ["❄️", "🪨", "⭐"] },
  saturno: { label: "Saturno", skyTop: "#2a1a05", skyBottom: "#6a5020", horizonColor: "#8a6030", horizonGlow: "#ffcf80", glowColor: "#ffe0a0", decor: ["🪐", "💫", "⭐"] },
  urano: { label: "Urano", skyTop: "#052a3a", skyBottom: "#158a9a", horizonColor: "#20a0b0", horizonGlow: "#60ffef", glowColor: "#80ffff" },
  netuno: { label: "Netuno", skyTop: "#050a4a", skyBottom: "#154a8a", horizonColor: "#2060a0", horizonGlow: "#60a0ff", glowColor: "#80c0ff" },
  europa: { label: "Europa", skyTop: "#0a1a3a", skyBottom: "#3a5a8a", horizonColor: "#5a7aaa", horizonGlow: "#c0e0ff", glowColor: "#e0f0ff", decor: ["🧊", "❄️", "⭐"] },
  sol: { label: "Sol", skyTop: "#5a2a05", skyBottom: "#ffa020", horizonColor: "#ffcf30", horizonGlow: "#ffff60", glowColor: "#ffffa0", danger: true, decor: ["🔥", "☀️", "💥"] },
};

export function getBiomeTheme(destinationId: string | undefined | null): BiomeTheme {
  if (!destinationId) return DEFAULT;
  const t = THEMES[destinationId];
  return { ...DEFAULT, ...(t ?? { label: destinationId }) };
}
