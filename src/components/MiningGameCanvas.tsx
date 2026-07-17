import { useEffect, useRef, useState } from "react";
import { KINDS, NODE_META, randomNode, type MineNode, type NodeKind } from "@/lib/mining-game";

interface Props {
  shipImageUrl?: string | null;
  onMined: (kind: NodeKind, reward: number) => void;
}

export function MiningGameCanvas({ shipImageUrl, onMined }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<MineNode[]>(() =>
    Array.from({ length: 6 }, () => randomNode()),
  );
  const [ship, setShip] = useState({ x: 0.5, y: 0.85 });
  const [dims, setDims] = useState({ w: 320, h: 480 });

  // Resize observer
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animation tick — floating nodes
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNodes((prev) =>
        prev.map((n) => {
          let x = n.x + n.vx;
          let y = n.y + n.vy;
          let vx = n.vx, vy = n.vy;
          if (x < 0.03 || x > 0.97) vx = -vx;
          if (y < 0.05 || y > 0.75) vy = -vy;
          return { ...n, x, y, vx, vy };
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Move ship on pointer
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let dragging = false;
    const move = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      setShip({
        x: Math.max(0.05, Math.min(0.95, (clientX - r.left) / r.width)),
        y: Math.max(0.1, Math.min(0.95, (clientY - r.top) / r.height)),
      });
    };
    const onDown = (e: PointerEvent) => { dragging = true; move(e.clientX, e.clientY); };
    const onMove = (e: PointerEvent) => { if (dragging) move(e.clientX, e.clientY); };
    const onUp = () => { dragging = false; };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Keyboard nudge
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      setShip((s) => {
        const step = 0.04;
        if (e.key === "ArrowUp") return { ...s, y: Math.max(0.1, s.y - step) };
        if (e.key === "ArrowDown") return { ...s, y: Math.min(0.95, s.y + step) };
        if (e.key === "ArrowLeft") return { ...s, x: Math.max(0.05, s.x - step) };
        if (e.key === "ArrowRight") return { ...s, x: Math.min(0.95, s.x + step) };
        return s;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Mining collision detection
  useEffect(() => {
    const iv = setInterval(() => {
      setNodes((prev) => {
        const shipPx = { x: ship.x * dims.w, y: ship.y * dims.h };
        let mutated = false;
        const next: MineNode[] = [];
        for (const n of prev) {
          const nx = n.x * dims.w, ny = n.y * dims.h;
          const d = Math.hypot(nx - shipPx.x, ny - shipPx.y);
          if (d < n.size * 0.7 + 22) {
            const hp = n.hp - 1;
            if (hp <= 0) {
              const meta = NODE_META[n.kind];
              onMined(n.kind, meta.reward);
              next.push(randomNode());
              mutated = true;
            } else {
              next.push({ ...n, hp });
              mutated = true;
            }
          } else {
            next.push(n);
          }
        }
        return mutated ? next : prev;
      });
    }, 380);
    return () => clearInterval(iv);
  }, [ship, dims, onMined]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-accent/40 bg-[radial-gradient(circle_at_30%_20%,#1a0a3a,#050014)] cursor-crosshair select-none touch-none"
      style={{ backgroundImage: "radial-gradient(2px 2px at 20% 30%, #fff5, transparent), radial-gradient(1px 1px at 70% 60%, #fff8, transparent), radial-gradient(1px 1px at 40% 80%, #fff5, transparent), radial-gradient(circle at 50% 50%, #1a0a3a, #050014)" }}
    >
      {/* Nós */}
      {nodes.map((n) => {
        const meta = NODE_META[n.kind];
        return (
          <div
            key={n.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full pointer-events-none transition-transform"
            style={{
              left: `${n.x * 100}%`,
              top: `${n.y * 100}%`,
              width: n.size,
              height: n.size,
              fontSize: n.size * 0.6,
              background: `radial-gradient(circle, ${meta.color}55, transparent 70%)`,
              filter: `drop-shadow(0 0 8px ${meta.color})`,
            }}
            title={meta.label}
          >
            <span>{meta.emoji}</span>
            {n.hp < NODE_META[n.kind].hp && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/20 rounded">
                <span className="block h-full bg-emerald-400 rounded" style={{ width: `${(n.hp / NODE_META[n.kind].hp) * 100}%` }} />
              </span>
            )}
          </div>
        );
      })}

      {/* Nave do jogador */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${ship.x * 100}%`, top: `${ship.y * 100}%` }}
      >
        {shipImageUrl ? (
          <img
            src={shipImageUrl}
            alt="Nave"
            className="w-12 h-12 rounded-full object-cover border-2 border-accent shadow-neon"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-accent shadow-neon flex items-center justify-center text-lg">🚀</div>
        )}
      </div>

      {/* Legenda inferior */}
      <div className="absolute bottom-1 left-1 right-1 flex items-center justify-around bg-black/50 rounded-lg px-1 py-0.5 text-[9px] font-mono text-white/80">
        {KINDS.map((k) => (
          <span key={k} className="inline-flex items-center gap-0.5">
            <span>{NODE_META[k].emoji}</span>
            <span>+{NODE_META[k].reward}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
