// Shared constants for the intergalactic area (client + server safe).

export type DestinationKind = "normal" | "fatal";

export interface Destination {
  id: string;
  name: string;
  transport: string;
  level: number;
}

export const DESTINATIONS: Destination[] = [
  { id: "jupiter",    name: "Luas de Júpiter",               transport: "nave estelar",        level: 1 },
  { id: "mars",       name: "Colônia de Marte",              transport: "teletransporte",      level: 2 },
  { id: "andromeda",  name: "Galáxia de Andrômeda",          transport: "buraco de minhoca",   level: 3 },
  { id: "multidim",   name: "Multidimensão Z-9",             transport: "transmutação",        level: 4 },
  { id: "core",       name: "Coração da Via Láctea",         transport: "nave-mãe ancestral",  level: 5 },
];

export const FATAL_DESTINATIONS = [
  { id: "sun",       name: "Sol",                          transport: "queda livre solar" },
  { id: "blackhole", name: "Buraco Negro Sagitário A*",    transport: "espaguetificação" },
  { id: "vacuum",    name: "Vácuo do Espaço Profundo",     transport: "deriva eterna" },
] as const;

export const MAX_QUIZ_ATTEMPTS = 3; // 3 chances per level before fatal
export const QUIZ_PASS_RATIO = 0.8; // 80%
export const QUESTIONS_PER_QUIZ = 5;

export function destinationForLevel(level: number): Destination {
  return DESTINATIONS[Math.min(Math.max(level, 1), DESTINATIONS.length) - 1];
}

export function pickFatalDestination(seed: string): (typeof FATAL_DESTINATIONS)[number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FATAL_DESTINATIONS[h % FATAL_DESTINATIONS.length];
}
