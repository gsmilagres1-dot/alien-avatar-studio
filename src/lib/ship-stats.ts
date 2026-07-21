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
  // Pra qual lado o "bico" da nave aponta na imagem original (parada, sem
  // girar), em graus — 0° = bico pra direita (carro/jato visto de lado,
  // o motor/escape fica atrás, à esquerda), 180° = bico pra ESQUERDA
  // (mesma ideia, só que a arte original já nasce virada pro outro lado
  // — o jogo espelha o corpo da nave automaticamente nesse caso, então
  // ela ainda vira e acelera pro lado certo, com o propulsor sempre na
  // traseira de verdade), -90°/270° = bico pra cima (nave tipo
  // foguete/drone, o motor fica embaixo, gira livre em 360°).
  noseAngleDeg: number;
};

export const DEFAULT_SHIP_STATS: ShipStats = {
  category: "medio",
  fuelMult: 1,
  o2Mult: 1,
  cargoMult: 1,
  speedMult: 1,
  blurb: "Equilibrada",
  noseAngleDeg: 0,
};

export const SHIP_STATS: Record<string, ShipStats> = {
  // ---- naves base (SHIPS) ----
  esportiva: { category: "leve", fuelMult: 1.15, o2Mult: 1.10, cargoMult: 0.85, speedMult: 1.15, blurb: "Ágil, carga baixa", noseAngleDeg: 0 },
  offroad: { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Equilibrada, um pouco mais robusta", noseAngleDeg: 0 },
  corrida: { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.85, speedMult: 1.20, blurb: "Rápida, carga baixa", noseAngleDeg: 0 },
  teleportadora: { category: "grande", fuelMult: 0.85, o2Mult: 0.90, cargoMult: 1.30, speedMult: 0.90, blurb: "Carrega muito, mais lenta", noseAngleDeg: -90 },

  // ---- 11 naves extras (EXTRA_SHIPS) ----
  aerodeslizador: { category: "medio", fuelMult: 1.05, o2Mult: 1.00, cargoMult: 1.00, speedMult: 1.05, blurb: "Equilibrada", noseAngleDeg: -90 },
  "vtol-classica": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Estável, carga um pouco maior", noseAngleDeg: -90 },
  quadricoptero: { category: "micro", fuelMult: 1.35, o2Mult: 1.25, cargoMult: 0.60, speedMult: 1.30, blurb: "Muita autonomia, carga mínima", noseAngleDeg: -90 },
  furtiva: { category: "leve", fuelMult: 1.15, o2Mult: 1.10, cargoMult: 0.80, speedMult: 1.15, blurb: "Ágil e discreta", noseAngleDeg: 180 },
  "bronze-jato": { category: "medio", fuelMult: 0.95, o2Mult: 0.95, cargoMult: 1.10, speedMult: 1.10, blurb: "Veloz, carga um pouco maior", noseAngleDeg: 0 },
  "asa-negra": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.00, speedMult: 1.00, blurb: "Padrão", noseAngleDeg: 0 },
  "limusine-voadora": { category: "grande", fuelMult: 0.75, o2Mult: 0.85, cargoMult: 1.50, speedMult: 0.80, blurb: "Carga máxima, autonomia baixa", noseAngleDeg: 0 },
  "biplano-retro": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.85, speedMult: 1.05, blurb: "Leve, um pouco mais lenta que as ágeis", noseAngleDeg: -90 },
  "prancha-prata": { category: "micro", fuelMult: 1.40, o2Mult: 1.30, cargoMult: 0.50, speedMult: 1.35, blurb: "Leve e ágil, carga mínima", noseAngleDeg: 0 },
  hexacoptero: { category: "micro", fuelMult: 1.30, o2Mult: 1.20, cargoMult: 0.65, speedMult: 1.25, blurb: "Muita autonomia, pouca carga", noseAngleDeg: -90 },
  "concept-vermelho": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.90, speedMult: 1.15, blurb: "Ágil, carga um pouco baixa", noseAngleDeg: 0 },

  // ---- leva de 15 naves novas ----
  "delorean-classic": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.90, speedMult: 1.10, blurb: "Clássica e ágil", noseAngleDeg: 0 },
  "cadillactic-zx": { category: "leve", fuelMult: 1.12, o2Mult: 1.08, cargoMult: 0.85, speedMult: 1.20, blurb: "Turbina traseira, bem rápida", noseAngleDeg: 180 },
  "nano-mold": { category: "micro", fuelMult: 1.35, o2Mult: 1.25, cargoMult: 0.55, speedMult: 1.30, blurb: "Minúscula, autonomia enorme", noseAngleDeg: 0 },
  "modulo-c23": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 1.00, blurb: "Módulo equilibrado", noseAngleDeg: 180 },
  "navigator-original": { category: "grande", fuelMult: 0.78, o2Mult: 0.85, cargoMult: 1.45, speedMult: 0.80, blurb: "Disco grande, carga alta", noseAngleDeg: 180 },
  "shadow-slim-2": { category: "leve", fuelMult: 1.12, o2Mult: 1.08, cargoMult: 0.85, speedMult: 1.15, blurb: "Furtiva e ágil", noseAngleDeg: 0 },
  "love-flyer": { category: "medio", fuelMult: 0.98, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Helicóptero estável", noseAngleDeg: -90 },
  "supersonic-force1": { category: "medio", fuelMult: 0.95, o2Mult: 0.98, cargoMult: 1.10, speedMult: 1.10, blurb: "Veloz, carga um pouco maior", noseAngleDeg: 180 },
  "easy-rider-bus": { category: "grande", fuelMult: 0.72, o2Mult: 0.82, cargoMult: 1.55, speedMult: 0.78, blurb: "Ônibus espacial, carga máxima", noseAngleDeg: 180 },
  "unilander-77": { category: "micro", fuelMult: 1.38, o2Mult: 1.28, cargoMult: 0.55, speedMult: 1.28, blurb: "Moto voadora, autonomia enorme", noseAngleDeg: -90 },
  "unilander": { category: "leve", fuelMult: 1.15, o2Mult: 1.10, cargoMult: 0.80, speedMult: 1.20, blurb: "VTOL leve e ágil", noseAngleDeg: -90 },
  "egg-lander-1001": { category: "micro", fuelMult: 1.32, o2Mult: 1.22, cargoMult: 0.60, speedMult: 1.25, blurb: "Drone compacto, pouca carga", noseAngleDeg: -90 },
  "navigator": { category: "grande", fuelMult: 0.70, o2Mult: 0.80, cargoMult: 1.60, speedMult: 0.75, blurb: "Estação-nave, carga máxima", noseAngleDeg: -90 },
  "hover-coupe-rz": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.88, speedMult: 1.18, blurb: "Coupé ágil", noseAngleDeg: 180 },
  "lander-rz9": { category: "leve", fuelMult: 1.08, o2Mult: 1.05, cargoMult: 0.90, speedMult: 1.15, blurb: "Rápida, carga moderada", noseAngleDeg: 0 },

  // ---- leva nova: 12 naves ----
  "cruzer-noturno": { category: "leve", fuelMult: 1.12, o2Mult: 1.08, cargoMult: 0.85, speedMult: 1.18, blurb: "Ágil, visual furtivo", noseAngleDeg: 180 },
  "cruzador-aurun": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.95, blurb: "Cruzador robusto e equilibrado", noseAngleDeg: 180 },
  "aranha-lander": { category: "grande", fuelMult: 0.75, o2Mult: 0.85, cargoMult: 1.45, speedMult: 0.80, blurb: "Mecânica pesada, carga alta", noseAngleDeg: 180 },
  "galactic-diamond": { category: "leve", fuelMult: 1.12, o2Mult: 1.08, cargoMult: 0.85, speedMult: 1.20, blurb: "Angular e rápida", noseAngleDeg: 0 },
  "modal-multidimensional": { category: "medio", fuelMult: 0.98, o2Mult: 1.00, cargoMult: 1.10, speedMult: 1.00, blurb: "Tecnologia densa, carga extra", noseAngleDeg: 0 },
  "super-duty-vanguard": { category: "grande", fuelMult: 0.72, o2Mult: 0.82, cargoMult: 1.55, speedMult: 0.78, blurb: "Nave de guerra, carga máxima", noseAngleDeg: 180 },
  "speed-bee-predator": { category: "medio", fuelMult: 0.95, o2Mult: 0.98, cargoMult: 1.05, speedMult: 1.10, blurb: "Ágil e agressiva", noseAngleDeg: 180 },
  "cruzer-dourado": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.85, speedMult: 1.15, blurb: "Clássica, elegante", noseAngleDeg: 0 },
  "lander-expedicao": { category: "medio", fuelMult: 1.00, o2Mult: 1.00, cargoMult: 1.05, speedMult: 0.92, blurb: "Robusta pra terrenos difíceis", noseAngleDeg: 180 },
  "speed-bee-rubi": { category: "leve", fuelMult: 1.10, o2Mult: 1.05, cargoMult: 0.88, speedMult: 1.16, blurb: "Ágil, carga moderada", noseAngleDeg: 180 },
  "cruzer-aereo": { category: "leve", fuelMult: 1.15, o2Mult: 1.10, cargoMult: 0.80, speedMult: 1.12, blurb: "Leve, feita pra voar", noseAngleDeg: -90 },
  "bolha-lander": { category: "micro", fuelMult: 1.35, o2Mult: 1.25, cargoMult: 0.55, speedMult: 1.30, blurb: "Compacta, autonomia enorme", noseAngleDeg: 180 },
};

export function getShipStats(shipId: string | null | undefined): ShipStats {
  if (!shipId) return DEFAULT_SHIP_STATS;
  return SHIP_STATS[shipId] ?? DEFAULT_SHIP_STATS;
}
