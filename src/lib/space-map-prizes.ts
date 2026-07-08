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
      "Você alastrou o seu mapa até a Mesosfera e ganhou uma Pilha de Bagdá. Aproveite e recarregue seus vagalumes para iluminação no espaço escuro.",
    extra:
      "A Pilha de Bagdá é um artefato arqueológico de ~2.000 anos: um jarro de cerâmica com um cilindro de cobre e uma haste de ferro que, com um eletrólito ácido, produz uma pequena voltagem. Uma bateria antes da bateria.",
    image: baghdadImg,
    accent: "border-yellow-400 shadow-[0_0_28px_-6px_oklch(0.85_0.2_90)]",
  },
  {
    id: "warp-pistol",
    threshold: 10,
    title: "Pistola Ativadora de Dobras Warp",
    subtitle: "Novo estágio · Via Láctea",
    message:
      "Você atingiu um novo estágio na constelação da Via Láctea. Receba uma Pistola Ativadora de Dobras Warp para viagens instantâneas pelos céus.",
    extra:
      "A dobra Warp comprime o espaço-tempo à frente da nave e o expande atrás dela, criando uma 'bolha' que se desloca mais rápido que a luz — sem que a nave, dentro da bolha, chegue a ultrapassar a velocidade da luz localmente. Teorizada por Miguel Alcubierre em 1994.",
    image: warpImg,
    accent: "border-cyan-400 shadow-[0_0_28px_-6px_oklch(0.85_0.2_220)]",
  },
  {
    id: "photonic-candles",
    threshold: 15,
    title: "Velas Fotônicas",
    subtitle: "Viagem interestelar",
    message:
      "Você recebeu Velas Fotônicas para sua próxima viagem interestelar, para que seu corpo não apodreça no caminho.",
    extra:
      "Velas fotônicas (light sails) são acionadas pela pressão de radiação de fótons — o mesmo princípio da vela solar. Combinadas com hibernação/estase, permitem cobrir distâncias interestelares dentro do tempo de vida do viajante.",
    image: candlesImg,
    accent: "border-amber-300 shadow-[0_0_28px_-6px_oklch(0.9_0.18_80)]",
  },
  {
    id: "haarp-helmet",
    threshold: 20,
    title: "Capacete de Alumínio Anti-HAARP",
    subtitle: "Escudo eletromagnético",
    message:
      "Você recebeu um Capacete de Alumínio para se proteger dos ataques das antenas HAARP.",
    extra:
      "O HAARP (High-frequency Active Auroral Research Program) é um conjunto real de antenas no Alasca operado para estudar a ionosfera, injetando ondas de rádio de alta frequência na alta atmosfera. Vira alvo recorrente de teorias de conspiração sobre controle climático e mental — daí o clima 'capacete de alumínio' do prêmio.",
    image: haarpImg,
    accent: "border-slate-300 shadow-[0_0_28px_-6px_oklch(0.85_0.05_240)]",
  },
  {
    id: "chronovisor-goggles",
    threshold: 25,
    title: "Óculos Galácticos do Cronovisor",
    subtitle: "Novo nível de consciência",
    message:
      "Você atingiu um novo nível de conhecimento e consciência. Receba um par de Óculos Galácticos para assistir aos eventos passados gravados no cronovisor.",
    extra:
      "O 'cronovisor' é uma lenda atribuída ao padre italiano Pellegrino Ernetti: uma máquina capaz de captar sons e imagens do passado a partir de resíduos eletromagnéticos deixados no tempo. Nunca comprovado — perfeito para viajantes galácticos.",
    image: chronoImg,
    accent: "border-fuchsia-400 shadow-[0_0_28px_-6px_oklch(0.75_0.24_320)]",
  },
];

const STORAGE_KEY = "space-map-seals-v1";
const CLAIMED_KEY = "space-map-prize-claimed-v1";

function safeGet(): Record<string, true> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
function safeSet(v: Record<string, true>) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export function loadSpaceSeals(): Set<string> {
  return new Set(Object.keys(safeGet()));
}
export function addSpaceSeal(objectId: string): Set<string> {
  const cur = safeGet();
  cur[objectId] = true;
  safeSet(cur);
  return new Set(Object.keys(cur));
}

export function loadClaimedPrizes(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAIMED_KEY) || "[]"));
  } catch { return new Set(); }
}
export function markPrizeClaimed(id: string) {
  if (typeof window === "undefined") return;
  const s = loadClaimedPrizes();
  s.add(id);
  try { localStorage.setItem(CLAIMED_KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}
