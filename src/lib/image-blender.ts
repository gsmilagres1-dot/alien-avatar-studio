/**
 * Image Blender — Versão SEM Sharp
 * Mistura selfie com características alienígenas usando apenas Node.js nativo
 * Funciona melhor em ambientes serverless (Vercel, GitHub, etc)
 */

import { RACES, type RaceId } from './alien';

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
 * Gera SVG de processamento que será renderizado no cliente
 * Retorna uma imagem que mistura selfie + efeitos da raça
 */
function generateRaceOverlaySVG(
  raceId: RaceId,
  width: number = 512,
  height: number = 512
): string {
  const race = RACES.find(r => r.id === raceId) || RACES[0];

  const raceEffects: Record<RaceId, { color: string; opacity: string; glow: string }> = {
    starseed: { color: '#c8b4dc', opacity: '0.25', glow: 'rgba(150, 100, 255, 0.3)' },
    nordico: { color: '#6496dc', opacity: '0.2', glow: 'rgba(100, 200, 255, 0.4)' },
    grey: { color: '#78788c', opacity: '0.15', glow: 'rgba(100, 100, 120, 0.2)' },
    reptiliano: { color: '#64a050', opacity: '0.2', glow: 'rgba(100, 180, 50, 0.3)' },
    draconiano: { color: '#c83264', opacity: '0.25', glow: 'rgba(255, 50, 100, 0.4)' },
    insectoide: { color: '#50b464', opacity: '0.2', glow: 'rgba(0, 255, 100, 0.3)' },
    aviario: { color: '#b49664', opacity: '0.2', glow: 'rgba(255, 200, 0, 0.3)' },
    anunnaki: { color: '#c8a050', opacity: '0.2', glow: 'rgba(255, 200, 100, 0.3)' },
    siriano: { color: '#96c8dc', opacity: '0.2', glow: 'rgba(100, 200, 255, 0.3)' },
    pleiadiano: { color: '#c8c896', opacity: '0.25', glow: 'rgba(255, 255, 200, 0.3)' },
    lyriano: { color: '#c88c3c', opacity: '0.2', glow: 'rgba(255, 180, 0, 0.3)' },
    kashyapa: { color: '#64b4b4', opacity: '0.2', glow: 'rgba(0, 255, 200, 0.3)' },
  };

  const effect = raceEffects[raceId];
  const centerX = width / 2;
  const centerY = height / 2;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="raceOverlay_${raceId}" cx="50%" cy="40%">
          <stop offset="0%" style="stop-color:${effect.color};stop-opacity:${effect.opacity}" />
          <stop offset="70%" style="stop-color:${effect.color};stop-opacity:${parseFloat(effect.opacity) * 0.5}" />
          <stop offset="100%" style="stop-color:${effect.color};stop-opacity:0" />
        </radialGradient>
        <filter id="glow_${raceId}">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Overlay radial do rosto -->
      <ellipse cx="${centerX}" cy="${centerY}" rx="${width * 0.35}" ry="${height * 0.4}" 
               fill="url(#raceOverlay_${raceId})"/>
      
      <!-- Efeito de brilho -->
      <circle cx="${centerX}" cy="${centerY * 0.7}" r="${width * 0.25}" 
              fill="none" stroke="${effect.glow}" stroke-width="2" opacity="0.4" filter="url(#glow_${raceId})"/>
    </svg>
  `;
}

/**
 * Cria imagem blended processando no cliente
 * Retorna data URL que pode ser enviado para o servidor
 */
export async function blendSelfieWithRace(config: BlendConfig): Promise<string> {
  try {
    // 1. Se estiver no Node.js (servidor), simula blending retornando a selfie com metadados
    if (typeof window === 'undefined') {
      // Servidor: apenas valida e retorna a selfie original com marca de processamento
      console.log(`[SERVER] Avatar blend solicitado: raça=${config.raceId}, variante=${config.variant}`);
      
      // Retorna a selfie como está (o processamento visual acontece no cliente depois)
      return config.selfieDataUrl;
    }

    // 2. Cliente: usa Canvas API para blending real
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) throw new Error('Cannot get canvas context');

          // Draw selfie redimensionada
          ctx.drawImage(img, 0, 0, 512, 512);

          // Aplica efeito de filtro via canvas
          const imageData = ctx.getImageData(0, 0, 512, 512);
          const data = imageData.data;

          // Obtém cores da raça
          const raceColors: Record<RaceId, [number, number, number]> = {
            starseed: [200, 180, 220],
            nordico: [100, 150, 220],
            grey: [120, 120, 140],
            reptiliano: [100, 160, 80],
            draconiano: [200, 50, 100],
            insectoide: [80, 180, 100],
            aviario: [180, 150, 100],
            anunnaki: [200, 160, 80],
            siriano: [150, 200, 220],
            pleiadiano: [200, 200, 150],
            lyriano: [200, 140, 60],
            kashyapa: [100, 180, 180],
          };

          const [r, g, b] = raceColors[config.raceId];
          const intensity = 0.15 + (config.variant * 0.05);

          // Aplica tonalização da raça
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + (r * intensity));     // R
            data[i + 1] = Math.min(255, data[i + 1] + (g * intensity)); // G
            data[i + 2] = Math.min(255, data[i + 2] + (b * intensity)); // B
            // data[i + 3] permanece opaco
          }

          ctx.putImageData(imageData, 0, 0);

          // Aumenta saturação
          const saturation = 1.2 + (config.variant * 0.1);
          ctx.filter = `saturate(${saturation})`;
          ctx.drawImage(canvas, 0, 0);

          // Retorna como data URL
          const blendedDataUrl = canvas.toDataURL('image/png');
          resolve(blendedDataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = config.selfieDataUrl;
    });
  } catch (err) {
    throw new Error(`Falha ao processar avatar: ${(err as Error).message}`);
  }
}

/**
 * Versão alternativa: retorna SVG para sobreposição visual
 * Use isso para aplicar efeitos adicionais no servidor
 */
export function getReaceOverlaySVGAsDataUrl(
  raceId: RaceId,
  width: number = 512,
  height: number = 512
): string {
  const svg = generateRaceOverlaySVG(raceId, width, height);
  const encoded = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Gera imagem blended no servidor usando canvas nativo
 * (Requer node-canvas ou similar em alguns ambientes)
 */
export async function blendServerSide(config: BlendConfig): Promise<Buffer> {
  try {
    // Tenta importar canvas se disponível
    const { createCanvas, loadImage } = await import('canvas').catch(() => null);
    
    if (!createCanvas) {
      console.warn('Canvas não disponível no servidor. Retornando selfie original.');
      const match = config.selfieDataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) throw new Error('Invalid data URL');
      return Buffer.from(match[2], 'base64');
    }

    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');
    const img = await loadImage(config.selfieDataUrl);

    ctx.drawImage(img, 0, 0, 512, 512);
    
    return canvas.toBuffer('image/png');
  } catch (err) {
    console.error('Erro no blending server-side:', err);
    // Fallback: retorna selfie original
    const match = config.selfieDataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid data URL');
    return Buffer.from(match[2], 'base64');
  }
}
