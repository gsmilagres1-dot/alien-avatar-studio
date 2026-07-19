// =========================================================
// Estatísticas por nave — dá personalidade a cada veículo do hangar.
// Regra geral: quanto MENOR/mais ágil a nave, MAIS autonomia
// (combustível/O2) ela tem, mas MENOS carga. Naves grandes são
// o oposto: carregam muito material, mas gastam mais recurso e
// são mais lentas. Isso cria diferenciação real na escolha da nave.
//
// fuelMult / o2Mult / cargoMult / speedMult são multiplicadores
// sobre a base do jogo (1 = padrão). category é só informativo,
// pra mostrar na UI se quiser.
// =========================================================

export type ShipCategory = "micro" | "leve" | "medio" | "grande";

export type ShipStats = {
  category: ShipCategory;
  fuelMult: number;
  o2Mult: number;
  cargoMult: number;
  speedMult: number;
  blurb: string; // frase curta pra mostrar no card da nave, se quiser
};

export const DEFAULT_SHIP_STATS: ShipStats = {
  category: "medio",
  fuelMult: 1,
  o2Mult: 1,
  cargoMult: 1,
  speedMult: 1,
  blurb: "Equilibrada",
};

export const SHIP_STATS: Record<string, ShipStats> = {
  // ---- naves base (SHIPS) ----
  esportiva: { category: "leve", fuelMult: 1.15, o2Mult: 1.10, cargoMult: 0.85, speedMult: 1.15, blurb: "Ágil, carga baixa" },
  offroad: { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Equilibrada, um pouco mais robusta" },
  corrida: { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.85, speedMult: 1.20, blurb: "Rápida, carga baixa" },
  teleportadora: { category: "grande", fuelMult: 0.85, o2Mult: 0.90, cargoMult: 1.30, speedMult: 0.90, blurb: "Carrega muito, mais lenta" },

  // ---- 11 naves extras (EXTRA_SHIPS) ----
  aerodeslizador: { category: "medio", fuelMult: 1.05, o2Mult: 1.00, cargoMult: 1.00, speedMult: 1.05, blurb: "Equilibrada" },
  "vtol-classica": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Estável, carga um pouco maior" },
  quadricoptero: { category: "micro", fuelMult: 1.35, o2Mult: 1.25, cargoMult: 0.60, speedMult: 1.30, blurb: "Muita autonomia, carga mínima" },
  furtiva: { category: "leve", fuelMult: 1.15, o2Mult: 1.10, cargoMult: 0.80, speedMult: 1.15, blurb: "Ágil e discreta" },
  "bronze-jato": { category: "medio", fuelMult: 0.95, o2Mult: 0.95, cargoMult: 1.10, speedMult: 1.10, blurb: "Veloz, carga um pouco maior" },
  "asa-negra": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.00, speedMult: 1.00, blurb: "Padrão" },
  "limusine-voadora": { category: "grande", fuelMult: 0.75, o2Mult: 0.85, cargoMult: 1.50, speedMult: 0.80, blurb: "Carga máxima, autonomia baixa" },
  "biplano-retro": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.85, speedMult: 1.05, blurb: "Leve, um pouco mais lenta que as ágeis" },
  "prancha-prata": { category: "micro", fuelMult: 1.40, o2Mult: 1.30, cargoMult: 0.50, speedMult: 1.35, blurb: "Leve e ágil, carga mínima" },
  hexacoptero: { category: "micro", fuelMult: 1.30, o2Mult: 1.20, cargoMult: 0.65, speedMult: 1.25, blurb: "Muita autonomia, pouca carga" },
  "concept-vermelho": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.90, speedMult: 1.15, blurb: "Ágil, carga um pouco baixa" },

  // ---- leva de 15 naves novas ----
  "delorean-classic": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.90, speedMult: 1.10, blurb: "Clássica e ágil" },
  "cadillactic-zx": { category: "leve", fuelMult: 1.12, o2Mult: 1.08, cargoMult: 0.85, speedMult: 1.20, blurb: "Turbina traseira, bem rápida" },
  "nano-mold": { category: "micro", fuelMult: 1.35, o2Mult: 1.25, cargoMult: 0.55, speedMult: 1.30, blurb: "Minúscula, autonomia enorme" },
  "modulo-c23": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 1.00, blurb: "Módulo equilibrado" },
  "navigator-original": { category: "grande", fuelMult: 0.78, o2Mult: 0.85, cargoMult: 1.45, speedMult: 0.80, blurb: "Disco grande, carga alta" },
  "shadow-slim-2": { category: "leve", fuelMult: 1.12, o2Mult: 1.08, cargoMult: 0.85, speedMult: 1.15, blurb: "Furtiva e ágil" },
  "love-flyer": { category: "medio", fuelMult: 0.98, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Helicóptero estável" },
  "supersonic-force1": { category: "medio", fuelMult: 0.95, o2Mult: 0.98, cargoMult: 1.10, speedMult: 1.10, blurb: "Veloz, carga um pouco maior" },
  "easy-rider-bus": { category: "grande", fuelMult: 0.72, o2Mult: 0.82, cargoMult: 1.55, speedMult: 0.78, blurb: "Ônibus espacial, carga máxima" },
  "unilander-77": { category: "micro", fuelMult: 1.38, o2Mult: 1.28, cargoMult: 0.55, speedMult: 1.28, blurb: "Moto voadora, autonomia enorme" },
  "unilander": { category: "leve", fuelMult: 1.15, o2Mult: 1.10, cargoMult: 0.80, speedMult: 1.20, blurb: "VTOL leve e ágil" },
  "egg-lander-1001": { category: "micro", fuelMult: 1.32, o2Mult: 1.22, cargoMult: 0.60, speedMult: 1.25, blurb: "Drone compacto, pouca carga" },
  "navigator": { category: "grande", fuelMult: 0.70, o2Mult: 0.80, cargoMult: 1.60, speedMult: 0.75, blurb: "Estação-nave, carga máxima" },
  "hover-coupe-rz": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.88, speedMult: 1.18, blurb: "Coupé ágil" },
  "lander-rz9": { category: "leve", fuelMult: 1.08, o2Mult: 1.05, cargoMult: 0.90, speedMult: 1.15, blurb: "Rápida, carga moderada" },
};

export function getShipStats(shipId: string | null | undefined): ShipStats {
  if (!shipId) return DEFAULT_SHIP_STATS;
  return SHIP_STATS[shipId] ?? DEFAULT_SHIP_STATS;
}
