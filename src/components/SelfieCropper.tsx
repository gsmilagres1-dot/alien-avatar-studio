import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Cropper de selfie no padrão ICAO 5x7 (proporção 5:7 retrato).
 * - Mostra guia de oval de rosto ocupando ~75% da altura do frame (entre 70%–80%).
 * - Linha dos ombros vista na base.
 * - Usuário arrasta e dá zoom para encaixar.
 * Saída: dataURL JPEG 500x700 (proporção 5:7 ICAO).
 */
export function SelfieCropper({
  src,
  onCancel,
  onConfirm,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [img, setImg] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);

  // carrega dimensões originais
  useEffect(() => {
    const i = new Image();
    i.onload = () => {
      setImg({ w: i.naturalWidth, h: i.naturalHeight });
      // fit inicial: cobre o frame (escala mínima)
      const f = frameRef.current?.getBoundingClientRect();
      if (f) {
        const s = Math.max(f.width / i.naturalWidth, f.height / i.naturalHeight);
        setScale(s);
        setPos({ x: 0, y: 0 });
      }
    };
    i.src = src;
  }, [src]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  }
  function onPointerUp() { drag.current = null; }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinch.current = { dist: Math.hypot(dx, dy), scale };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinch.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      setScale(Math.max(0.3, Math.min(4, pinch.current.scale * (d / pinch.current.dist))));
    }
  }
  function onTouchEnd() { pinch.current = null; }

  function reset() {
    if (!img) return;
    const f = frameRef.current?.getBoundingClientRect();
    if (!f) return;
    const s = Math.max(f.width / img.w, f.height / img.h);
    setScale(s);
    setPos({ x: 0, y: 0 });
  }

  function confirm() {
    if (!img || !frameRef.current || !imgRef.current) return;
    const f = frameRef.current.getBoundingClientRect();
    // Posição do <img> renderizado relativo ao frame
    const ir = imgRef.current.getBoundingClientRect();
    // canvas saída ICAO ~500x700
    const OUT_W = 500;
    const OUT_H = 700;
    const ratio = OUT_W / f.width;
    const c = document.createElement("canvas");
    c.width = OUT_W;
    c.height = OUT_H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    // desenhar a imagem mantendo escala visível
    const dx = (ir.left - f.left) * ratio;
    const dy = (ir.top - f.top) * ratio;
    const dw = ir.width * ratio;
    const dh = ir.height * ratio;
    ctx.drawImage(imgRef.current, dx, dy, dw, dh);
    onConfirm(c.toDataURL("image/jpeg", 0.92));
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl p-4 border border-accent/40">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-sm text-gradient-neon">Enquadrar selfie · 5×7 ICAO</h3>
          <button onClick={onCancel} aria-label="Cancelar" className="p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 leading-snug">
          Centralize o rosto no oval (70–80% da altura). Ombros visíveis na base. Arraste para mover · pinça para zoom.
        </p>

        {/* Frame 5:7 */}
        <div
          ref={frameRef}
          className="relative mx-auto overflow-hidden rounded-xl bg-black/70 border border-accent/40 select-none touch-none"
          style={{ width: 250, height: 350 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {img && (
            <img
              ref={imgRef}
              src={src}
              alt="ajustar"
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: img.w * scale,
                height: img.h * scale,
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                maxWidth: "none",
                userSelect: "none",
              }}
            />
          )}
          {/* Overlay guia ICAO: oval do rosto + linha dos ombros */}
          <svg viewBox="0 0 50 70" className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Máscara escurecendo fora do oval+ombros não — apenas linhas guia */}
            {/* Oval do rosto: centrado, altura ~52 (75% de 70), largura ~36 */}
            <ellipse cx="25" cy="29" rx="14" ry="19" fill="none" stroke="#22d3ee" strokeWidth="0.4" strokeDasharray="1 1" opacity="0.9" />
            {/* Topo da cabeça (margem superior ~10%) */}
            <line x1="6" y1="7" x2="44" y2="7" stroke="#a78bfa" strokeWidth="0.25" strokeDasharray="0.8 0.8" opacity="0.7" />
            {/* Linha dos olhos (~45% do topo) */}
            <line x1="10" y1="26" x2="40" y2="26" stroke="#22d3ee" strokeWidth="0.25" strokeDasharray="0.6 0.6" opacity="0.6" />
            {/* Linha dos ombros (parte inferior, ~88%) */}
            <line x1="2" y1="62" x2="48" y2="62" stroke="#a78bfa" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.8" />
            {/* Centro vertical */}
            <line x1="25" y1="2" x2="25" y2="68" stroke="#ffffff" strokeWidth="0.1" strokeDasharray="0.4 0.8" opacity="0.35" />
          </svg>
          <div className="absolute bottom-1 left-1 right-1 text-center text-[8px] text-cyan-300/80 font-mono pointer-events-none">
            5 × 7 cm · rosto 70–80% · ombros visíveis
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <button onClick={() => setScale((s) => Math.max(0.3, +(s - 0.1).toFixed(2)))} className="p-2 rounded-lg border border-accent/30">
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range" min={0.3} max={4} step={0.05}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 accent-accent"
            aria-label="Zoom"
          />
          <button onClick={() => setScale((s) => Math.min(4, +(s + 0.1).toFixed(2)))} className="p-2 rounded-lg border border-accent/30">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={reset} className="p-2 rounded-lg border border-accent/30" aria-label="Resetar">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={onCancel} className="flex-1 px-3 py-2 rounded-xl border border-white/15 text-sm">
            Cancelar
          </button>
          <button onClick={confirm} className="flex-1 px-3 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm inline-flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" /> Usar enquadramento
          </button>
        </div>
      </div>
    </div>
  );
}
