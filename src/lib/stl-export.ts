// Gera arquivo STL (binário) a partir de uma imagem de avatar usando técnica
// de litofânia: converte a imagem em heightmap (pixel escuro = mais alto),
// resultando em um relevo 3D imprimível. STL é o formato universal aceito
// pelos slicers de Bambu (Bambu Studio), Flashforge (FlashPrint / Orca) e
// Creality (Creality Print / Cura). O arquivo é 100% offline, gerado no
// próprio navegador — sem servidor.

export type STLOptions = {
  /** Largura física da peça em mm (padrão 80mm). */
  widthMm?: number;
  /** Espessura base sólida em mm (padrão 1.2mm). */
  baseMm?: number;
  /** Relevo máximo em mm sobre a base (padrão 2.8mm). */
  reliefMm?: number;
  /** Resolução do heightmap (padrão 140 — bom equilíbrio detalhe/tamanho). */
  resolution?: number;
  /** Inverter (para litofânia iluminada por trás use true). */
  invert?: boolean;
};

async function loadImageToGrayscale(
  url: string,
  size: number,
): Promise<{ data: Float32Array; w: number; h: number }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Não foi possível carregar a imagem do avatar."));
    el.src = url;
  });
  const aspect = img.naturalHeight / img.naturalWidth;
  const w = size;
  const h = Math.max(16, Math.round(size * aspect));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(img, 0, 0, w, h);
  const raw = ctx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = raw[i * 4], g = raw[i * 4 + 1], b = raw[i * 4 + 2];
    // Luminância percebida
    gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  return { data: gray, w, h };
}

/**
 * Gera bytes STL binários (heightmap + paredes + base sólida) a partir de
 * uma imagem. Retorna um Blob pronto para download.
 */
export async function generateAvatarSTL(imageUrl: string, opts: STLOptions = {}): Promise<Blob> {
  const widthMm = opts.widthMm ?? 80;
  const baseMm = opts.baseMm ?? 1.2;
  const reliefMm = opts.reliefMm ?? 2.8;
  const resolution = Math.max(32, Math.min(220, opts.resolution ?? 140));
  const invert = opts.invert ?? true; // padrão: pixels escuros = mais altos (litofânia clássica)

  const { data: gray, w, h } = await loadImageToGrayscale(imageUrl, resolution);
  const dx = widthMm / (w - 1);
  const dy = widthMm / (w - 1); // pixel quadrado
  const heightMm = dy * (h - 1);

  const heightAt = (x: number, y: number) => {
    const v = gray[y * w + x];
    const norm = invert ? 1 - v : v;
    return baseMm + norm * reliefMm;
  };

  // Contagem: 2 triângulos por célula * 4 superfícies (topo, base, 4 paredes)
  const topTris = (w - 1) * (h - 1) * 2;
  const bottomTris = (w - 1) * (h - 1) * 2;
  const wallTris = 2 * ((w - 1) * 2 + (h - 1) * 2); // 4 bordas
  const total = topTris + bottomTris + wallTris;

  // STL binário: 80 bytes header + 4 bytes count + N * 50 bytes
  const buf = new ArrayBuffer(84 + total * 50);
  const view = new DataView(buf);
  const encoder = new TextEncoder();
  encoder.encodeInto("Lovable Alien Avatar STL - lithophane".padEnd(80, " "), new Uint8Array(buf, 0, 80));
  view.setUint32(80, total, true);
  let off = 84;

  const writeTri = (
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
  ) => {
    // Normal — deixamos zero, os slicers recalculam.
    view.setFloat32(off, 0, true); off += 4;
    view.setFloat32(off, 0, true); off += 4;
    view.setFloat32(off, 0, true); off += 4;
    view.setFloat32(off, ax, true); off += 4;
    view.setFloat32(off, ay, true); off += 4;
    view.setFloat32(off, az, true); off += 4;
    view.setFloat32(off, bx, true); off += 4;
    view.setFloat32(off, by, true); off += 4;
    view.setFloat32(off, bz, true); off += 4;
    view.setFloat32(off, cx, true); off += 4;
    view.setFloat32(off, cy, true); off += 4;
    view.setFloat32(off, cz, true); off += 4;
    view.setUint16(off, 0, true); off += 2;
  };

  const px = (x: number) => x * dx;
  const py = (y: number) => y * dy;

  // Topo (heightmap)
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const z00 = heightAt(x, y);
      const z10 = heightAt(x + 1, y);
      const z01 = heightAt(x, y + 1);
      const z11 = heightAt(x + 1, y + 1);
      writeTri(px(x), py(y), z00, px(x + 1), py(y), z10, px(x + 1), py(y + 1), z11);
      writeTri(px(x), py(y), z00, px(x + 1), py(y + 1), z11, px(x), py(y + 1), z01);
    }
  }
  // Base plana em z=0
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      writeTri(px(x), py(y), 0, px(x + 1), py(y + 1), 0, px(x + 1), py(y), 0);
      writeTri(px(x), py(y), 0, px(x), py(y + 1), 0, px(x + 1), py(y + 1), 0);
    }
  }
  // Paredes: y=0 e y=h-1
  for (let x = 0; x < w - 1; x++) {
    const zA = heightAt(x, 0), zB = heightAt(x + 1, 0);
    writeTri(px(x), 0, 0, px(x + 1), 0, 0, px(x + 1), 0, zB);
    writeTri(px(x), 0, 0, px(x + 1), 0, zB, px(x), 0, zA);
    const zC = heightAt(x, h - 1), zD = heightAt(x + 1, h - 1);
    writeTri(px(x), py(h - 1), 0, px(x + 1), py(h - 1), zD, px(x + 1), py(h - 1), 0);
    writeTri(px(x), py(h - 1), 0, px(x), py(h - 1), zC, px(x + 1), py(h - 1), zD);
  }
  // Paredes: x=0 e x=w-1
  for (let y = 0; y < h - 1; y++) {
    const zA = heightAt(0, y), zB = heightAt(0, y + 1);
    writeTri(0, py(y), 0, 0, py(y + 1), zB, 0, py(y + 1), 0);
    writeTri(0, py(y), 0, 0, py(y), zA, 0, py(y + 1), zB);
    const zC = heightAt(w - 1, y), zD = heightAt(w - 1, y + 1);
    writeTri(px(w - 1), py(y), 0, px(w - 1), py(y + 1), 0, px(w - 1), py(y + 1), zD);
    writeTri(px(w - 1), py(y), 0, px(w - 1), py(y + 1), zD, px(w - 1), py(y), zC);
  }

  return new Blob([buf], { type: "model/stl" });
}

/** Baixa o STL do avatar. */
export async function downloadAvatarSTL(imageUrl: string, filenameBase: string, opts?: STLOptions) {
  const blob = await generateAvatarSTL(imageUrl, opts);
  const safe = filenameBase.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40) || "alien-avatar";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}_${Math.round((opts?.widthMm ?? 80))}mm.stl`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return blob.size;
}
