// 6 raças alienígenas — atribuídas pela data de nascimento
export const RACES = [
  {
    id: "starseed",
    name: "Starseed",
    species: "Semente Estelar",
    origin: "Sírius / Pleiades",
    nature: "Benéfica",
    trait: "portador de luz e memória cósmica",
    powers: ["Cura energética", "Memória de vidas estelares", "Conexão multidimensional", "Empatia profunda"],
    purpose: "Despertar a consciência da humanidade e ancorar luz na Terra.",
  },
  {
    id: "nordico",
    name: "Nórdico",
    species: "Pleiadiano (M45)",
    origin: "Sistema Estelar das Plêiades",
    nature: "Benéfica",
    trait: "guardião de amor e luz",
    powers: ["Cura e regeneração", "Manipulação de energia", "Teletransporte", "Conexão espiritual elevada"],
    purpose: "Guiar, proteger e auxiliar a humanidade em sua evolução espiritual.",
  },
  {
    id: "grey",
    name: "Grey",
    species: "Zeta Reticuli",
    origin: "Sistema Estelar de Zeta Reticuli",
    nature: "Neutra / Negativa",
    trait: "observador frio e experimental",
    powers: ["Leitura mental", "Abduções e experimentos", "Manipulação genética", "Viagens interdimensionais"],
    purpose: "Estudar, experimentar e monitorar a evolução de outras raças.",
  },
  {
    id: "reptiliano",
    name: "Reptiliano",
    species: "Sauriano",
    origin: "Sistema Estelar Órion / Constelação Draco",
    nature: "Geralmente Não-Benéfica",
    trait: "dominador estratégico",
    powers: ["Controle mental", "Manipulação genética", "Ilusões e holografia", "Alta resistência física"],
    purpose: "Domínio, controle e exploração de recursos e civilizações.",
  },
  {
    id: "draconiano",
    name: "Draconiano / Arconte",
    species: "Arconte de Draco",
    origin: "Constelação Draco · dimensões sombrias",
    nature: "Hierárquica / Predadora",
    trait: "manipulador energético ancestral",
    powers: ["Manipulação energética", "Domínio psíquico", "Hierarquia cósmica", "Drenagem etérea"],
    purpose: "Comandar hierarquias e moldar realidades de baixa frequência.",
  },
  {
    id: "insectoide",
    name: "Insectoide",
    species: "Louva-Deus",
    origin: "Origem desconhecida — poucas informações",
    nature: "Neutra",
    trait: "guardião silencioso da galáxia",
    powers: ["Camuflagem avançada", "Força física extrema", "Comunicação telepática", "Controle de bioenergia"],
    purpose: "Observação e manutenção do equilíbrio em regiões estratégicas da galáxia.",
  },
] as const;

export type RaceId = (typeof RACES)[number]["id"];

// Backwards-compat aliases (DB column ainda se chama planet_id)
export const PLANETS = RACES;
export type PlanetId = RaceId;

export type Gender = "male" | "female" | "undefined";

export const SHIPS = [
  { id: "esportiva" as const, name: "Esportiva", desc: "Aerodinâmica, veloz, casco prateado", palette: "neon cyan, chrome silver, indigo glow" },
  { id: "offroad" as const,  name: "Off-road",  desc: "Pernas mecânicas, blindagem para luas hostis", palette: "rust orange, gunmetal, amber lights" },
  { id: "corrida" as const,  name: "Corrida",   desc: "Pod racer com motores de plasma", palette: "magenta, hot pink, plasma white" },
] as const;

export type ShipId = (typeof SHIPS)[number]["id"];

const PREFIXES = ["Xa", "Zor", "Ky", "Vex", "Lu", "Or", "Qua", "Ne", "Tha", "Bly", "Rho", "Iz"];
const MIDS = ["lor", "ven", "tar", "mok", "zin", "drix", "qua", "luma", "ryx"];
const SUFFIXES = ["-7", "'ax", "on", "ar", "is", "uun", "-Δ", "eth", "ix"];

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Determinístico: mesma data → sempre a mesma raça. */
export function raceFromBirthdate(birthdate: string): (typeof RACES)[number] {
  const h = hashStr(`race|${birthdate}`);
  return RACES[h % RACES.length];
}

export function getRace(id: string): (typeof RACES)[number] {
  return RACES.find((r) => r.id === id) ?? RACES[0];
}

export function generateAlienIdentity(opts: {
  name: string;
  birthdate: string;
  planetId: PlanetId; // mantém nome do campo por compat
  gender: Gender;
  variant?: number;
}) {
  const race = getRace(opts.planetId);
  const seed = hashStr(`${opts.name}|${opts.birthdate}|${race.id}|${opts.gender}|${opts.variant ?? 0}`);

  const alienName =
    PREFIXES[seed % PREFIXES.length] +
    MIDS[(seed >> 3) % MIDS.length] +
    SUFFIXES[(seed >> 6) % SUFFIXES.length];

  const earthDate = new Date(opts.birthdate);
  const galacticYear = 12000 + ((seed >> 9) % 8888);
  const cycle = (seed % 9) + 1;
  const moon = ["Phobos", "Europa", "Titan", "Io", "Calisto", "Tritão", "Ganimedes"][seed % 7];
  const galacticBirth = `Ciclo ${cycle} · ${galacticYear} G.E. · Lua ${moon}`;

  const idNumber = [
    String((seed % 9000) + 1000),
    String(((seed >> 4) % 9000) + 1000),
    String(((seed >> 8) % 9000) + 1000),
  ].join("·");

  const ranks = ["Explorador", "Embaixador", "Bioengenheiro", "Piloto Estelar", "Cartógrafo", "Tradutor Telepata"];
  const rank = ranks[seed % ranks.length];

  const licenseClass = ["A — Naves leves", "B — Cruzadores", "C — Cargueiros de antimatéria", "D — Buracos de minhoca"][seed % 4];

  const genderLabel = opts.gender === "male" ? "Macho" : opts.gender === "female" ? "Fêmea" : "Não-binário";

  return {
    alienName,
    species: race.species,
    planetId: race.id,
    planetName: race.origin,
    planetTrait: race.trait,
    raceId: race.id,
    raceName: race.name,
    galacticBirth,
    idNumber,
    rank,
    licenseClass,
    earthDate: earthDate.toLocaleDateString("pt-BR"),
    gender: opts.gender,
    genderLabel,
  };
}

export type AlienIdentity = ReturnType<typeof generateAlienIdentity>;

const RACE_VISUAL: Record<RaceId, string> = {
  starseed:
    "Starseed humanoid with luminous pale skin glowing softly from within, iridescent violet and gold light in the iris, faint constellations like freckles across the cheeks, ethereal silver-white hair with prismatic strands, a subtle halo of stardust",
  nordico:
    "Tall Nordic Pleiadian humanoid with very fair skin, electric blue or violet eyes that emit a soft glow, long platinum/golden hair, serene and majestic facial structure, faint silver biometallic markings on temples",
  grey:
    "Classic Zeta Reticuli Grey alien: enlarged smooth cranium, smooth grey skin with subtle texture, very large pitch-black almond-shaped eyes (no iris), tiny nose slits and a thin mouth line, slender neck — keep the human face structure recognizable but morphed into Grey traits",
  reptiliano:
    "Sauriano reptilian humanoid with iridescent green/bronze scaled skin, vertical slit pupils in amber or gold eyes, faint dorsal crest, hint of fangs, predatory and sharp facial features, dark militaristic atmosphere",
  draconiano:
    "Draconian/Archon humanoid: imposing reptilian-draconic features, dark obsidian and crimson scales, horns or bony brow ridges, glowing red or violet pupils, ancient hierarchic presence, smoky shadow aura",
  insectoide:
    "Mantis-like insectoid alien: chitinous emerald-green exoskeleton on face and neck, large multifaceted compound eyes, slim antennae from forehead, mandibular jaw hints, bioluminescent veins — keep recognizable facial proportions of the source photo morphed into a praying-mantis humanoid",
};

export function buildAvatarPrompt(opts: {
  race?: (typeof RACES)[number];
  // legacy params (still accepted)
  planet?: string;
  species?: string;
  gender: Gender;
  variant: number;
  raceId?: RaceId;
}) {
  const race = opts.race ?? (opts.raceId ? getRace(opts.raceId) : RACES[0]);
  const visual = RACE_VISUAL[race.id as RaceId];

  const genderHint =
    opts.gender === "male"
      ? "masculine features, stronger jaw, broader neck"
      : opts.gender === "female"
        ? "feminine features, softer cheekbones, expressive eyes"
        : "androgynous non-binary features";

  const variantTwist = [
    "with bioluminescent markings",
    "with crystalline highlights and a subtle aura",
    "with iridescent skin sheen and glowing iris",
  ][opts.variant % 3];

  return `Cinematic portrait reimagining the uploaded human photo as a ${race.name} (${race.species}) alien from ${race.origin}. ${visual}. ${genderHint}. ${variantTwist}. CRITICAL: keep the original facial structure, pose, hairstyle silhouette and identity recognizable — transform the human into this alien race rather than replacing the face. Realistic photographic portrait, cinematic movie poster quality, cosmic nebula background with purple and neon green stardust. Focus on face and shoulders. No text, no watermark.`;
}

export function buildShipPrompt(category: "esportiva" | "offroad" | "corrida", planet: string) {
  const ship = SHIPS.find((s) => s.id === category)!;
  return `Cinematic alien ${ship.name} spacecraft from ${planet}, ${ship.desc}, ${ship.palette}. Inspired by classic sci-fi vehicles (Star Wars pod racers, Mass Effect Normandy, Halo Banshee, Star Trek shuttles, Tron light cycles). Hovering, side three-quarter view, dramatic cinematic lighting, cosmic nebula background, ultra detailed, no text, no watermark.`;
}
