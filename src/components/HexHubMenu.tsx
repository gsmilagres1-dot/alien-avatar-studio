import { Link } from "@tanstack/react-router";
import { Users, Coins, Map, Rocket, Wrench, Swords, Gamepad2 } from "lucide-react";

/**
 * HexHubMenu
 * ---------------------------------------------------------------
 * Reaproveita literalmente o código/estilo dos botões hexagonais
 * originais de src/routes/index.tsx (objeto METAL, anel de
 * gradiente via padding, círculo do ícone com pulso, hint no
 * canto, label branco + sub cinza, sombra). A ÚNICA mudança real
 * é o clip-path: hexágono → trapézio.
 *
 * O ícone/texto fica numa camada separada (sem clip-path) porque
 * clip-path corta tudo dentro do elemento, inclusive texto — nos
 * hexágonos originais isso não aparecia porque a forma era larga
 * o bastante; no trapézio (mais estreito numa ponta) cortava
 * palavra. Resto é idêntico ao original.
 * ---------------------------------------------------------------
 */

type Item = {
  to: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  sub: string;
  hint: string;
  metal: "silver" | "gold" | "copper" | "plasma";
  ring: string;
  accent: string;
  glow: string;
};

// Copiado literalmente de src/routes/index.tsx — objeto METAL
const METAL = {
  silver: { ring: "from-[#f4f6fa] via-[#9aa3b2] to-[#3b4250]", accent: "text-slate-200", glow: "#9aa3b2" },
  gold: { ring: "from-[#fff3c2] via-[#d4ad4a] to-[#5a3d0a]", accent: "text-amber-200", glow: "#d4ad4a" },
  copper: { ring: "from-[#f8d8b6] via-[#c08050] to-[#4a2510]", accent: "text-orange-200", glow: "#c08050" },
  plasma: { ring: "from-[#c9f0ff] via-[#7a4dd0] to-[#1a0a3a]", accent: "text-cyan-200", glow: "#7a4dd0" },
};

// Aumenta os gomos para alinhar com a largura dos botões de cima
// e dar mais respiro para os textos não ficarem sobre os traços.
const SCALE = 1.1275;

const scalePct = (n: number) => 50 + (n - 50) * SCALE;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

const scaleClipPath = (polygon: string) =>
  polygon.replace(
    /(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/g,
    (_, x, y) => `${fmtPct(scalePct(Number(x)))} ${fmtPct(scalePct(Number(y)))}`
  );

const OUTER: Item[] = [
  { to: "/equipes", icon: Users, label: "Equipe", sub: "Intergaláctica", hint: "TEAM-Σ", metal: "gold", ...METAL.gold },
  { to: "/loja", icon: Coins, label: "Fichas", sub: "Loja · S.O.S.", hint: "FIC-€", metal: "gold", ...METAL.gold },
  { to: "/mapa", icon: Map, label: "Mapa", sub: "45 destinos", hint: "MAP-∞", metal: "plasma", ...METAL.plasma },
  { to: "/galeria", icon: Rocket, label: "Galeria", sub: "Suas identid.", hint: "GAL-9", metal: "plasma", ...METAL.plasma },
  { to: "/upgrades", icon: Wrench, label: "Upgrades", sub: "Evoluir nave", hint: "UPG-7", metal: "silver", ...METAL.silver },
  { to: "/batalha", icon: Swords, label: "Batalha", sub: "9 perguntas", hint: "BTL-X", metal: "copper", ...METAL.copper },
];

// paths de cada trapézio (com cantos arredondados de verdade — não é só o traço,
// é o contorno da forma inteira), em unidades do viewBox 536.7 x 429.8
const TRAP_PATHS = [
  "M 300.28,45.35 Q 300.28,34.35 310.54,38.33 L 544.10,128.93 Q 554.35,132.91 544.10,136.89 L 416.40,186.42 Q 406.15,190.40 395.89,186.42 L 310.54,153.31 Q 300.28,149.34 300.28,138.34 Z",
  "M 548.34,141.82 Q 558.59,137.84 558.59,148.84 L 558.59,323.96 Q 558.59,334.96 548.34,330.98 L 420.64,281.44 Q 410.39,277.46 410.39,266.46 L 410.39,206.34 Q 410.39,195.34 420.64,191.36 Z",
  "M 544.10,335.91 Q 554.35,339.89 544.10,343.87 L 310.54,434.47 Q 300.28,438.45 300.28,427.45 L 300.28,334.46 Q 300.28,323.46 310.54,319.49 L 395.89,286.38 Q 406.15,282.40 416.40,286.38 Z",
  "M 291.80,427.45 Q 291.80,438.45 281.55,434.47 L 47.99,343.87 Q 37.73,339.89 47.99,335.91 L 175.68,286.38 Q 185.94,282.40 196.20,286.38 L 281.55,319.49 Q 291.80,323.46 291.80,334.46 Z",
  "M 43.75,330.98 Q 33.49,334.96 33.49,323.96 L 33.49,148.84 Q 33.49,137.84 43.75,141.82 L 171.44,191.36 Q 181.70,195.33 181.70,206.33 L 181.70,266.46 Q 181.70,277.46 171.44,281.44 Z",
  "M 47.99,136.89 Q 37.73,132.91 47.99,128.93 L 281.55,38.33 Q 291.80,34.35 291.80,45.35 L 291.80,138.34 Q 291.80,149.34 281.55,153.31 L 196.20,186.42 Q 185.94,190.40 175.68,186.42 Z",
];

// clip-path (%) pras áreas clicáveis — cantos vivos aqui é ok, é só a área de toque
const TRAP_CLICK_CLIPS = [
  "polygon(50.72% 7.27%, 93.63% 28.11%, 68.60% 40.27%, 50.72% 31.59%)",
  "polygon(94.34% 29.15%, 94.34% 70.85%, 69.31% 58.69%, 69.31% 41.31%)",
  "polygon(93.63% 71.89%, 50.72% 92.73%, 50.72% 68.41%, 68.60% 59.73%)",
  "polygon(49.28% 92.73%, 6.37% 71.89%, 31.40% 59.73%, 49.28% 68.41%)",
  "polygon(5.66% 70.85%, 5.66% 29.15%, 30.69% 41.31%, 30.69% 58.69%)",
  "polygon(6.37% 28.11%, 49.28% 7.27%, 49.28% 31.59%, 31.40% 40.27%)",
];

const TRAP_CLICK_CLIPS_SCALED = TRAP_CLICK_CLIPS.map(scaleClipPath);

// posição do conteúdo, escalado junto com os gomos para manter o alinhamento visual
const CONTENT_POS = [
  { left: fmtPct(scalePct(66.54)), top: fmtPct(scalePct(25.90)) },
  { left: fmtPct(scalePct(83.08)), top: fmtPct(scalePct(50.00)) },
  { left: fmtPct(scalePct(66.54)), top: fmtPct(scalePct(74.10)) },
  { left: fmtPct(scalePct(33.46)), top: fmtPct(scalePct(74.10)) },
  { left: fmtPct(scalePct(16.92)), top: fmtPct(scalePct(50.00)) },
  { left: fmtPct(scalePct(33.46)), top: fmtPct(scalePct(25.90)) },
];

// cor "média" de cada METAL, usada só no contorno SVG (stroke uniforme em qualquer ângulo)
const STROKE = { silver: "#c9d0dd", gold: "#e8c46a", copper: "#d69566", plasma: "#9d7ae0" };

const GRADIENT_STOPS: Record<Item["metal"], [string, string, string]> = {
  silver: ["#f4f6fa", "#9aa3b2", "#3b4250"],
  gold: ["#fff3c2", "#d4ad4a", "#5a3d0a"],
  copper: ["#f8d8b6", "#c08050", "#4a2510"],
  plasma: ["#c9f0ff", "#7a4dd0", "#1a0a3a"],
};

function ContentLayer({ item, pos }: { item: Item; pos: { left: string; top: string } }) {
  const Icon = item.icon;
  return (
    <span
      className="absolute flex flex-col items-center text-center pointer-events-none"
      style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)", width: "15cqw" }}
    >
      <span
        className="absolute font-mono text-white/40 tracking-widest whitespace-nowrap"
        style={{ top: "-2.6cqw", fontSize: "1.15cqw" }}
      >
        {item.hint}
      </span>
      {/* MESMO círculo do ícone do original: anel + fundo preto + pulso */}
      <span
        className={`relative rounded-full bg-gradient-to-br ${item.ring}`}
        style={{ width: "5.4cqw", height: "5.4cqw", padding: "0.42cqw", marginBottom: "0.3cqw" }}
      >
        <span className="w-full h-full rounded-full bg-black/85 flex items-center justify-center">
          <Icon style={{ width: "2.5cqw", height: "2.5cqw" }} className={item.accent} />
        </span>
        <span
          className="absolute rounded-full animate-pulse"
          style={{
            top: "-0.2cqw",
            right: "-0.2cqw",
            width: "1.2cqw",
            height: "1.2cqw",
            backgroundColor: item.glow,
            boxShadow: `0 0 1.2cqw ${item.glow}`,
          }}
        />
      </span>
      <span
        className="font-display text-foreground leading-tight whitespace-nowrap"
        style={{ fontSize: "1.85cqw" }}
      >
        {item.label}
      </span>
      <span className="text-white/55 leading-tight whitespace-nowrap" style={{ fontSize: "1.25cqw" }}>
        {item.sub}
      </span>
    </span>
  );
}

export function HexHubMenu() {
  return (
    <div
      className="relative mx-auto w-full"
      style={{ aspectRatio: "592.1 / 472.8", containerType: "inline-size" }}
    >
      <style>{`@keyframes hexHubSpin { to { transform: rotate(360deg); } }`}</style>

      {/* Camada 1: os 6 trapézios (peças independentes, com folga entre elas,
          cantos arredondados de verdade via path, contorno uniforme via SVG stroke) */}
      <svg
        viewBox="0 0 592.1 472.8"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: "visible", transform: `scale(${SCALE})`, transformOrigin: "center" }}
      >
        <defs>
          {(Object.keys(GRADIENT_STOPS) as Item["metal"][]).map((m) => (
            <linearGradient key={m} id={`grad-${m}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={GRADIENT_STOPS[m][0]} />
              <stop offset="50%" stopColor={GRADIENT_STOPS[m][1]} />
              <stop offset="100%" stopColor={GRADIENT_STOPS[m][2]} />
            </linearGradient>
          ))}
          {(Object.keys(GRADIENT_STOPS) as Item["metal"][]).map((m) => (
            <linearGradient key={`fill-${m}`} id={`fill-${m}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GRADIENT_STOPS[m][2]} />
              <stop offset="100%" stopColor="#0a0a14" />
            </linearGradient>
          ))}
          <filter id="hexShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>
        {OUTER.map((item, i) => (
          <path
            key={item.to}
            d={TRAP_PATHS[i]}
            fill={`url(#fill-${item.metal})`}
            stroke={`url(#grad-${item.metal})`}
            strokeWidth="3"
            strokeLinejoin="round"
            filter="url(#hexShadow)"
          />
        ))}
      </svg>

      {OUTER.map((item, i) => (
        <ContentLayer key={`${item.to}-c`} item={item} pos={CONTENT_POS[i]} />
      ))}
      {OUTER.map((item, i) => (
        <Link
          key={`${item.to}-l`}
          to={item.to}
          className="absolute inset-0 active:opacity-70"
          style={{ clipPath: TRAP_CLICK_CLIPS_SCALED[i] }}
        />
      ))}

      {/* Hexágono central — MESMA técnica: forma clipada separada do texto (sem clip-path) */}
      <div
        className="absolute"
        style={{
          left: "32.29%",
          top: "33.08%",
          width: "35.42%",
          height: "33.84%",
          transform: `scale(${SCALE})`,
          transformOrigin: "center",
          overflow: "visible",
        }}
      >
        {/* Camada 1: forma (clipada) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
        >
          <div
            className="absolute"
            style={{
              inset: "-45%",
              background: "conic-gradient(from 0deg, #22d3ee, #a855f7, #f0abfc, #22d3ee)",
              animation: "hexHubSpin 3s linear infinite",
            }}
          />
        </div>
        <div
          className="absolute rounded-xl"
          style={{
            inset: "0.8cqw",
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: "rgba(0,0,0,0.9)",
            boxShadow: "0 0 18px rgba(168,85,247,0.55)",
          }}
        />
        {/* Camada 2: texto (SEM clip-path — não corta mais palavra) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span
            className="absolute font-mono font-bold bg-black/70 rounded-sm tracking-widest"
            style={{ top: "22%", right: "10%", fontSize: "1cqw", padding: "0.12cqw 0.35cqw", color: "#d4dae3" }}
          >
            NOVO
          </span>
          <Gamepad2 style={{ width: "4cqw", height: "4cqw", marginBottom: "0.25cqw", color: "#e6eaf0" }} />
          <div
            className="font-display leading-none"
            style={{
              fontSize: "2.8cqw",
              background: "linear-gradient(135deg, #f4f6fa, #9aa3b2, #f4f6fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            A&amp;A HUB
          </div>
          <div className="font-mono leading-tight" style={{ fontSize: "1.8cqw", marginTop: "0.2cqw", color: "#a8b0bd" }}>Across Ages</div>
        </div>
        {/* Camada 3: clique */}
        <Link
          to="/across-age"
          className="absolute inset-0"
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
        />
      </div>
    </div>
  );
}
