// =========================================================
// FUNDO PROCEDURAL DO ACROSS AGE — src/lib/space-backdrop.ts
//
// Por que existe: as 45 fases da rota precisam de plano de fundo
// pronto, mas nem todo destino tem foto oficial disponível (e
// hotlink de NASA/ESO pode cair a qualquer momento). Este módulo
// PINTA um cenário de verdade pra cada bioma usando só a paleta
// que já existe em space-biomes.ts — galáxia com braços espirais,
// nebulosa com nuvens e poeira, aglomerado denso, sistema estelar,
// superfície de exoplaneta, quasar com jato e órbita planetária.
//
// Performance: o cenário é desenhado UMA vez num canvas fora da
// tela e depois só é copiado a cada quadro (com parallax da
// câmera). Custo por frame = 1 drawImage. Roda liso em celular.
// =========================================================

import type { BiomeTheme, DestinationKind } from "./space-biomes";

export type BackdropStyle =
  | "galaxy"
  | "nebula"
  | "cluster"
  | "starfield"
  | "exo"
  | "quasar"
  | "orbit";

const STYLE_BY_KIND: Record<DestinationKind, BackdropStyle> = {
  planet: "orbit",
  moon: "orbit",
  "dwarf-planet": "orbit",
  star: "starfield",
  exoplanet: "exo",
  galaxy: "galaxy",
  nebula: "nebula",
  cluster: "cluster",
  quasar: "quasar",
};

export function getBackdropStyle(theme: BiomeTheme): BackdropStyle {
  const override = (theme as BiomeTheme & { bgProc?: BackdropStyle }).bgProc;
  return override ?? STYLE_BY_KIND[theme.kind] ?? "starfield";
}

// ---------- utilitários ----------

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** gerador pseudo-aleatório com semente — o mesmo destino sempre
 *  gera exatamente o mesmo cenário, então a fase não "pisca" nem
 *  muda de cara quando o jogador vira o celular. */
function makeRng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function rgba(hex: string, a: number): string {
  const raw = hex.replace("#", "").trim();
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

type C2D = CanvasRenderingContext2D;

function scatterStars(c: C2D, w: number, h: number, rand: () => number, color: string, count: number, maxR = 1.4) {
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = rand() * maxR + 0.25;
    c.globalAlpha = 0.22 + rand() * 0.62;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}

function blob(c: C2D, x: number, y: number, r: number, color: string, a: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(0.45, rgba(color, a * 0.35));
  g.addColorStop(1, rgba(color, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
}

// ---------- pintores, um por tipo de destino ----------

function paintGalaxy(c: C2D, w: number, h: number, rand: () => number, t: BiomeTheme) {
  scatterStars(c, w, h, rand, t.starColor, 420);

  const cx = w * (0.58 + rand() * 0.18);
  const cy = h * (0.28 + rand() * 0.18);
  const R = Math.min(w, h) * 0.62;
  const tilt = rand() * Math.PI;
  const arms = 2 + Math.floor(rand() * 3);

  blob(c, cx, cy, R * 1.15, t.glowColor, 0.16);

  for (let a = 0; a < arms; a++) {
    const off = (a / arms) * Math.PI * 2;
    for (let i = 0; i < 520; i++) {
      const f = i / 520;
      const ang = off + f * 3.1 + (rand() - 0.5) * 0.22;
      const rad = R * (0.08 + f * 0.92) * (0.93 + rand() * 0.14);
      const lx = Math.cos(ang) * rad;
      const ly = Math.sin(ang) * rad * 0.45; // achata o disco = galáxia inclinada
      const x = cx + lx * Math.cos(tilt) - ly * Math.sin(tilt);
      const y = cy + lx * Math.sin(tilt) + ly * Math.cos(tilt);
      c.globalAlpha = (1 - f) * 0.65 + 0.12;
      c.fillStyle = rand() > 0.82 ? t.glowColor : t.starColor;
      c.beginPath();
      c.arc(x, y, rand() * 1.5 + 0.3, 0, Math.PI * 2);
      c.fill();
    }
  }

  c.globalAlpha = 1;
  blob(c, cx, cy, R * 0.55, t.glowColor, 0.32);
  blob(c, cx, cy, R * 0.24, "#ffffff", 0.55);
}

function paintNebula(c: C2D, w: number, h: number, rand: () => number, t: BiomeTheme) {
  scatterStars(c, w, h, rand, t.starColor, 300);

  const palette = [t.glowColor, t.glowColor, t.starColor, t.skyBottom];
  for (let i = 0; i < 9; i++) {
    blob(
      c,
      rand() * w,
      rand() * h,
      Math.min(w, h) * (0.22 + rand() * 0.36),
      palette[Math.floor(rand() * palette.length)],
      0.10 + rand() * 0.16
    );
  }
  // veios de poeira escura — é o que dá "profundidade" de nebulosa
  for (let i = 0; i < 5; i++) {
    blob(c, rand() * w, rand() * h, Math.min(w, h) * (0.14 + rand() * 0.2), "#050714", 0.3 + rand() * 0.25);
  }
  scatterStars(c, w, h, rand, "#ffffff", 180, 1.1);
}

function paintCluster(c: C2D, w: number, h: number, rand: () => number, t: BiomeTheme) {
  scatterStars(c, w, h, rand, t.starColor, 260);

  const cx = w * (0.38 + rand() * 0.26);
  const cy = h * (0.32 + rand() * 0.26);
  const R = Math.min(w, h) * 0.5;
  blob(c, cx, cy, R, t.glowColor, 0.16);

  for (let i = 0; i < 900; i++) {
    const u = rand() || 1e-6;
    const v = rand();
    const mag = Math.sqrt(-2 * Math.log(u));
    const x = cx + Math.cos(2 * Math.PI * v) * mag * R * 0.28;
    const y = cy + Math.sin(2 * Math.PI * v) * mag * R * 0.28;
    if (x < 0 || x > w || y < 0 || y > h) continue;
    c.globalAlpha = 0.32 + rand() * 0.62;
    c.fillStyle = rand() > 0.85 ? t.glowColor : "#ffffff";
    c.beginPath();
    c.arc(x, y, rand() * 1.6 + 0.3, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;

  for (let i = 0; i < 8; i++) {
    blob(c, cx + (rand() - 0.5) * R * 0.9, cy + (rand() - 0.5) * R * 0.9, 10 + rand() * 16, t.glowColor, 0.5);
  }
}

function paintStarfield(c: C2D, w: number, h: number, rand: () => number, t: BiomeTheme) {
  scatterStars(c, w, h, rand, t.starColor, 520);

  const cx = w * (0.12 + rand() * 0.16);
  const cy = h * (0.16 + rand() * 0.16);
  blob(c, cx, cy, Math.min(w, h) * 0.58, t.glowColor, 0.22);

  c.save();
  c.translate(cx, cy);
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2;
    const len = Math.min(w, h) * (0.25 + rand() * 0.5);
    c.globalAlpha = 0.05 + rand() * 0.07;
    c.strokeStyle = t.glowColor;
    c.lineWidth = 2 + rand() * 10;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    c.stroke();
  }
  c.restore();
  c.globalAlpha = 1;

  blob(c, cx, cy, Math.min(w, h) * 0.16, "#ffffff", 0.6);
}

function paintExo(c: C2D, w: number, h: number, rand: () => number, t: BiomeTheme) {
  scatterStars(c, w, h, rand, t.starColor, 360);

  const sx = w * (0.2 + rand() * 0.6);
  const sy = h * 0.22;
  blob(c, sx, sy, Math.min(w, h) * 0.3, t.glowColor, 0.35);
  blob(c, sx, sy, Math.min(w, h) * 0.07, "#ffffff", 0.85);

  const atm = c.createLinearGradient(0, h * 0.45, 0, h);
  atm.addColorStop(0, rgba(t.glowColor, 0));
  atm.addColorStop(1, rgba(t.glowColor, 0.2));
  c.fillStyle = atm;
  c.fillRect(0, h * 0.45, w, h * 0.55);

  // três cristas de montanha em profundidades diferentes
  for (let layer = 0; layer < 3; layer++) {
    const baseY = h * (0.72 + layer * 0.09);
    const amp = h * (0.05 - layer * 0.012);
    const sA = rand() * 10;
    const sB = rand() * 10;
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, baseY);
    for (let x = 0; x <= w; x += 14) {
      c.lineTo(x, baseY + Math.sin(x * 0.006 + sA) * amp + Math.sin(x * 0.021 + sB) * amp * 0.45);
    }
    c.lineTo(w, h);
    c.closePath();
    c.fillStyle = rgba(t.horizonColor, 0.55 + layer * 0.18);
    c.fill();
  }
}

function paintQuasar(c: C2D, w: number, h: number, rand: () => number, t: BiomeTheme) {
  scatterStars(c, w, h, rand, t.starColor, 400);

  const cx = w * 0.55;
  const cy = h * 0.5;
  const reach = Math.max(w, h);

  c.save();
  c.translate(cx, cy);
  c.rotate(-0.5 + rand());
  const jet = c.createLinearGradient(0, 0, 0, -reach);
  jet.addColorStop(0, rgba(t.glowColor, 0.55));
  jet.addColorStop(1, rgba(t.glowColor, 0));
  for (let side = 0; side < 2; side++) {
    c.fillStyle = jet;
    c.beginPath();
    c.moveTo(-6, 0);
    c.lineTo(6, 0);
    c.lineTo(60, -reach);
    c.lineTo(-60, -reach);
    c.closePath();
    c.fill();
    c.scale(1, -1); // espelha e desenha o jato do outro lado
  }
  c.restore();

  c.save();
  c.translate(cx, cy);
  c.scale(1, 0.28);
  blob(c, 0, 0, Math.min(w, h) * 0.42, t.glowColor, 0.55);
  blob(c, 0, 0, Math.min(w, h) * 0.22, "#ffffff", 0.7);
  c.restore();

  c.fillStyle = "#04030a";
  c.beginPath();
  c.arc(cx, cy, Math.min(w, h) * 0.085, 0, Math.PI * 2);
  c.fill();
}

function paintOrbit(c: C2D, w: number, h: number, rand: () => number, t: BiomeTheme) {
  scatterStars(c, w, h, rand, t.starColor, 480);

  const R = Math.max(w, h) * 0.9;
  const cx = -R * 0.35;
  const cy = h + R * 0.55;
  const g = c.createRadialGradient(cx - R * 0.2, cy - R * 0.35, R * 0.05, cx, cy, R);
  g.addColorStop(0, rgba(t.glowColor, 0.55));
  g.addColorStop(0.6, rgba(t.horizonColor, 0.9));
  g.addColorStop(1, rgba(t.skyTop, 1));
  c.fillStyle = g;
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.fill();

  c.strokeStyle = rgba(t.glowColor, 0.35);
  c.lineWidth = 6;
  c.beginPath();
  c.arc(cx, cy, R, 0, Math.PI * 2);
  c.stroke();

  const mx = w * (0.6 + rand() * 0.28);
  const my = h * (0.14 + rand() * 0.26);
  const mr = Math.min(w, h) * 0.05;
  blob(c, mx, my, mr * 3, t.glowColor, 0.25);
  c.fillStyle = rgba(t.starColor, 0.9);
  c.beginPath();
  c.arc(mx, my, mr, 0, Math.PI * 2);
  c.fill();
}

// ---------- montagem + cache ----------

function paintBackdrop(c: C2D, w: number, h: number, theme: BiomeTheme) {
  const rand = makeRng(hashStr(theme.id));

  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(1, theme.skyBottom);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);

  switch (getBackdropStyle(theme)) {
    case "galaxy": paintGalaxy(c, w, h, rand, theme); break;
    case "nebula": paintNebula(c, w, h, rand, theme); break;
    case "cluster": paintCluster(c, w, h, rand, theme); break;
    case "starfield": paintStarfield(c, w, h, rand, theme); break;
    case "exo": paintExo(c, w, h, rand, theme); break;
    case "quasar": paintQuasar(c, w, h, rand, theme); break;
    default: paintOrbit(c, w, h, rand, theme); break;
  }

  // vinheta — segura o olho no centro e mantém a HUD legível
  const vig = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(4,5,16,0.55)");
  c.fillStyle = vig;
  c.fillRect(0, 0, w, h);
}

const cache = new Map<string, HTMLCanvasElement>();

/**
 * Devolve o cenário já pintado do destino, no tamanho da tela.
 * É 25% maior que a tela de propósito: a sobra é o que permite o
 * parallax deslizar sem mostrar borda vazia.
 */
export function getBackdrop(theme: BiomeTheme, W: number, H: number): HTMLCanvasElement | null {
  if (typeof document === "undefined" || W <= 0 || H <= 0) return null;

  const bw = Math.round(W * 1.25);
  const bh = Math.round(H * 1.25);
  const key = `${theme.id}|${bw}x${bh}`;

  const hit = cache.get(key);
  if (hit) return hit;

  const cv = document.createElement("canvas");
  cv.width = bw;
  cv.height = bh;
  const c = cv.getContext("2d");
  if (!c) return null;

  paintBackdrop(c, bw, bh, theme);

  if (cache.size > 8) cache.clear(); // troca de fase/rotação não acumula memória
  cache.set(key, cv);
  return cv;
}
