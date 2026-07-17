import { Link } from "@tanstack/react-router";
import { Users, Coins, Map, Rocket, Wrench, Swords, Gamepad2 } from "lucide-react";

/**
 * HexHubMenu
 * ---------------------------------------------------------------
 * Hexágono achatado dividido em 6 trapézios + hexágono central.
 *
 * IMPORTANTE: o visual (formas, cores, bordas) é desenhado em SVG,
 * não em CSS clip-path com border — border não funciona direito em
 * cima de clip-path com cortes diagonais internos (some nas bordas
 * que não coincidem com a caixa retangular original). O SVG não
 * tem essa limitação.
 *
 * Os <Link> ficam por cima, invisíveis (sem fundo/borda própria),
 * só cuidando da área clicável de cada fatia — o clip-path neles
 * é só pra hit-area, não pra aparência.
 * ---------------------------------------------------------------
 */

type Item = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accent: string;
};

const OUTER: Item[] = [
  { to: "/equipes", icon: Users, label: "Equipe", accent: "#e8b34a" },
  { to: "/loja", icon: Coins, label: "Fichas", accent: "#8a5cf6" },
  { to: "/mapa", icon: Map, label: "Mapa", accent: "#8a5cf6" },
  { to: "/galeria", icon: Rocket, label: "Galeria", accent: "#3ddbc9" },
  { to: "/upgrades", icon: Wrench, label: "Upgrades", accent: "#e8734a" },
  { to: "/batalha", icon: Swords, label: "Batalha", accent: "#e8b34a" },
];

const CENTER: Item = {
  to: "/across-age",
  icon: Gamepad2,
  label: "A&A HUB",
  accent: "#3ddbc9",
};

// pontos calculados (Ro=200, Ri=90, achatado sx=1.28 sy=0.86), viewBox 503.4 x 404
const TRAP_POINTS = [
  "251.7,30.0 473.4,116.0 351.5,163.3 251.7,124.6",
  "473.4,116.0 473.4,288.0 351.5,240.7 351.5,163.3",
  "473.4,288.0 251.7,374.0 251.7,279.4 351.5,240.7",
  "251.7,374.0 30.0,288.0 151.9,240.7 251.7,279.4",
  "30.0,288.0 30.0,116.0 151.9,163.3 151.9,240.7",
  "30.0,116.0 251.7,30.0 251.7,124.6 151.9,163.3",
];
const CENTER_POINTS = "251.7,124.6 351.5,163.3 351.5,240.7 251.7,279.4 151.9,240.7 151.9,163.3";

// mesmos pontos, em % (pra clip-path dos Links clicáveis)
const TRAP_CLIPS = [
  "polygon(50.00% 7.43%, 94.04% 28.71%, 69.82% 40.42%, 50.00% 30.84%)",
  "polygon(94.04% 28.71%, 94.04% 71.29%, 69.82% 59.58%, 69.82% 40.42%)",
  "polygon(94.04% 71.29%, 50.00% 92.57%, 50.00% 69.16%, 69.82% 59.58%)",
  "polygon(50.00% 92.57%, 5.96% 71.29%, 30.18% 59.58%, 50.00% 69.16%)",
  "polygon(5.96% 71.29%, 5.96% 28.71%, 30.18% 40.42%, 30.18% 59.58%)",
  "polygon(5.96% 28.71%, 50.00% 7.43%, 50.00% 30.84%, 30.18% 40.42%)",
];
const CENTER_CLIP =
  "polygon(50.00% 30.84%, 69.82% 40.42%, 69.82% 59.58%, 50.00% 69.16%, 30.18% 59.58%, 30.18% 40.42%)";

const LABEL_POS = [
  { left: "65.96%", top: "26.85%" },
  { left: "81.93%", top: "50.00%" },
  { left: "65.96%", top: "73.15%" },
  { left: "34.04%", top: "73.15%" },
  { left: "18.07%", top: "50.00%" },
  { left: "34.04%", top: "26.85%" },
];

export function HexHubMenu() {
  return (
    <div className="relative mx-auto w-full max-w-md" style={{ aspectRatio: "503.4 / 404" }}>
      {/* Camada visual — SVG, borda certa em qualquer ângulo */}
      <svg viewBox="0 0 503.4 404" className="absolute inset-0 w-full h-full pointer-events-none">
        {OUTER.map((item, i) => (
          <polygon
            key={item.to}
            points={TRAP_POINTS[i]}
            fill="#12163a"
            stroke={item.accent}
            strokeWidth="2"
          />
        ))}
        <polygon points={CENTER_POINTS} fill="#0d1030" stroke={CENTER.accent} strokeWidth="2.5" />
      </svg>

      {/* Camada de conteúdo (ícone + texto) + área clicável de cada fatia */}
      {OUTER.map((item, i) => {
        const Icon = item.icon;
        const pos = LABEL_POS[i];
        return (
          <Link
            key={item.to}
            to={item.to}
            className="absolute inset-0 active:opacity-70 transition-opacity"
            style={{ clipPath: TRAP_CLIPS[i] }}
          >
            <span
              className="absolute flex flex-col items-center text-center"
              style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)" }}
            >
              <Icon className="w-5 h-5 mb-0.5" style={{ color: item.accent }} />
              <span className="text-[11px] font-bold" style={{ color: item.accent }}>
                {item.label}
              </span>
            </span>
          </Link>
        );
      })}

      <Link
        to={CENTER.to}
        className="absolute inset-0 active:opacity-70 transition-opacity z-10"
        style={{ clipPath: CENTER_CLIP }}
      >
        <span
          className="absolute flex flex-col items-center text-center"
          style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
        >
          <Gamepad2 className="w-6 h-6 mb-0.5" style={{ color: CENTER.accent }} />
          <span className="text-[12px] font-bold" style={{ color: CENTER.accent }}>
            {CENTER.label}
          </span>
          <span className="text-[8px] text-muted-foreground">Across Ages</span>
        </span>
      </Link>
    </div>
  );
  }
