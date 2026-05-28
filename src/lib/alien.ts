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
}) {
  const planet = PLANETS.find((p) => p.id === opts.planetId) ?? PLANETS[2];
  const seed = hashStr(`${opts.name}|${opts.birthdate}|${planet.id}`);

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

  return {
    alienName,
    species: planet.species,
    planetName: planet.name,
    planetTrait: planet.trait,
    galacticBirth,
    idNumber,
    rank,
    licenseClass,
    earthDate: earthDate.toLocaleDateString("pt-BR"),
  };
}

export type AlienIdentity = ReturnType<typeof generateAlienIdentity>;
