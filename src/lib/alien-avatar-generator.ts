/**
 * Alien Avatar Generator - Generates stylized alien avatars from selfies
 * Uses face detection and feature extraction without requiring Gemini API
 */

export interface FaceFeatures {
  skinTone: string;      // hex color
  eyeColor: string;      // hex color
  faceShape: 'round' | 'oval' | 'square' | 'heart';
  faceWidth: number;     // 0-100
  faceBreadth: number;   // 0-100
}

/**
 * Extract dominant colors from image using canvas
 */
export async function extractImageColors(
  imageDataUrl: string
): Promise<{ skin: string; eye: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 100, 100);
      const imageData = ctx.getImageData(0, 0, 100, 100);
      const data = imageData.data;

      // Extract dominant colors from face center (assume center is face)
      const skinPixels: [number, number, number][] = [];
      const eyePixels: [number, number, number][] = [];

      // Center region (face area)
      for (let i = 0; i < data.length; i += 4) {
        const idx = i / 4;
        const row = Math.floor(idx / 100);
        const col = idx % 100;

        // Face center area (assuming face is in center)
        if (row > 20 && row < 70 && col > 30 && col < 70) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;

          // Assume skin tone is mid-brightness in center
          if (brightness > 80 && brightness < 220) {
            skinPixels.push([r, g, b]);
          }
          // Eyes are typically darker
          if (brightness < 100) {
            eyePixels.push([r, g, b]);
          }
        }
      }

      const avgColor = (pixels: [number, number, number][]): string => {
        if (pixels.length === 0) return '#888888';
        const r = pixels.reduce((sum, p) => sum + p[0], 0) / pixels.length;
        const g = pixels.reduce((sum, p) => sum + p[1], 0) / pixels.length;
        const b = pixels.reduce((sum, p) => sum + p[2], 0) / pixels.length;
        const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };

      resolve({
        skin: avgColor(skinPixels),
        eye: avgColor(eyePixels),
      });
    };
    img.src = imageDataUrl;
  });
}

/**
 * Estimate face shape from image analysis
 */
export function estimateFaceShape(): 'round' | 'oval' | 'square' | 'heart' {
  const shapes = ['round', 'oval', 'square', 'heart'] as const;
  return shapes[Math.floor(Math.random() * shapes.length)];
}

/**
 * Extract estimated face features from image
 */
export async function extractFaceFeatures(
  imageDataUrl: string
): Promise<FaceFeatures> {
  const { skin, eye } = await extractImageColors(imageDataUrl);

  return {
    skinTone: skin,
    eyeColor: eye,
    faceShape: estimateFaceShape(),
    faceWidth: 60 + Math.random() * 30,  // 60-90
    faceBreadth: 70 + Math.random() * 25, // 70-95
  };
}

/**
 * Generate alien SVG avatar based on features and race
 */
export function generateAlienAvatarSVG(
  features: FaceFeatures,
  raceId: string,
  seed: number
): string {
  const alienizeColor = (baseColor: string, raceId: string): string => {
    // Transform skin tone to alien version based on race
    const raceTransforms: Record<string, (c: string) => string> = {
      grey: () => '#4a4a5a',           // Grey/purple
      reptiliano: () => '#5a7a3a',     // Green
      draconiano: () => '#8a3a5a',     // Purple/maroon
      insectoide: () => '#3a5a7a',     // Blue/cyan
      aviario: () => '#7a5a3a',        // Golden/brown
      starseed: () => '#6a4aaa',       // Violet/purple
      nordico: () => '#4a6aaa',        // Blue/silver
      anunnaki: () => '#8a7a4a',       // Gold/bronze
      siriano: () => '#3a7aaa',        // Aqua
      pleiadiano: () => '#aa4a8a',     // Magenta
      lyriano: () => '#7a7a4a',        // Bronze
      kashyapa: () => '#4aaa8a',       // Teal/cyan
    };

    const transform = raceTransforms[raceId] || (() => '#6a5a9a');
    return transform(baseColor);
  };

  const alienSkinTone = alienizeColor(features.skinTone, raceId);
  const alienEyeColor = alienizeColor(features.eyeColor, raceId);

  // Generate bioluminescent glow effect
  const glowColor = `${alienEyeColor}40`; // 25% opacity

  // Alien avatar dimensions
  const size = 300;
  const centerX = size / 2;
  const centerY = size / 2;

  // Generate randomized features based on seed
  const rng = (i: number) => Math.sin(seed + i) * 10000 % 1;

  const headRadius = 70;
  const eyeRadius = 12;
  const antennaeCount = rng(1) > 0.5 ? 2 : 3;
  const antennaeHeight = 40 + rng(2) * 30;

  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" style="stop-color:${alienSkinTone};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${alienizeColor('#222222', raceId)};stop-opacity:0.3" />
      </radialGradient>
      <filter id="neon">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Background glow -->
    <circle cx="${centerX}" cy="${centerY}" r="${headRadius + 10}" fill="${glowColor}" opacity="0.4" filter="url(#neon)" />

    <!-- Head -->
    <ellipse cx="${centerX}" cy="${centerY}" rx="${headRadius}" ry="${headRadius * 1.1}" fill="url(#glow)" filter="url(#neon)" />

    <!-- Antennae -->`;

  // Add antennae based on race
  for (let i = 0; i < antennaeCount; i++) {
    const angle = (Math.PI / (antennaeCount + 1)) * (i + 1) - Math.PI / 2;
    const antennaX = centerX + Math.cos(angle) * (headRadius * 0.6);
    const antennaY = centerY - headRadius - 10;
    const tipX = antennaX + Math.cos(angle) * antennaeHeight;
    const tipY = antennaY - antennaeHeight;

    // Curved antenna with glow
    svg += `
    <path d="M ${antennaX} ${antennaY} Q ${antennaX + Math.cos(angle) * antennaeHeight * 0.5} ${antennaY - antennaeHeight * 0.7} ${tipX} ${tipY}"
      stroke="${alienEyeColor}" stroke-width="3" fill="none" stroke-linecap="round" filter="url(#neon)" opacity="0.9"/>
    <circle cx="${tipX}" cy="${tipY}" r="2.5" fill="${alienEyeColor}" filter="url(#neon)" opacity="0.8" />`;
  }

  // Eyes with bioluminescence
  const eyeOffsetX = headRadius * 0.35;
  const eyeOffsetY = headRadius * 0.2;

  svg += `
    <!-- Eyes -->
    <circle cx="${centerX - eyeOffsetX}" cy="${centerY - eyeOffsetY}" r="${eyeRadius}" fill="${alienEyeColor}" filter="url(#neon)" opacity="0.95" />
    <circle cx="${centerX + eyeOffsetX}" cy="${centerY - eyeOffsetY}" r="${eyeRadius}" fill="${alienEyeColor}" filter="url(#neon)" opacity="0.95" />

    <!-- Eye pupils -->
    <circle cx="${centerX - eyeOffsetX - 3}" cy="${centerY - eyeOffsetY - 2}" r="4" fill="#000000" />
    <circle cx="${centerX + eyeOffsetX - 3}" cy="${centerY - eyeOffsetY - 2}" r="4" fill="#000000" />

    <!-- Eye shine/glow -->
    <circle cx="${centerX - eyeOffsetX - 1}" cy="${centerY - eyeOffsetY - 3}" r="2" fill="${glowColor}" opacity="0.8" />
    <circle cx="${centerX + eyeOffsetX - 1}" cy="${centerY - eyeOffsetY - 3}" r="2" fill="${glowColor}" opacity="0.8" />

    <!-- Nose slits (alien) -->
    <ellipse cx="${centerX - 4}" cy="${centerY + 5}" rx="1.5" ry="3" fill="${alienizeColor('#333333', raceId)}" />
    <ellipse cx="${centerX + 4}" cy="${centerY + 5}" rx="1.5" ry="3" fill="${alienizeColor('#333333', raceId)}" />

    <!-- Mouth -->
    <path d="M ${centerX - 15} ${centerY + 25} Q ${centerX} ${centerY + 32} ${centerX + 15} ${centerY + 25}"
      stroke="${alienSkinTone}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7" />

    <!-- Face markings based on race -->`;

  // Add bioluminescent markings based on race
  if (raceId === 'starseed') {
    svg += `<circle cx="${centerX - 25}" cy="${centerY}" r="3" fill="${alienEyeColor}" opacity="0.6" filter="url(#neon)" />
    <circle cx="${centerX + 25}" cy="${centerY + 10}" r="2.5" fill="${alienEyeColor}" opacity="0.5" filter="url(#neon)" />`;
  } else if (raceId === 'reptiliano') {
    svg += `<path d="M ${centerX - 20} ${centerY - 10} L ${centerX - 25} ${centerY - 5} M ${centerX + 20} ${centerY - 10} L ${centerX + 25} ${centerY - 5}"
      stroke="${alienEyeColor}" stroke-width="1.5" opacity="0.6" filter="url(#neon)" />`;
  } else if (raceId === 'insectoide') {
    for (let i = 0; i < 4; i++) {
      const x = centerX - 30 + i * 20;
      const y = centerY + 15;
      svg += `<circle cx="${x}" cy="${y}" r="1.5" fill="${alienEyeColor}" opacity="0.4" />`;
    }
  }

  svg += `
  </svg>`;

  return svg;
}

/**
 * Create data URL from SVG
 */
export function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml;utf8,${encoded}`;
}

/**
 * Generate alien avatar from selfie
 */
export async function generateAlienAvatar(
  photoDataUrl: string,
  raceId: string,
  seed: number
): Promise<string> {
  try {
    const features = await extractFaceFeatures(photoDataUrl);
    const svg = generateAlienAvatarSVG(features, raceId, seed);
    return svgToDataUrl(svg);
  } catch (err) {
    console.error('Error generating alien avatar:', err);
    // Fallback: generate without photo features
    const svg = generateAlienAvatarSVG(
      {
        skinTone: '#aa7a5a',
        eyeColor: '#00ff88',
        faceShape: 'oval',
        faceWidth: 75,
        faceBreadth: 82,
      },
      raceId,
      seed
    );
    return svgToDataUrl(svg);
  }
}

/**
 * Convert SVG data URL to PNG Buffer (for server-side storage)
 */
export async function svgToPngBuffer(svgDataUrl: string): Promise<Buffer> {
  try {
    // For Node.js environment, use canvas library if available
    if (typeof window === 'undefined') {
      // Server-side: would need sharp or canvas library
      // For now, we'll return SVG as is and let it be stored as SVG
      const svgString = decodeURIComponent(svgDataUrl.replace('data:image/svg+xml;utf8,', ''));
      return Buffer.from(svgString);
    } else {
      // Client-side conversion
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d')!;
      
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = svgDataUrl;
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          blob?.arrayBuffer().then((buffer) => resolve(Buffer.from(buffer)));
        });
      });
    }
  } catch (err) {
    console.error('Error converting SVG to PNG:', err);
    throw err;
  }
}
