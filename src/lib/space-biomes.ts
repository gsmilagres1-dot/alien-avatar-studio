// =========================================================
// Biomas do Across Age — um tema visual por destino da rota.
// Fundos com foto REAL (NASA, domínio público) ficam em
// src/assets/ (bg-*.jpg, já cortadas em 2560x1440 paisagem).
//
// bgFit controla o ENQUADRAMENTO da foto na fase:
//   - "cover"   → preenche a tela cortando o excesso, SEM
//                 esticar (proporção real), com parallax.
//   - "distant" → astro desenhado pequeno no canto do céu,
//                 como cenário distante (discos de planeta).
// Sem bgFit definido, o jogo assume "cover".
// =========================================================

import bgMarte from "@/assets/bg-marte.jpg";
import bgLua from "@/assets/bg-lua.jpg";
import bgVenus from "@/assets/bg-venus.jpg";
import bgSaturno from "@/assets/bg-saturno.jpg";
import bgGanimedes from "@/assets/bg-ganimedes.jpg";
import bgJupiter from "@/assets/bg-jupiter.jpg";

export type DestinationKind = "planet" | "moon" | "star" | "exoplanet" | "dwarf-planet";

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

export const BIOMES: Record<string, BiomeTheme> = {
  marte: {
    id: "marte", label: "Marte", kind: "planet",
    skyTop: "#3a1f12", skyBottom: "#a85a2e", starColor: "#ffcfa0",
    horizonColor: "#6a3418", horizonGlow: "rgba(232,120,60,0.25)", glowColor: "#e8783c",
    danger: false, decor: ["🦴", "🛸", "👽", "🪐"],
    // Panorâmica do rover Curiosity na Cratera Gale — foto real NASA,
    // com céu espacial estendido pra caber em paisagem 2560x1440.
    // Crédito: NASA/JPL-Caltech/MSSS.
    bgImageUrl: bgMarte,
    bgFit: "cover",
  },

  mercurio: {
    id: "mercurio", label: "Mercúrio", kind: "planet",
    skyTop: "#2a1a0a", skyBottom: "#8a7048", starColor: "#ffe8b0",
    horizonColor: "#4a3a20", horizonGlow: "rgba(200,160,90,0.25)", glowColor: "#e0b060",
    danger: true, // mais perto do sol, variação de temperatura extrema de verdade
    decor: ["🥵🥶", "☀️🛰️", "👽🕶️", "🌋"],
    // Superfície de Mercúrio, sonda MESSENGER — foto real NASA (hotlink).
    // Crédito: NASA/Johns Hopkins APL/Carnegie Institution of Washington.
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia12/pia12051/PIA12051.jpg",
    bgFit: "cover",
  },

  lua: {
    id: "lua", label: "Lua", kind: "moon",
    skyTop: "#0a0a14", skyBottom: "#3a3a4a", starColor: "#eef0ff",
    horizonColor: "#1c1c28", horizonGlow: "rgba(200,200,220,0.2)", glowColor: "#c8c8dc",
    danger: false, decor: ["🚩", "👣", "📷👽", "🛰️"],
    // Panorâmica da Cratera Shorty, Apollo 17 (1972) — foto real NASA,
    // com céu espacial estendido pra paisagem 2560x1440.
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
    // Curiosidade extra pro banco de fatos: a única foto tirada DO CHÃO
    // de Vênus é da sonda soviética Venera 13 (1982), que derreteu em
    // ~2h no calor de 460°C.
    bgImageUrl: bgVenus,
    bgFit: "cover",
  },

  jupiter: {
    id: "jupiter", label: "Júpiter", kind: "planet",
    skyTop: "#2a1a0a", skyBottom: "#c97a3a", starColor: "#ffd0a0",
    horizonColor: "#5a3418", horizonGlow: "rgba(230,140,60,0.25)", glowColor: "#e6823c",
    danger: false, decor: ["🌪️👽", "🛰️💫", "🔴👀", "🪐"],
    // Nuvens de Júpiter com horizonte curvo, sonda Juno (JunoCam) —
    // processamento de cientista cidadão. Crédito OBRIGATÓRIO nos
    // créditos do jogo: NASA/JPL-Caltech/SwRI/MSSS/Thomas Thomopoulos.
    bgImageUrl: bgJupiter,
    bgFit: "cover",
  },

  ganimedes: {
    id: "ganimedes", label: "Ganimedes", kind: "moon",
    skyTop: "#0e0e16", skyBottom: "#4a4a58", starColor: "#eef0ff",
    horizonColor: "#22222e", horizonGlow: "rgba(190,195,220,0.22)", glowColor: "#b8bcd8",
    danger: false,
    decor: [
      "🥇🌕",   // a MAIOR lua do sistema solar — maior até que Mercúrio!
      "🧲👽",   // única lua com campo magnético próprio
      "🌊🧊",   // oceano de água salgada escondido sob o gelo
      "🛰️📸",   // fotografada de perto pela sonda Juno em 2021
    ],
    // Ganimedes, a maior lua do sistema solar, sobrevoo da sonda Juno
    // (2021, PIA25012) — foto real NASA, cortada em paisagem com o
    // horizonte curvo. Crédito: NASA/JPL-Caltech/SwRI/MSSS.
    bgImageUrl: bgGanimedes,
    bgFit: "cover",
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
    // O "coração" de Plutão (Tombaugh Regio), New Horizons, 2015 —
    // disco inteiro → distant (pequeno no céu). Crédito: NASA/JHUAPL/SwRI.
    bgImageUrl: "https://www.nasa.gov/wp-content/uploads/2023/03/nh-pluto_crop.jpg.png",
    bgFit: "distant",
  },

  saturno: {
    id: "saturno", label: "Saturno", kind: "planet",
    skyTop: "#2a2410", skyBottom: "#c9b06a", starColor: "#fff0c0",
    horizonColor: "#4a4020", horizonGlow: "rgba(230,200,120,0.25)", glowColor: "#e6c87c",
    danger: false, decor: ["💍👽", "🛰️📸", "❄️💫", "🪨"],
    // Saturno e seus anéis pela sonda Cassini — foto real NASA, composta
    // num céu espacial 2560x1440 (planeta grande à direita da cena).
    // Crédito: NASA/JPL-Caltech/Space Science Institute.
    bgImageUrl: bgSaturno,
    bgFit: "cover",
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
    // Urano, Voyager 2 (1986) — disco inteiro → distant (pequeno no céu).
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia18/pia18182/PIA18182.jpg",
    bgFit: "distant",
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
    // Netuno, Voyager 2 (1989) — disco inteiro → distant (pequeno no céu).
    bgImageUrl: "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia02/pia02210/PIA02210.jpg",
    bgFit: "distant",
  },

  europa: {
    id: "europa", label: "Europa", kind: "moon",
    skyTop: "#1a2a3a", skyBottom: "#5a7a9a", starColor: "#d0e8ff",
    horizonColor: "#243444", horizonGlow: "rgba(120,180,220,0.25)", glowColor: "#7ab4dc",
    danger: false, decor: ["🧊", "🐟👽", "🛰️", "❄️"],
    // Pôster "Europa: Discover Life Under The Ice" — série de viagem
    // da NASA/JPL-Caltech, domínio público. Formato retrato: o modo
    // cover recorta a faixa central em paisagem automaticamente.
    bgImageUrl: "https://science.nasa.gov/wp-content/uploads/2024/05/europa-travel-poster-image.jpg",
    bgFit: "cover",
  },
  kepler: {
    id: "kepler", label: "Kepler-16b", kind: "exoplanet",
    skyTop: "#0a1a2a", skyBottom: "#2a6a7a", starColor: "#a0f0ff",
    horizonColor: "#123040", horizonGlow: "rgba(60,200,220,0.25)", glowColor: "#3cc8dc",
    danger: false,
    decor: [
      "☀️☀️",   // orbita DOIS sóis, como Tatooine de Star Wars
      "👤👤",   // "onde sua sombra sempre tem companhia" (2 sombras!)
      "🥶",     // frio como gelo seco
      "🛰️",
    ],
    // Pôster "Kepler-16b: where your shadow always has company" —
    // série Visions of the Future, NASA/JPL, domínio público.
    // ATENÇÃO: o rótulo mudou de Kepler-22b pra Kepler-16b (o planeta
    // real do pôster, o dos dois sóis) — atualize também o nome e as
    // perguntas desse destino no intergalactic.ts pra manter coerente.
    bgImageUrl: "https://d2pn8kiwq2w21t.cloudfront.net/original_images/kepler16b.jpg",
    bgFit: "cover",
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
    // Ilustração oficial da superfície de Proxima b (eso1629a), já em
    // paisagem 1920x1200 — licença CC-BY 4.0, crédito OBRIGATÓRIO:
    // "ESO/M. Kornmesser" (mantenha nos créditos do jogo).
    bgImageUrl: "https://cdn.eso.org/images/wallpaper4/eso1629a.jpg",
    bgFit: "cover",
  },
  sol: {
    id: "sol", label: "Sol", kind: "star",
    skyTop: "#3a1400", skyBottom: "#ff6a00", starColor: "#ffd080",
    horizonColor: "#5a2000", horizonGlow: "rgba(255,120,20,0.45)", glowColor: "#ff6a00",
    danger: true, decor: ["🔥🔥", "☀️", "🛰️💥", "👽🥵"],
    // O Sol AGORA, filtro 304Å — observatório SDO/NASA, atualizado
    // automaticamente a cada ~15 min. O jogador vê o Sol como ele está
    // DE VERDADE hoje, com manchas e erupções do dia.
    bgImageUrl: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_2048_0304.jpg",
    bgFit: "distant",
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
