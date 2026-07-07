/**
 * Image Blender — Mistura selfie com imagens de raças alienígenas
 * Sem dependência de IA externa (Gemini). Usa processamento local.
 */

import sharp from 'sharp';
import { RACE_VISUAL, RACES, type RaceId } from './alien';

export interface BlendConfig {
  selfieDataUrl: string;
  raceId: RaceId;
  gender: 'male' | 'female' | 'undefined';
  variant: number;
}

/**
 * Converte data URL para buffer
 */
function dataUrlToBuffer(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  return Buffer.from(match[2], 'base64');
}

/**
 * Aplica filtro/tonalidade da raça à selfie
 * Estratégia: ajustar saturação, temperatura de cor, contraste com base na raça
 */
async function applyRaceFilter(
  selfieBuffer: Buffer,
  raceId: RaceId
): Promise<Buffer> {
  const raceFilters: Record<RaceId, { saturation: number; brightness: number; tint: [number, number, number] }> = {
    starseed: { saturation: 1.3, brightness: 1.15, tint: [200, 180, 220] }, // Violeta/ouro
    nordico: { saturation: 1.2, brightness: 1.2, tint: [100, 150, 220] }, // Azul elétrico
    grey: { saturation: 0.6, brightness: 1.0, tint: [120, 120, 140] }, // Cinza frio
    reptiliano: { saturation: 1.4, brightness: 1.05, tint: [100, 160, 80] }, // Verde/bronze
    draconiano: { saturation: 1.5, brightness: 0.95, tint: [200, 50, 100] }, // Carmim/obsidiana
    insectoide: { saturation: 1.3, brightness: 1.1, tint: [80, 180, 100] }, // Verde brilhante
    aviario: { saturation: 1.25, brightness: 1.15, tint: [180, 150, 100] }, // Dourado
    anunnaki: { saturation: 1.2, brightness: 1.1, tint: [200, 160, 80] }, // Bronze/ouro
    siriano: { saturation: 1.25, brightness: 1.2, tint: [150, 200, 220] }, // Azul cristalino
    pleiadiano: { saturation: 1.3, brightness: 1.25, tint: [200, 200, 150] }, // Dourado/luz
    lyriano: { saturation: 1.3, brightness: 1.1, tint: [200, 140, 60] }, // Âmbar felino
    kashyapa: { saturation: 1.2, brightness: 1.1, tint: [100, 180, 180] }, // Turquesa/ciano
  };

  const filter = raceFilters[raceId];

  // Redimensiona para 512x512 (padrão)
  let image = sharp(selfieBuffer)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .modulate({
      saturation: filter.saturation,
      brightness: filter.brightness,
    });

  // Aplica tinta suave (overlay de cor)
  const [r, g, b] = filter.tint;
  const tintOverlay = Buffer.from(
    `<svg width="512" height="512">
      <rect width="512" height="512" fill="rgb(${r},${g},${b})" opacity="0.15"/>
    </svg>`
  );

  image = image.composite([
    {
      input: tintOverlay,
      blend: 'overlay',
    },
  ]);

  return image.png().toBuffer();
}

/**
 * Aplica variações visuais (marcas bioluminescentes, brilho, etc)
 */
async function applyVariantEffect(
  imageBuffer: Buffer,
  variant: number
): Promise<Buffer> {
  const effects = [
    // Variante 1: marcas bioluminescentes (linhas brilhantes)
    async (buf: Buffer) => {
      const svg = Buffer.from(
        `<svg width="512" height="512">
          <circle cx="256" cy="256" r="180" fill="none" stroke="rgba(100,200,255,0.2)" stroke-width="2" opacity="0.4"/>
          <path d="M 180 200 Q 256 150 320 200" stroke="rgba(100,200,255,0.3)" stroke-width="2" fill="none" opacity="0.5"/>
        </svg>`
      );
      return sharp(buf)
        .composite([{ input: svg, blend: 'screen' }])
        .png()
        .toBuffer();
    },
    // Variante 2: brilho cristalino
    async (buf: Buffer) => {
      return sharp(buf)
        .modulate({ saturation: 1.2 })
        .sharpen({ sigma: 1.5 })
        .png()
        .toBuffer();
    },
    // Variante 3: aura luminosa
    async (buf: Buffer) => {
      const svg = Buffer.from(
        `<svg width="512" height="512">
          <defs>
            <radialGradient id="aura" cx="50%" cy="40%">
              <stop offset="0%" style="stop-color:rgb(255,200,100);stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:rgb(255,100,200);stop-opacity:0" />
            </radialGradient>
          </defs>
          <circle cx="256" cy="256" r="280" fill="url(#aura)"/>
        </svg>`
      );
      return sharp(buf)
        .composite([{ input: svg, blend: 'screen' }])
        .png()
        .toBuffer();
    },
  ];

  const effect = effects[variant % effects.length];
  return effect(imageBuffer);
}

/**
 * Blenda a selfie com efeitos da raça alienígena
 */
export async function blendSelfieWithRace(config: BlendConfig): Promise<Buffer> {
  try {
    // 1. Converte selfie para buffer
    const selfieBuffer = dataUrlToBuffer(config.selfieDataUrl);

    // 2. Aplica filtro de raça (colorização, saturação)
    let blended = await applyRaceFilter(selfieBuffer, config.raceId);

    // 3. Aplica efeito de variante (bioluminescência, aura, etc)
    blended = await applyVariantEffect(blended, config.variant);

    // 4. Adiciona leve desfoque criativo + nitidez
    blended = await sharp(blended)
      .blur(0.5)
      .sharpen({ sigma: 1.0 })
      .png()
      .toBuffer();

    return blended;
  } catch (err) {
    throw new Error(`Falha ao processar avatar: ${(err as Error).message}`);
  }
}

/**
 * Gera SVG overlay com características visuais da raça
 * (olhos brilhantes, marcas, etc)
 */
export function generateRaceOverlaySVG(raceId: RaceId, gender: 'male' | 'female' | 'undefined'): string {
  const overlays: Record<RaceId, string> = {
    starseed: `
      <defs>
        <radialGradient id="glow">
          <stop offset="0%" style="stop-color:#7f00ff;stop-opacity:0.4"/>
          <stop offset="100%" style="stop-color:#00ffff;stop-opacity:0.1"/>
        </radialGradient>
      </defs>
      <circle cx="180" cy="170" r="25" fill="url(#glow)"/>
      <circle cx="330" cy="170" r="25" fill="url(#glow)"/>
    `,
    nordico: `
      <circle cx="180" cy="170" r="8" fill="rgb(100,150,255)" opacity="0.8"/>
      <circle cx="330" cy="170" r="8" fill="rgb(100,150,255)" opacity="0.8"/>
      <path d="M 256 350 Q 240 380 256 400 Q 272 380 256 350" fill="rgb(200,200,255)" opacity="0.3"/>
    `,
    grey: `
      <ellipse cx="180" cy="170" rx="20" ry="30" fill="rgb(0,0,0)" opacity="0.6"/>
      <ellipse cx="330" cy="170" rx="20" ry="30" fill="rgb(0,0,0)" opacity="0.6"/>
    `,
    reptiliano: `
      <polygon points="180,140 190,170 180,200 170,170" fill="rgb(200,100,0)" opacity="0.5"/>
      <polygon points="330,140 340,170 330,200 320,170" fill="rgb(200,100,0)" opacity="0.5"/>
    `,
    draconiano: `
      <circle cx="180" cy="170" r="15" fill="rgb(255,0,0)" opacity="0.7"/>
      <circle cx="330" cy="170" r="15" fill="rgb(255,0,0)" opacity="0.7"/>
    `,
    insectoide: `
      <circle cx="160" cy="150" r="12" fill="rgb(0,200,0)" opacity="0.6"/>
      <circle cx="200" cy="150" r="12" fill="rgb(0,200,0)" opacity="0.6"/>
      <circle cx="310" cy="150" r="12" fill="rgb(0,200,0)" opacity="0.6"/>
      <circle cx="350" cy="150" r="12" fill="rgb(0,200,0)" opacity="0.6"/>
    `,
    aviario: `
      <path d="M 150 100 L 180 150 L 170 180 Q 150 160 150 100" fill="rgb(200,150,100)" opacity="0.5"/>
      <path d="M 360 100 L 330 150 L 340 180 Q 360 160 360 100" fill="rgb(200,150,100)" opacity="0.5"/>
    `,
    anunnaki: `
      <path d="M 220 80 L 290 80 L 290 150 L 220 150" fill="rgb(200,160,0)" opacity="0.3"/>
    `,
    siriano: `
      <circle cx="180" cy="170" r="18" fill="rgb(150,200,255)" opacity="0.5"/>
      <circle cx="330" cy="170" r="18" fill="rgb(150,200,255)" opacity="0.5"/>
      <circle cx="256" cy="280" r="6" fill="rgb(0,255,200)" opacity="0.8"/>
    `,
    pleiadiano: `
      <circle cx="180" cy="170" r="20" fill="rgb(200,200,100)" opacity="0.4"/>
      <circle cx="330" cy="170" r="20" fill="rgb(200,200,100)" opacity="0.4"/>
    `,
    lyriano: `
      <polygon points="256,80 280,120 270,160 256,150 242,160 232,120" fill="rgb(200,150,0)" opacity="0.5"/>
    `,
    kashyapa: `
      <circle cx="180" cy="170" r="16" fill="rgb(100,200,200)" opacity="0.6"/>
      <circle cx="330" cy="170" r="16" fill="rgb(100,200,200)" opacity="0.6"/>
      <polygon points="256,100 270,120 270,140 256,150 242,140 242,120" fill="rgb(0,200,200)" opacity="0.5"/>
    `,
  };

  return `
    <svg width="512" height="512" viewBox="0 0 512 512">
      ${overlays[raceId] || ''}
    </svg>
  `;
}
