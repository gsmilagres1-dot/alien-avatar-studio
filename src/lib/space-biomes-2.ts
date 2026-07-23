// =========================================================
// Biomas do Across Age — um tema visual por destino da rota.
// Cobre as 45 fases: 15 destinos solo + 30 destinos da rota
// estendida (galáxias, nebulosas, aglomerados, exoplanetas).
//
// Fundos: fotos REAIS (NASA/ESA-Hubble/ESA-Webb/ESO) em
// src/assets/ (bg-*.jpg) ou por hotlink oficial. Se um hotlink
// falhar, a fase cai no cenário pintado de space-backdrop.ts —
// o jogo nunca fica com fundo vazio e nunca quebra.
//
// CRÉDITOS OBRIGATÓRIOS na tela de créditos do jogo:
//   NASA/JPL-Caltech · ESA/Hubble (CC BY 4.0) · ESA/Webb (CC BY 4.0)
//   ESO (CC BY 4.0)
//   NASA/JPL-Caltech/SwRI/MSSS/Thomas Thomopoulos (Júpiter)
//
// bgFit: "cover" = foto preenche a tela (texturas/superfícies);
//        "distant" = astro pequeno no céu (discos e estrelas).
// =========================================================

import bgMarte from "@/assets/bg-marte.jpg";
import bgLua from "@/assets/bg-lua.jpg";
import bgVenus from "@/assets/bg-venus.jpg";
import bgSaturno from "@/assets/bg-saturno.jpg";
import bgGanimedes from "@/assets/bg-ganimedes.jpg";
import bgJupiter from "@/assets/bg-jupiter.jpg";

export type DestinationKind =
  | "planet" | "moon" | "star" | "exoplanet" | "dwarf-planet"
  | "galaxy" | "nebula" | "cluster" | "quasar";

export type BgFit = "cover" | "distant";

export type BiomeTheme = {
  id: string;
  label: string;
  kind: DestinationKind;
  skyTop: string;
  skyBottom: string;
  starColor: string;
  horizonColor: string;
  horizonGlow: string;
  glowColor: string;
  danger: boolean;
  decor: string[]; // objetos cômicos espalhados pelo cenário (estilo HCR2)
  bgImageUrl?: string; // foto real quando existir (asset local ou URL)
  bgFit?: BgFit; // como enquadrar a foto (padrão: "cover")
};

const DEFAULT_THEME: Omit<BiomeTheme, "id" | "label"> = {
  kind: "planet",
  skyTop: "#0a0e27",
  skyBottom: "#1c2050",
  starColor: "#eef0ff",
  horizonColor: "#12163a",
  horizonGlow: "rgba(61,219,201,0.2)",
  glowColor: "#3ddbc9",
  danger: false,
  decor: ["🛸", "👽", "⭐"],
};

// paletas-base pros novos tipos de destino (config compartilhada)
const GALAXY_BASE = {
  kind: "galaxy" as const,
  skyTop: "#070714", skyBottom: "#1c1440", starColor: "#e8e0ff",
  horizonColor: "#120f2e", horizonGlow: "rgba(150,120,255,0.22)", glowColor: "#a08aff",
  danger: false,
};
const NEBULA_BASE = {
  kind: "nebula" as const,
  skyTop: "#12071a", skyBottom: "#3a1450", starColor: "#ffd8f0",
  horizonColor: "#22103a", horizonGlow: "rgba(230,120,220,0.25)", glowColor: "#e07ae0",
  danger: false,
};
const CLUSTER_BASE = {
  kind: "cluster" as const,
  skyTop: "#060a18", skyBottom: "#12245a", starColor: "#cfe4ff",
  horizonColor: "#0c1638", horizonGlow: "rgba(120,180,255,0.25)", glowColor: "#7ab0ff",
  danger: false,
};
const STARSYS_BASE = {
  kind: "star" as const,
  skyTop: "#1a1206", skyBottom: "#5a4416", starColor: "#fff0c0",
  horizonColor: "#2e2410", horizonGlow: "rgba(255,210,90,0.3)", glowColor: "#ffd25a",
  danger: false,
};
const EXO_BASE = {
  kind: "exoplanet" as const,
  skyTop: "#0a141c", skyBottom: "#1e4a5a", starColor: "#b0ecff",
  horizonColor: "#102834", horizonGlow: "rgba(80,200,220,0.25)", glowColor: "#4ac8dc",
  danger: false,
};

export const BIOMES: Record<string, BiomeTheme> = {
  // ================= ROTA SOLO (15) =================
  marte: {
    id: "marte", label: "Marte", kind: "planet",
    skyTop: "#3a1f12", skyBottom: "#a85a2e", starColor: "#ffcfa0",
    horizonColor: "#6a3418", horizonGlow: "rgba(232,120,60,0.25)", glowColor: "#e8783c",
    danger: false, decor: ["🦴", "🛸", "👽", "🪐"],
    // Panorâmica do rover Curiosity na Cratera Gale — NASA/JPL-Caltech/MSSS.
    bgImageUrl: bgMarte,
    bgFit: "cover",
  },

  mercurio: {
    id: "mercurio", label: "Mercúrio", kind: "planet",
    skyTop: "#2a1a0a", skyBottom: "#8a7048", starColor: "#ffe8b0",
    horizonColor: "#4a3a20", horizonGlow: "rgba(200,160,90,0.25)", glowColor: "#e0b060",
    danger: true, // mais perto do sol, variação de temperatura extrema de verdade
    decor: ["🥵🥶", "☀️🛰️", "👽🕶️", "🌋"],
    // Superfície de Mercúrio, sonda MESSENGER — NASA/JHU-APL/Carnegie.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia12/pia12051/PIA12051.jpg",
    bgFit: "cover",
  },

  lua: {
    id: "lua", label: "Lua", kind: "moon",
    skyTop: "#0a0a14", skyBottom: "#3a3a4a", starColor: "#eef0ff",
    horizonColor: "#1c1c28", horizonGlow: "rgba(200,200,220,0.2)", glowColor: "#c8c8dc",
    danger: false, decor: ["🚩", "👣", "📷👽", "🛰️"],
    // Panorâmica da Cratera Shorty, Apollo 17 (1972) — foto real NASA.
    bgImageUrl: bgLua,
    bgFit: "cover",
  },

  venus: {
    id: "venus", label: "Vênus", kind: "planet",
    skyTop: "#3a2a0a", skyBottom: "#c9a63a", starColor: "#ffe8a0",
    horizonColor: "#5a4418", horizonGlow: "rgba(230,190,60,0.3)", glowColor: "#e6c23c",
    danger: true, // planeta mais quente do sistema solar de verdade
    decor: ["🛰️💀", "👽🍳", "🌡️💥", "👽☂️"],
    // Vale de fenda em Vênus, radar da sonda Magellan — foto real NASA.
    bgImageUrl: bgVenus,
    bgFit: "cover",
  },

  jupiter: {
    id: "jupiter", label: "Júpiter", kind: "planet",
    skyTop: "#2a1a0a", skyBottom: "#c97a3a", starColor: "#ffd0a0",
    horizonColor: "#5a3418", horizonGlow: "rgba(230,140,60,0.25)", glowColor: "#e6823c",
    danger: false, decor: ["🌪️👽", "🛰️💫", "🔴👀", "🪐"],
    // Nuvens de Júpiter, JunoCam — crédito obrigatório:
    // NASA/JPL-Caltech/SwRI/MSSS/Thomas Thomopoulos.
    bgImageUrl: bgJupiter,
    bgFit: "cover",
  },

  ganimedes: {
    id: "ganimedes", label: "Ganimedes", kind: "moon",
    skyTop: "#0e0e16", skyBottom: "#4a4a58", starColor: "#eef0ff",
    horizonColor: "#22222e", horizonGlow: "rgba(190,195,220,0.22)", glowColor: "#b8bcd8",
    danger: false,
    decor: ["🥇🌕", "🧲👽", "🌊🧊", "🛰️📸"],
    // Ganimedes, sobrevoo da Juno (2021) — NASA/JPL-Caltech/SwRI/MSSS.
    bgImageUrl: bgGanimedes,
    bgFit: "cover",
  },

  plutao: {
    id: "plutao", label: "Plutão", kind: "dwarf-planet",
    skyTop: "#0a0a1a", skyBottom: "#2a2a4a", starColor: "#d0d0ff",
    horizonColor: "#151530", horizonGlow: "rgba(150,150,230,0.2)", glowColor: "#8a8ae6",
    danger: false,
    decor: ["🪐❌", "👽😢", "🛰️👋", "🌡️❄️"],
    // "Coração" de Plutão, New Horizons (2015) — NASA/JHUAPL/SwRI.
    bgImageUrl: "https://www.nasa.gov/wp-content/uploads/2023/03/nh-pluto_crop.jpg.png",
    bgFit: "distant",
  },

  saturno: {
    id: "saturno", label: "Saturno", kind: "planet",
    skyTop: "#2a2410", skyBottom: "#c9b06a", starColor: "#fff0c0",
    horizonColor: "#4a4020", horizonGlow: "rgba(230,200,120,0.25)", glowColor: "#e6c87c",
    danger: false, decor: ["💍👽", "🛰️📸", "❄️💫", "🪨"],
    // Saturno e anéis, Cassini — NASA/JPL-Caltech/Space Science Institute.
    bgImageUrl: bgSaturno,
    bgFit: "cover",
  },

  urano: {
    id: "urano", label: "Urano", kind: "planet",
    skyTop: "#0f2a3a", skyBottom: "#4ab5c9", starColor: "#c0f0ff",
    horizonColor: "#153a48", horizonGlow: "rgba(90,210,230,0.25)", glowColor: "#5ad2e6",
    danger: false,
    decor: ["❄️", "🛸", "👾", "🙃👽", "🥶🌡️", "👽💍"],
    // Urano, Voyager 2 (1986) — disco inteiro → distant.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia18/pia18182/PIA18182.jpg",
    bgFit: "distant",
  },

  netuno: {
    id: "netuno", label: "Netuno", kind: "planet",
    skyTop: "#0a1a3a", skyBottom: "#2a5ac9", starColor: "#c0d0ff",
    horizonColor: "#122048", horizonGlow: "rgba(90,120,230,0.25)", glowColor: "#5a7ce6",
    danger: true, // ventos mais fortes do sistema solar, até 2.100 km/h
    decor: ["💨👽", "🌀⚫", "🛰️👋"],
    // Netuno, Voyager 2 (1989) — disco inteiro → distant.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia02/pia02210/PIA02210.jpg",
    bgFit: "distant",
  },

  europa: {
    id: "europa", label: "Europa", kind: "moon",
    skyTop: "#1a2a3a", skyBottom: "#5a7a9a", starColor: "#d0e8ff",
    horizonColor: "#243444", horizonGlow: "rgba(120,180,220,0.25)", glowColor: "#7ab4dc",
    danger: false, decor: ["🧊", "🐟👽", "🛰️", "❄️"],
    // Pôster "Europa" (Exoplanet Travel Bureau) — NASA/JPL-Caltech.
    bgImageUrl: "https://science.nasa.gov/wp-content/uploads/2024/05/europa-travel-poster-image.jpg",
    bgFit: "cover",
  },
  kepler: {
    id: "kepler", label: "Kepler-16b", kind: "exoplanet",
    skyTop: "#0a1a2a", skyBottom: "#2a6a7a", starColor: "#a0f0ff",
    horizonColor: "#123040", horizonGlow: "rgba(60,200,220,0.25)", glowColor: "#3cc8dc",
    danger: false,
    decor: ["☀️☀️", "👤👤", "🥶", "🛰️"],
    // Pôster "Kepler-16b" (Visions of the Future) — NASA/JPL.
    bgImageUrl: "https://d2pn8kiwq2w21t.cloudfront.net/original_images/kepler16b.jpg",
    bgFit: "cover",
  },
  alpha_a: {
    id: "alpha_a", label: "Alpha Centauri A", kind: "star",
    skyTop: "#2a1a00", skyBottom: "#ffb020", starColor: "#fff0c0",
    horizonColor: "#4a2c00", horizonGlow: "rgba(255,180,40,0.4)", glowColor: "#ffb020",
    danger: true, decor: ["🔥", "☀️👽", "🛰️💥"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },
  proxima: {
    id: "proxima", label: "Proxima Centauri b", kind: "exoplanet",
    skyTop: "#2a0a0a", skyBottom: "#9a2a2a", starColor: "#ffb0a0",
    horizonColor: "#4a1010", horizonGlow: "rgba(220,80,60,0.3)", glowColor: "#dc503c",
    danger: true, decor: ["🌋", "👽🔴", "🛰️"],
    // Superfície de Proxima b (ilustração oficial) — ESO/M. Kornmesser, CC BY 4.0.
    bgImageUrl: "https://cdn.eso.org/images/wallpaper4/eso1629a.jpg",
    bgFit: "cover",
  },
  sol: {
    id: "sol", label: "Sol", kind: "star",
    skyTop: "#3a1400", skyBottom: "#ff6a00", starColor: "#ffd080",
    horizonColor: "#5a2000", horizonGlow: "rgba(255,120,20,0.45)", glowColor: "#ff6a00",
    danger: true, decor: ["🔥🔥", "☀️", "🛰️💥", "👽🥵"],
    // O Sol AGORA — SDO/NASA, imagem atualizada a cada ~15 min.
    bgImageUrl: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_0304.jpg",
    bgFit: "distant",
  },
  betelgeuse: {
    id: "betelgeuse", label: "Betelgeuse", kind: "star",
    skyTop: "#2a0000", skyBottom: "#c9302a", starColor: "#ffb0a0",
    horizonColor: "#4a0808", horizonGlow: "rgba(220,50,40,0.4)", glowColor: "#dc3228",
    danger: true, decor: ["💥", "👽🔴", "🛰️💫", "⭐💀"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },

  // ============ ROTA ESTENDIDA — GALÁXIAS ============
  // Fotos: ESA/Hubble (CC BY 4.0) e ESO (CC BY 4.0).
  andromeda: {
    id: "andromeda", label: "Galáxia de Andrômeda", ...GALAXY_BASE,
    decor: ["🌌", "👽🔭", "💥🕰️", "🛸"],
    // Mosaico de Andrômeda pelo Hubble — ESA/Hubble, CC BY 4.0.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1502a.jpg",
    bgFit: "cover",
  },
  triangulum: {
    id: "triangulum", label: "Galáxia do Triângulo", ...GALAXY_BASE,
    decor: ["🔺🌌", "👽👀", "⭐⭐"],
    // M33 pelo Hubble — ESA/Hubble, CC BY 4.0.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1901a.jpg",
    bgFit: "cover",
  },
  sombrero: {
    id: "sombrero", label: "Galáxia do Sombreiro", ...GALAXY_BASE,
    decor: ["👒🌌", "👽🎩", "⚫💫"],
    // M104 pelo Hubble — ESA/Hubble & NASA. Disco → distant.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/opo0328a.jpg",
    bgFit: "distant",
  },
  whirlpool: {
    id: "whirlpool", label: "Galáxia Redemoinho", ...GALAXY_BASE,
    decor: ["🌀🌌", "👽😵‍💫", "🛸💫"],
    // M51 pelo Hubble — ESA/Hubble, CC BY 4.0. Disco → distant.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0506a.jpg",
    bgFit: "distant",
  },
  pinwheel: {
    id: "pinwheel", label: "Galáxia Cata-Vento", ...GALAXY_BASE,
    decor: ["🎡🌌", "👽🌟", "🛰️"],
    // M101 pelo Hubble — ESA/Hubble, CC BY 4.0. Disco → distant.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0602a.jpg",
    bgFit: "distant",
  },
  cigar: {
    id: "cigar", label: "Galáxia do Charuto", ...GALAXY_BASE,
    decor: ["💨🌌", "👽🚬❌", "⭐🏭"],
    // M82 pelo Hubble — ESA/Hubble, CC BY 4.0. Disco → distant.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0604a.jpg",
    bgFit: "distant",
  },
  centaurus_a: {
    id: "centaurus_a", label: "Centaurus A", ...GALAXY_BASE,
    decor: ["📡🌌", "👽🎧", "⚫💨"],
    // Centaurus A pelo ESO — ESO, CC BY 4.0. Disco → distant.
    bgImageUrl: "https://cdn.eso.org/images/wallpaper4/eso0903a.jpg",
    bgFit: "distant",
  },
  smc: {
    id: "smc", label: "Pequena Nuvem de Magalhães", ...GALAXY_BASE,
    decor: ["☁️⭐", "👽🇧🇷🔭", "🛸"],
    // Maior imagem infravermelha já feita da SMC, telescópio VISTA — ESO, CC BY 4.0.
    bgImageUrl: "https://cdn.eso.org/images/wallpaper4/eso1714a.jpg",
    bgFit: "cover",
  },
  lmc: {
    id: "lmc", label: "Grande Nuvem de Magalhães", ...GALAXY_BASE,
    decor: ["☁️🌟", "🕷️🌌", "💥1987"],
    // Trecho detalhado da LMC, MPG/ESO 2,2 m em La Silla — ESO, CC BY 4.0.
    bgImageUrl: "https://cdn.eso.org/images/wallpaper4/eso1021a.jpg",
    bgFit: "cover",
  },
  messier_87: {
    id: "messier_87", label: "M87 (Virgo A)", ...GALAXY_BASE,
    danger: true, // buraco negro supermassivo de verdade
    decor: ["⚫📸", "👽😱", "🍩🔥"],
    // A 1ª foto real de um buraco negro (EHT, 2019) — ESO/EHT, CC BY 4.0.
    bgImageUrl: "https://cdn.eso.org/images/wallpaper4/eso1907a.jpg",
    bgFit: "distant",
  },

  // ============ ROTA ESTENDIDA — NEBULOSAS ============
  orion_nebula: {
    id: "orion_nebula", label: "Nebulosa de Órion", ...NEBULA_BASE,
    decor: ["⭐🍼", "👽🔭", "🏹"],
    // M42 pelo Hubble — ESA/Hubble, CC BY 4.0. Textura → cover.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg",
    bgFit: "cover",
  },
  eagle_nebula: {
    id: "eagle_nebula", label: "Nebulosa da Águia", ...NEBULA_BASE,
    decor: ["🦅🌌", "🏛️⭐", "👽📸"],
    // Pilares da Criação pelo Hubble (2015) — ESA/Hubble, CC BY 4.0.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1501a.jpg",
    bgFit: "cover",
  },
  crab_nebula: {
    id: "crab_nebula", label: "Nebulosa do Caranguejo", ...NEBULA_BASE,
    danger: true, // pulsar girando 30x por segundo no centro
    decor: ["🦀🌌", "💥1054", "🌀⚡"],
    // M1 pelo Hubble — ESA/Hubble, CC BY 4.0. Textura → cover.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0515a.jpg",
    bgFit: "cover",
  },
  horsehead: {
    id: "horsehead", label: "Cabeça de Cavalo", ...NEBULA_BASE,
    decor: ["🐴🌌", "👽🤠", "🌑"],
    // Cabeça de Cavalo (infravermelho, Hubble) — ESA/Hubble, CC BY 4.0.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1307a.jpg",
    bgFit: "cover",
  },
  carina_nebula: {
    id: "carina_nebula", label: "Nebulosa de Carina", ...NEBULA_BASE,
    decor: ["🏔️🌌", "🔭✨", "👽🤩"],
    // "Penhascos Cósmicos" — 1ª leva de imagens do James Webb (2022).
    // NASA/ESA/CSA/STScI, CC BY 4.0. Textura → cover.
    bgImageUrl: "https://cdn.esawebb.org/archives/images/screen/weic2205a.jpg",
    bgFit: "cover",
  },
  ring_nebula: {
    id: "ring_nebula", label: "Nebulosa do Anel", ...NEBULA_BASE,
    decor: ["💍🌌", "👽💎", "⚪🔥"],
    // M57 pelo Hubble (2013) — NASA/ESA e C. Robert O'Dell, CC BY 4.0.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1310a.jpg",
    bgFit: "cover",
  },

  // ============ ROTA ESTENDIDA — EXOPLANETAS ============
  trappist_1e: {
    id: "trappist_1e", label: "TRAPPIST-1e", ...EXO_BASE,
    decor: ["7️⃣🪐", "👽🏠", "🔴☀️"],
    // Superfície de TRAPPIST-1 (ilustração oficial) — ESO/M. Kornmesser, CC BY 4.0.
    bgImageUrl: "https://cdn.eso.org/images/wallpaper4/eso1706a.jpg",
    bgFit: "cover",
  },
  kepler_186f: {
    id: "kepler_186f", label: "Kepler-186f", ...EXO_BASE,
    decor: ["🌍👯", "🔴🌅", "👽🌱"],
    // Ilustração oficial Kepler-186f — NASA Ames/SETI/JPL-Caltech.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia17/pia17999/PIA17999.jpg",
    bgFit: "cover",
  },
  kepler_452b: {
    id: "kepler_452b", label: "Kepler-452b", ...EXO_BASE,
    decor: ["🌍👵", "☀️😎", "👽📅385"],
    // Ilustração oficial Kepler-452b — NASA Ames/JPL-Caltech/T. Pyle.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia19/pia19827/PIA19827.jpg",
    bgFit: "cover",
  },
  proxima_c: {
    id: "proxima_c", label: "Proxima Centauri c", ...EXO_BASE,
    danger: true,
    decor: ["🥶🪐", "🔴⭐", "👽🧊"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },
  hd_209458b: {
    id: "hd_209458b", label: "Osiris (HD 209458 b)", ...EXO_BASE,
    danger: true, // planeta evaporando de verdade
    decor: ["💨🪐", "☄️🔥", "👽🏜️"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },
  "55_cancri_e": {
    id: "55_cancri_e", label: "55 Cancri e", ...EXO_BASE,
    danger: true, // oceano de lava de verdade
    decor: ["💎🪐", "🌋🔥", "👽🤑"],
    // Concepção artística oficial do James Webb — NASA/ESA/CSA, CC BY 4.0.
    bgImageUrl: "https://cdn.esawebb.org/archives/images/screen/weic2412a.jpg",
    bgFit: "cover",
  },

  // ============ ROTA ESTENDIDA — SISTEMAS ESTELARES ============
  alpha_cen_b: {
    id: "alpha_cen_b", label: "Alpha Centauri B", ...STARSYS_BASE,
    decor: ["🟠⭐", "3️⃣☀️", "👽🏡"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },
  sirius: {
    id: "sirius", label: "Sirius A & B", ...STARSYS_BASE,
    decor: ["💎⭐", "🐕🌟", "👽😎"],
    // Sirius A e B pelo Hubble — ESA/Hubble, CC BY 4.0. Estrela → distant.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0516a.jpg",
    bgFit: "distant",
  },
  vega: {
    id: "vega", label: "Vega", ...STARSYS_BASE,
    decor: ["📏⭐", "🧭🔮", "👽📡"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },
  betelgeuse_team: {
    id: "betelgeuse_team", label: "Betelgeuse (visita guiada)", ...STARSYS_BASE,
    danger: true, // supergigante prestes a explodir (em escala cósmica!)
    decor: ["🔴💣", "💥⏳", "👽🏃"],
    // Betelgeuse pelo ALMA — ESO/ALMA, CC BY 4.0. Estrela → distant.
    bgImageUrl: "https://cdn.eso.org/images/wallpaper4/eso1721a.jpg",
    bgFit: "distant",
  },

  // ============ ROTA ESTENDIDA — AGLOMERADOS ============
  pleiades: {
    id: "pleiades", label: "Plêiades (M45)", ...CLUSTER_BASE,
    decor: ["7️⃣⭐", "💙✨", "👽🚗"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },
  hyades: {
    id: "hyades", label: "Híades", ...CLUSTER_BASE,
    decor: ["🐂⭐", "🏠✨", "👽🔭"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },
  omega_centauri: {
    id: "omega_centauri", label: "Omega Centauri", ...CLUSTER_BASE,
    decor: ["💫🌟", "🔟M⭐", "👽😵"],
    // Omega Centauri pelo Hubble — ESA/Hubble, CC BY 4.0. Textura → cover.
    bgImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0809a.jpg",
    bgFit: "cover",
  },

  // ============ ROTA ESTENDIDA — QUASAR ============
  "3c_273": {
    id: "3c_273", label: "Quasar 3C 273", kind: "quasar",
    skyTop: "#0a0614", skyBottom: "#2c1050", starColor: "#e0c8ff",
    horizonColor: "#1a0a30", horizonGlow: "rgba(200,140,255,0.3)", glowColor: "#c88aff",
    danger: true, // mais brilhante que 100 Vias Lácteas de verdade
    decor: ["💡🌌", "👽🕶️🕶️", "⚫🔦"],
    // sem foto oficial livre — usa o cenário pintado (space-backdrop.ts)
  },
};

export function getBiomeTheme(destinationId?: string | null): BiomeTheme {
  if (!destinationId) return { id: "default", label: "Espaço", ...DEFAULT_THEME };
  const theme = BIOMES[destinationId];
  if (theme) return theme;
  return { id: destinationId, label: destinationId, ...DEFAULT_THEME };
}
