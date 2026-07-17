// Tipos e utilitários do mini-jogo de mineração "A&A · Across Ages".
// Estado 100% client-side — sem chamadas de backend.

export type NodeKind = "asteroid" | "meteor" | "planet" | "constellation";

export interface MineNode {
  id: string;
  kind: NodeKind;
  x: number; // 0..1 (fração da largura)
  y: number; // 0..1
  vx: number;
  vy: number;
  size: number; // px
  hp: number; // pulsos restantes para minerar
}

export const NODE_META: Record<NodeKind, { label: string; emoji: string; color: string; reward: number; hp: number }> = {
  asteroid:     { label: "Asteroide",    emoji: "☄️", color: "#c9a084", reward: 2, hp: 2 },
  meteor:       { label: "Meteoro",       emoji: "🌠", color: "#f97316", reward: 3, hp: 2 },
  planet:       { label: "Planeta",       emoji: "🪐", color: "#a78bfa", reward: 5, hp: 3 },
  constellation:{ label: "Constelação",   emoji: "✨", color: "#facc15", reward: 4, hp: 2 },
};

export const KINDS: NodeKind[] = ["asteroid", "meteor", "planet", "constellation"];

export function randomNode(): MineNode {
  const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
  const meta = NODE_META[kind];
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    x: Math.random() * 0.9 + 0.05,
    y: Math.random() * 0.7 + 0.1,
    vx: (Math.random() - 0.5) * 0.0006,
    vy: (Math.random() - 0.5) * 0.0006,
    size: kind === "planet" ? 44 : kind === "constellation" ? 38 : 32,
    hp: meta.hp,
  };
}
