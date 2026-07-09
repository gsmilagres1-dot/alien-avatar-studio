import baghdadImg from "@/assets/prize-baghdad-battery.jpg";
import warpImg from "@/assets/prize-warp-pistol.jpg";
import candlesImg from "@/assets/prize-photonic-candles.jpg";
import haarpImg from "@/assets/prize-haarp-helmet.jpg";
import chronoImg from "@/assets/prize-chronovisor-goggles.jpg";

export interface SpaceMapPrize {
  id: string;
  threshold: number;
  title: string;
  subtitle: string;
  message: string;
  extra?: string;
  image: string;
  accent: string; // tailwind classes for border/glow
}

export const SPACE_MAP_PRIZES: SpaceMapPrize[] = [
  {
    id: "baghdad-battery",
    threshold: 5,
    title: "Pilha de Bagdá",
    subtitle: "Mesosfera alcançada",
    message:
      "Você alastrou o seu mapa até a Mesosfera e ganhou uma Pilha de Bagdá com 7 vagalumes cintilando. Se faltar luz na nave, use os vagalumes recarregáveis.",
    extra:
      "A Pilha de Bagdá é um artefato antigo em forma de jarro com cobre e ferro, lembrado como uma possível bateria primitiva — perfeita para carregar luz de emergência espacial.",
    image: baghdadImg,
    accent: "border-yellow-400 shadow-[0_0_28px_-6px_oklch(0.85_0.2_90)]",
  },
  {
    id: "warp-pistol",
    threshold: 10,
    title: "Pistola Ativadora de Dobras Warp",
    subtitle: "Transporte por dobra Warp",
    message:
      "Você atingiu um novo estágio na constelação da Via Láctea. Transporte por dobra Warp liberado para viajar na velocidade da luz e buscar um café quente em Marte.",
    extra:
      "A dobra Warp é a ideia de curvar o espaço-tempo ao redor da nave: em vez de correr pelo espaço, a nave pega um atalho cósmico dentro de uma bolha de viagem.",
    image: warpImg,
    accent: "border-cyan-400 shadow-[0_0_28px_-6px_oklch(0.85_0.2_220)]",
  },
  {
    id: "photonic-candles",
    threshold: 15,
    title: "Velas Fotônicas",
    subtitle: "Expedição solar",
    message:
      "Você recebeu Velas Fotônicas para seguir em expedição solar e ainda se bronzear com elegância durante a viagem.",
    extra:
      "Velas fotônicas usam a pressão da luz para empurrar uma nave, como uma vela comum usa o vento — só que o vento aqui são fótons vindos das estrelas.",
    image: candlesImg,
    accent: "border-amber-300 shadow-[0_0_28px_-6px_oklch(0.9_0.18_80)]",
  },
  {
    id: "haarp-helmet",
    threshold: 20,
    title: "Capacete de Alumínio Anti-HAARP",
    subtitle: "Proteção anti-antenas",
    message:
      "Você recebeu um Capacete Anti-Antenas HAARP para se proteger de perturbações por ondas sônicas em viagens espaciais.",
    extra:
      "O HAARP é um projeto real de antenas usado para estudar a ionosfera com ondas de rádio. No app, o capacete entra no modo humorado: blindagem galáctica contra ruídos, teorias e sustos da viagem.",
    image: haarpImg,
    accent: "border-slate-300 shadow-[0_0_28px_-6px_oklch(0.85_0.05_240)]",
  },
  {
    id: "chronovisor-goggles",
    threshold: 25,
    title: "Óculos Portátil do Cronovisor",
    subtitle: "Passado remoto",
    message:
      "Você atingiu um novo nível de conhecimento e consciência. Receba os Óculos Portáteis do Cronovisor para ver o passado remoto.",
    extra:
      "O cronovisor é uma lenda sobre uma máquina capaz de captar imagens e sons do passado. Aqui virou equipamento portátil para arqueologia cósmica e curiosidade intergaláctica.",
    image: chronoImg,
    accent: "border-fuchsia-400 shadow-[0_0_28px_-6px_oklch(0.75_0.24_320)]",
  },
];

