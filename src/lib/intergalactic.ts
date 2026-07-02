// Shared constants for the intergalactic area (client + server safe).
import { TEAM_DESTINATIONS, type TeamDestKind } from "@/lib/team-destinations";

export type DestinationKind = "planet" | "sun" | "moon" | "fatal" | TeamDestKind;

export interface Destination {
  id: string;
  name: string;
  transport: string;
  level: number; // dificuldade do quiz (1-5)
  kind: DestinationKind;
}


export const DESTINATIONS: Destination[] = [
  // 10 planetas
  { id: "mercurio",  name: "Mercúrio",            transport: "nave térmica",         level: 1, kind: "planet" },
  { id: "venus",     name: "Vênus",               transport: "cápsula pressurizada", level: 2, kind: "planet" },
  { id: "marte",     name: "Marte",               transport: "teletransporte",       level: 1, kind: "planet" },
  { id: "jupiter",   name: "Júpiter",             transport: "nave estelar",         level: 2, kind: "planet" },
  { id: "saturno",   name: "Saturno",             transport: "nave dos anéis",       level: 3, kind: "planet" },
  { id: "urano",     name: "Urano",               transport: "submersível gasoso",   level: 3, kind: "planet" },
  { id: "netuno",    name: "Netuno",              transport: "nave de gelo",         level: 3, kind: "planet" },
  { id: "plutao",    name: "Plutão",              transport: "sonda gélida",         level: 2, kind: "planet" },
  { id: "kepler",    name: "Kepler-22b",          transport: "buraco de minhoca",    level: 4, kind: "planet" },
  { id: "proxima",   name: "Proxima Centauri b",  transport: "dobra warp",           level: 5, kind: "planet" },
  // 3 sois
  { id: "sol",         name: "Sol",                transport: "nave fotônica",        level: 5, kind: "sun" },
  { id: "alpha_a",     name: "Alpha Centauri A",   transport: "vela solar",           level: 4, kind: "sun" },
  { id: "betelgeuse",  name: "Betelgeuse",         transport: "salto hiperespacial",  level: 5, kind: "sun" },
  // 2 luas
  { id: "lua",     name: "Lua",                       transport: "módulo lunar",          level: 1, kind: "moon" },
  { id: "europa",  name: "Europa (lua de Júpiter)",   transport: "submarino criogênico",  level: 3, kind: "moon" },
];

export const FATAL_DESTINATIONS = [
  { id: "sun_core", name: "Coração do Sol",            transport: "queda livre solar" },
  { id: "blackhole", name: "Buraco Negro Sagitário A*", transport: "espaguetificação" },
  { id: "vacuum",    name: "Vácuo do Espaço Profundo",  transport: "deriva eterna" },
] as const;

export const MAX_QUIZ_ATTEMPTS = 3;
export const QUIZ_PASS_RATIO = 0.7;
// Quiz agora tem 9 perguntas distintas por destino. Se o usuário escolher
// um nível de dificuldade antes de iniciar, todas as 9 perguntas vêm daquele
// nível; caso contrário, mantemos 3 níveis × 3 perguntas cada.
export const QUESTIONS_PER_LEVEL = 3;
export const QUIZ_LEVELS = 3;
export const QUESTIONS_PER_QUIZ = 9;

export type QuizDifficulty = 1 | 2 | 3;
export const DIFFICULTY_LABEL: Record<QuizDifficulty, string> = {
  1: "Fácil",
  2: "Médio",
  3: "Difícil",
};
/** Prêmio final: completar os 45 destinos com selo destrava o Telescópio Jimmy Wath. */
export const TELESCOPE_JIMMY_WATH_THRESHOLD = 45;

export type BadgeTier = "bronze" | "silver" | "gold";

/** Tier do emblema conforme acerto no quiz (15 perguntas).
 *  - 70%–79% → bronze
 *  - 80%–90% → prata
 *  - 91%–100% → ouro
 */
export function tierFromScore(score: number, total: number = QUESTIONS_PER_QUIZ): BadgeTier {
  const pct = (score / total) * 100;
  if (pct >= 91) return "gold";
  if (pct >= 80) return "silver";
  return "bronze";
}

export function getDestination(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}

/** @deprecated mantido por compatibilidade; usar getDestination(id) */
export function destinationForLevel(level: number): Destination {
  return DESTINATIONS[Math.min(Math.max(level, 1), DESTINATIONS.length) - 1];
}

export function pickFatalDestination(seed: string): (typeof FATAL_DESTINATIONS)[number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FATAL_DESTINATIONS[h % FATAL_DESTINATIONS.length];
}

export const KIND_LABEL: Record<DestinationKind, string> = {
  planet: "Planeta",
  sun: "Sol",
  moon: "Lua",
  fatal: "Fim trágico",
  galaxy: "Galáxia",
  nebula: "Nebulosa",
  exoplanet: "Exoplaneta",
  star_system: "Sistema estelar",
  cluster: "Aglomerado",
  quasar: "Quasar",
};

/** Lista unificada dos 45 destinos quiz (15 singulares + 30 de equipe). */
export const ALL_DESTINATIONS: Destination[] = [
  ...DESTINATIONS,
  ...TEAM_DESTINATIONS.map((d) => ({
    id: d.id,
    name: d.name,
    transport: d.transport,
    level: d.level,
    kind: d.kind as DestinationKind,
  })),
];

export function getAnyDestination(id: string): Destination | undefined {
  return ALL_DESTINATIONS.find((d) => d.id === id);
}

/** Quantos destinos quaisquer concluídos liberam o Teletransportador. */
export const TELEPORTER_THRESHOLD = 10;

/**
 * Após o teletransportador (10 destinos), cada +5 destinos concede 1 segmento
 * do anel de buraco de minhoca. Aos 40 destinos o viajante completa os 6
 * segmentos que formam o túnel do buraco de minhoca.
 */
export const WORMHOLE_RING_THRESHOLDS = [15, 20, 25, 30, 35, 40] as const;
export const WORMHOLE_RING_TOTAL = WORMHOLE_RING_THRESHOLDS.length;

/** Quantos destinos de galáxia desbloqueiam uma ligação-surpresa de fichas. */
export const GALAXY_SURPRISE_STEP = 5;
export const GALAXY_SURPRISE_MIN = 20;
export const GALAXY_SURPRISE_MAX = 100;

