// =========================================================
// Biomas do Across Age — um tema visual por destino da rota.
// Os 9 primeiros do sistema solar já têm foto REAL da NASA
// (domínio público, sem direitos autorais) como fundo da fase,
// além de decoração cômica (emoji) no estilo HCR2. Os destinos
// mais distantes da rota (exoplanetas, estrelas) ainda estão só
// com paleta de cor — dá pra adicionar foto real neles depois
// do mesmo jeito.
// =========================================================

export type DestinationKind = "planet" | "moon" | "star" | "exoplanet" | "dwarf-planet";

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
  bgImageUrl?: string; // foto real (NASA/ESA, domínio público) quando existir
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

export const BIOMES: Record<string, BiomeTheme> = {
  marte: {
    id: "marte", label: "Marte", kind: "planet",
    skyTop: "#3a1f12", skyBottom: "#a85a2e", starColor: "#ffcfa0",
    horizonColor: "#6a3418", horizonGlow: "rgba(232,120,60,0.25)", glowColor: "#e8783c",
    danger: false, decor: ["🦴", "🛸", "👽", "🪐"],
    // Cratera Gale, vista do rover Curiosity (Mastcam) — foto real NASA.
    // Crédito: NASA/JPL-Caltech/MSSS.
    bgImageUrl: "https://svs.gsfc.nasa.gov/vis/a030000/a031300/a031343/mars_PIA26551_zoom_and_pan_1920x1080.jpg",
  },

  mercurio: {
    id: "mercurio", label: "Mercúrio", kind: "planet",
    skyTop: "#2a1a0a", skyBottom: "#8a7048", starColor: "#ffe8b0",
    horizonColor: "#4a3a20", horizonGlow: "rgba(200,160,90,0.25)", glowColor: "#e0b060",
    danger: true, // mais perto do sol, variação de temperatura extrema de verdade
    decor: ["🥵🥶", "☀️🛰️", "👽🕶️", "🌋"],
    // Vista global da superfície de Mercúrio, sonda MESSENGER — foto real NASA.
    // Crédito: NASA/Johns Hopkins APL/Carnegie Institution of Washington.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia12/pia12051/PIA12051.jpg",
  },

  lua: {
    id: "lua", label: "Lua", kind: "moon",
    skyTop: "#0a0a14", skyBottom: "#3a3a4a", starColor: "#eef0ff",
    horizonColor: "#1c1c28", horizonGlow: "rgba(200,200,220,0.2)", glowColor: "#c8c8dc",
    danger: false, decor: ["🚩", "👣", "📷👽", "🛰️"],
    // Tranquility Base, Apollo 11, 1969 — foto real NASA, domínio público.
    bgImageUrl: "https://www.nasa.gov/wp-content/uploads/2023/03/152495main_image_feature_616b_ys_full.jpg",
  },

  venus: {
    id: "venus", label: "Vênus", kind: "planet",
    skyTop: "#3a2a0a", skyBottom: "#c9a63a", starColor: "#ffe8a0",
    horizonColor: "#5a4418", horizonGlow: "rgba(230,190,60,0.3)", glowColor: "#e6c23c",
    danger: true, // planeta mais quente do sistema solar de verdade
    decor: ["🛰️💀", "👽🍳", "🌡️💥", "👽☂️"],
    // Maat Mons, o maior vulcão de Vênus — reconstrução por radar da
    // sonda Magellan (1992). Foto real NASA, domínio público.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia00/pia00254/PIA00254.jpg",
  },

  jupiter: {
    id: "jupiter", label: "Júpiter", kind: "planet",
    skyTop: "#2a1a0a", skyBottom: "#c97a3a", starColor: "#ffd0a0",
    horizonColor: "#5a3418", horizonGlow: "rgba(230,140,60,0.25)", glowColor: "#e6823c",
    danger: false, decor: ["🌪️👽", "🛰️💫", "🔴👀", "🪐"],
    // Grande Mancha Vermelha, sonda Voyager 1, 1979 — foto real NASA.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia00/pia00014/PIA00014.jpg",
  },

  plutao: {
    id: "plutao", label: "Plutão", kind: "dwarf-planet",
    skyTop: "#0a0a1a", skyBottom: "#2a2a4a", starColor: "#d0d0ff",
    horizonColor: "#151530", horizonGlow: "rgba(150,150,230,0.2)", glowColor: "#8a8ae6",
    danger: false,
    decor: [
      "🪐❌",   // ainda chateado por ter sido rebaixado de planeta em 2006
      "👽😢",   // emocionado com o coração de gelo
      "🛰️👋",   // a sonda só passou de raspão, nem entrou em órbita
      "🌡️❄️",   // frio extremo
    ],
    // O "coração" de Plutão (Tombaugh Regio), sonda New Horizons, 2015.
    // Crédito: NASA/JHUAPL/SwRI.
    bgImageUrl: "https://www.nasa.gov/wp-content/uploads/2023/03/nh-pluto_crop.jpg.png",
  },

  saturno: {
    id: "saturno", label: "Saturno", kind: "planet",
    skyTop: "#2a2410", skyBottom: "#c9b06a", starColor: "#fff0c0",
    horizonColor: "#4a4020", horizonGlow: "rgba(230,200,120,0.25)", glowColor: "#e6c87c",
    danger: false, decor: ["💍👽", "🛰️📸", "❄️💫", "🪨"],
    // Tempestade gigante no hemisfério norte de Saturno, sonda Cassini,
    // 2010/2011 — foto real NASA. Crédito: NASA/JPL-Caltech/Space Science Institute.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia12/pia12824/PIA12824.jpg",
  },

  urano: {
    id: "urano", label: "Urano", kind: "planet",
    skyTop: "#0f2a3a", skyBottom: "#4ab5c9", starColor: "#c0f0ff",
    horizonColor: "#153a48", horizonGlow: "rgba(90,210,230,0.25)", glowColor: "#5ad2e6",
    danger: false,
    decor: [
      "❄️", "🛸", "👾",
      "🙃👽",   // o planeta gira praticamente deitado de lado — de verdade
      "🥶🌡️",   // atmosfera mais fria do sistema solar, mais até que Netuno
      "👽💍",   // procurando os anéis, que são bem fracos e difíceis de ver
    ],
    // Urano fotografado pela sonda Voyager 2 em 1986 — foto real NASA.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia18/pia18182/PIA18182.jpg",
  },

  netuno: {
    id: "netuno", label: "Netuno", kind: "planet",
    skyTop: "#0a1a3a", skyBottom: "#2a5ac9", starColor: "#c0d0ff",
    horizonColor: "#122048", horizonGlow: "rgba(90,120,230,0.25)", glowColor: "#5a7ce6",
    danger: true, // ventos mais fortes do sistema solar, até 2.100 km/h
    decor: [
      "💨👽",   // arrastado pelo vento
      "🌀⚫",   // Grande Mancha Escura, tempestade do tamanho da Terra
      "🛰️👋",   // último planeta visitado pela Voyager 2
    ],
    // Netuno, sonda Voyager 2, 1989 — foto real NASA.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia02/pia02210/PIA02210.jpg",
  },

  // ---- ainda sem foto real — só paleta de cor por enquanto ----
  europa: {
    id: "europa", label: "Europa", kind: "moon",
    skyTop: "#1a2a3a", skyBottom: "#5a7a9a", starColor: "#d0e8ff",
    horizonColor: "#243444", horizonGlow: "rgba(120,180,220,0.25)", glowColor: "#7ab4dc",
    danger: false, decor: ["🧊", "🐟👽", "🛰️", "❄️"],
  },
  kepler: {
    id: "kepler", label: "Kepler-22b", kind: "exoplanet",
    skyTop: "#0a1a2a", skyBottom: "#2a6a7a", starColor: "#a0f0ff",
    horizonColor: "#123040", horizonGlow: "rgba(60,200,220,0.25)", glowColor: "#3cc8dc",
    danger: false, decor: ["🌊", "👽🏝️", "🛰️", "🪐"],
  },
  alpha_a: {
    id: "alpha_a", label: "Alpha Centauri A", kind: "star",
    skyTop: "#2a1a00", skyBottom: "#ffb020", starColor: "#fff0c0",
    horizonColor: "#4a2c00", horizonGlow: "rgba(255,180,40,0.4)", glowColor: "#ffb020",
    danger: true, decor: ["🔥", "☀️👽", "🛰️💥"],
  },
  proxima: {
    id: "proxima", label: "Proxima Centauri b", kind: "exoplanet",
    skyTop: "#2a0a0a", skyBottom: "#9a2a2a", starColor: "#ffb0a0",
    horizonColor: "#4a1010", horizonGlow: "rgba(220,80,60,0.3)", glowColor: "#dc503c",
    danger: true, decor: ["🌋", "👽🔴", "🛰️"],
  },
  sol: {
    id: "sol", label: "Sol", kind: "star",
    skyTop: "#3a1400", skyBottom: "#ff6a00", starColor: "#ffd080",
    horizonColor: "#5a2000", horizonGlow: "rgba(255,120,20,0.45)", glowColor: "#ff6a00",
    danger: true, decor: ["🔥🔥", "☀️", "🛰️💥", "👽🥵"],
  },
  betelgeuse: {
    id: "betelgeuse", label: "Betelgeuse", kind: "star",
    skyTop: "#2a0000", skyBottom: "#c9302a", starColor: "#ffb0a0",
    horizonColor: "#4a0808", horizonGlow: "rgba(220,50,40,0.4)", glowColor: "#dc3228",
    danger: true, decor: ["💥", "👽🔴", "🛰️💫", "⭐💀"],
  },
};

export function getBiomeTheme(destinationId?: string | null): BiomeTheme {
  if (!destinationId) return { id: "default", label: "Espaço", ...DEFAULT_THEME };
  const theme = BIOMES[destinationId];
  if (theme) return theme;
  return { id: destinationId, label: destinationId, ...DEFAULT_THEME };
}
