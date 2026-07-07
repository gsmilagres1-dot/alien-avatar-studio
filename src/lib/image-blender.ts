/**
 * Image Blender — Versão SIMPLES para Celular
 * Processa a selfie APENAS NO CLIENTE (navegador)
 * Sem depender de bibliotecas externas
 */

import { RACES, type RaceId } from './alien';

export interface BlendConfig {
  selfieDataUrl: string;
  raceId: RaceId;
  gender: 'male' | 'female' | 'undefined';
  variant: number;
}

/**
 * Cores específicas de cada raça alienígena
 */
const RACE_COLORS: Record<RaceId, { r: number; g: number; b: number }> = {
  starseed: { r: 200, g: 180, b: 220 },
  nordico: { r: 100, g: 150, b: 220 },
  grey: { r: 120, g: 120, b: 140 },
  reptiliano: { r: 100, g: 160, b: 80 },
  draconiano: { r: 200, g: 50, b: 100 },
  insectoide: { r: 80, g: 180, b: 100 },
  aviario: { r: 180, g: 150, b: 100 },
  anunnaki: { r: 200, g: 160, b: 80 },
  siriano: { r: 150, g: 200, b: 220 },
  pleiadiano: { r: 200, g: 200, b: 150 },
  lyriano: { r: 200, g: 140, b: 60 },
  kashyapa: { r: 100, g: 180, b: 180 },
};

/**
 * Processa avatar NO NAVEGADOR (celular/PC)
 * Retorna imagem como data URL
 */
export async function blendSelfieWithRace(config: BlendConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 1. Cria elemento de imagem
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // 2. Cria canvas 512x512
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Não consegui acessar o Canvas (erro interno do navegador)');
          }

          // 3. Desenha selfie redimensionada
          ctx.drawImage(img, 0, 0, 512, 512);

          // 4. Pega dados de pixels
          const imageData = ctx.getImageData(0, 0, 512, 512);
          const data = imageData.data;

          // 5. Obtém cores da raça
          const color = RACE_COLORS[config.raceId];
          const intensity = 0.15 + (config.variant * 0.05); // Aumenta com variante

          // 6. Aplica tonalização (mistura cores)
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + (color.r * intensity));       // R
            data[i + 1] = Math.min(255, data[i + 1] + (color.g * intensity)); // G
            data[i + 2] = Math.min(255, data[i + 2] + (color.b * intensity)); // B
            // data[i + 3] = opaco (sem mudar)
          }

          // 7. Aplica saturação (cores mais vibrantes)
          if (config.variant >= 1) {
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Calcula luminância
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;

              // Aumenta saturação
              const sat = 1.3; // 30% mais saturado
              data[i] = Math.min(255, lum + (r - lum) * sat);
              data[i + 1] = Math.min(255, lum + (g - lum) * sat);
              data[i + 2] = Math.min(255, lum + (b - lum) * sat);
            }
          }

          // 8. Coloca pixels modificados de volta no canvas
          ctx.putImageData(imageData, 0, 0);

          // 9. Exporta como PNG
          const processedDataUrl = canvas.toDataURL('image/png', 0.95);

          console.log('✅ Avatar processado com sucesso!');
          resolve(processedDataUrl);
        } catch (err) {
          console.error('❌ Erro ao processar pixels:', err);
          reject(new Error(`Falha ao processar imagem: ${(err as Error).message}`));
        }
      };

      img.onerror = () => {
        console.error('❌ Erro ao carregar imagem');
        reject(new Error('Não consegui carregar sua selfie'));
      };

      // 10. Carrega a selfie
      console.log('🔄 Carregando selfie...');
      img.src = config.selfieDataUrl;
    } catch (err) {
      console.error('❌ Erro geral:', err);
      reject(new Error(`Erro ao processar avatar: ${(err as Error).message}`));
    }
  });
}
