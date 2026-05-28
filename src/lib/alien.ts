export const PLANETS = [
  { id: "mercurio", name: "Mercúrio", species: "Solarian", trait: "veloz e brilhante" },
  { id: "venus", name: "Vênus", species: "Velluvian", trait: "elegante e tóxico" },
  { id: "marte", name: "Marte", species: "Marxian", trait: "guerreiro e ferroso" },
  { id: "jupiter", name: "Júpiter", species: "Jovariano", trait: "imenso e tempestuoso" },
  { id: "saturno", name: "Saturno", species: "Saturnoid", trait: "anelado e místico" },
  { id: "urano", name: "Urano", species: "Uraniano", trait: "gélido e excêntrico" },
  { id: "netuno", name: "Netuno", species: "Neptuniano", trait: "profundo e telepata" },
  { id: "plutao", name: "Plutão", species: "Plutônico", trait: "anão e ancestral" },
  { id: "kepler", name: "Kepler-452b", species: "Kepleriano", trait: "gêmeo terráqueo" },
  { id: "trappist", name: "TRAPPIST-1e", species: "Trappistiano", trait: "binário e crepuscular" },
] as const;

export type PlanetId = (typeof PLANETS)[number]["id"];
export type Gender = "male" | "female" | "undefined";

export const SHIPS = [
  {
    id: "esportiva" as const,
    name: "Esportiva",
    desc: "Aerodinâmica, veloz, casco prateado",
    palette: "neon cyan, chrome silver, indigo glow",
  },
  {
    id: "offroad" as const,
    name: "Off-road",
    desc: "Pernas mecânicas, blindagem para luas hostis",
    palette: "rust orange, gunmetal, amber lights",
  },
  {
    id: "corrida" as const,
    name: "Corrida",
    desc: "Pod racer com motores de plasma",
    palette: "magenta, hot pink, plasma white",
  },
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

export function generateAlienIdentity(opts: {
  name: string;
  birthdate: string; // YYYY-MM-DD
  planetId: PlanetId;
  gender: Gender;
  variant?: number;
}) {
  const planet = PLANETS.find((p) => p.id === opts.planetId) ?? PLANETS[2];
  const seed = hashStr(`${opts.name}|${opts.birthdate}|${planet.id}|${opts.gender}|${opts.variant ?? 0}`);

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
    species: planet.species,
    planetId: planet.id,
    planetName: planet.name,
    planetTrait: planet.trait,
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

export function buildAvatarPrompt(opts: {
  planet: string;
  species: string;
  gender: Gender;
  variant: number;
}) {
  const genderHint =
    opts.gender === "male"
      ? "alien male humanoid, masculine features, strong jaw, broader neck"
      : opts.gender === "female"
        ? "alien female humanoid, feminine features, softer cheekbones, expressive eyes"
        : "androgynous non-binary alien humanoid, neutral features";

  const variantHint = [
    "with bioluminescent freckles and a tribal forehead crest",
    "with translucent crystalline skin patches and an antennae pair",
    "with iridescent scales along the cheekbones and glowing iris",
  ][opts.variant % 3];

  return `Cinematic portrait of an alien from planet ${opts.planet} (species ${opts.species}). ${genderHint}. Keep the original facial structure and pose recognizable but reimagine the appearance with sci-fi alien features inspired by classic movies (Star Trek, Star Wars, Mass Effect, Avatar, District 9, Guardians of the Galaxy): unusual skin color (green, blue, purple, silver, or iridescent), subtle alien textures, large expressive eyes with non-human iris colors, ${variantHint}. Realistic photographic portrait, cinematic movie poster quality, cosmic nebulous background with purple and neon green stardust. Focus on face and shoulders. No text, no watermark.`;
}

export function buildShipPrompt(category: "esportiva" | "offroad" | "corrida", planet: string) {
  const ship = SHIPS.find((s) => s.id === category)!;
  return `Cinematic alien ${ship.name} spacecraft from planet ${planet}, ${ship.desc}, ${ship.palette}. Inspired by classic sci-fi vehicles (Star Wars pod racers, Mass Effect Normandy, Halo Banshee, Star Trek shuttles, Tron light cycles). Hovering, side three-quarter view, dramatic cinematic lighting, cosmic nebula background, ultra detailed, no text, no watermark.`;
}
