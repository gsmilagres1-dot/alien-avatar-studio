import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Rocket, Users, Sparkles, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";
import { DESTINATIONS, KIND_LABEL, type DestinationKind } from "@/lib/intergalactic";
import { TEAM_DESTINATIONS, getTeamDestination } from "@/lib/team-destinations";
import planetImg from "@/assets/map/planet.png";
import sunImg from "@/assets/map/sun.png";
import moonImg from "@/assets/map/moon.png";
import galaxyImg from "@/assets/map/galaxy.png";
import nebulaImg from "@/assets/map/nebula.png";
import exoplanetImg from "@/assets/map/exoplanet.png";
import starSystemImg from "@/assets/map/star_system.png";
import clusterImg from "@/assets/map/cluster.png";
import quasarImg from "@/assets/map/quasar.png";
import { SpaceMapPanel } from "@/components/SpaceMapPanel";
import { CinemaMapPanel } from "@/components/CinemaMapPanel";

export const Route = createFileRoute("/_authenticated/mapa")({
  component: Mapa,
  head: () => ({
    meta: [
      { title: "Mapa Intergaláctico — 45 destinos" },
      { name: "description", content: "Pôster cósmico com os 45 destinos quiz: arraste, dê zoom e escolha onde viajar." },
    ],
  }),
});

type Mode = "all" | "singular" | "team";

const KIND_IMAGE: Record<string, string> = {
  planet: planetImg,
  sun: sunImg,
  moon: moonImg,
  galaxy: galaxyImg,
  nebula: nebulaImg,
  exoplanet: exoplanetImg,
  star_system: starSystemImg,
  cluster: clusterImg,
  quasar: quasarImg,
};

interface Node {
  id: string;
  name: string;
  kind: DestinationKind;
  group: "singular" | "team";
  level: number;
  transport: string;
  /** 0..100 % do pôster (largura) */
  x: number;
  /** 0..100 % do pôster (altura) */
  y: number;
  /** Tamanho relativo (% da largura do pôster). */
  size: number;
}

// Distribui 45 nós num pôster vertical longo, seguindo trajeto serpentino.
// Posições embaralhadas por sessão (mantém o tipo → mantém a imagem).
function buildNodes(): Node[] {
  const all = [
    ...DESTINATIONS.map((d) => ({ ...d, group: "singular" as const })),
    ...TEAM_DESTINATIONS.map((d) => ({
      id: d.id, name: d.name, transport: d.transport,
      level: d.level, kind: d.kind as DestinationKind, group: "team" as const,
    })),
  ];

  // Embaralhar ordem (Fisher-Yates) para posições aleatórias por sessão
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  const sizeFor = (k: DestinationKind) => {
    if (k === "galaxy" || k === "quasar") return 22;
    if (k === "sun" || k === "nebula" || k === "star_system") return 19;
    if (k === "planet" || k === "exoplanet") return 17;
    if (k === "cluster") return 16;
    if (k === "moon") return 14;
    return 16;
  };

  const COLS = 3;
  const ROWS = Math.ceil(all.length / COLS); // 15 fileiras
  const stepX = 100 / (COLS + 1);
  const stepY = 100 / (ROWS + 1);

  return all.map((it, i) => {
    const row = Math.floor(i / COLS);
    const colInRow = i % COLS;
    const leftToRight = row % 2 === 0;
    const col = leftToRight ? colInRow : COLS - 1 - colInRow;
    const jitterX = Math.sin(i * 1.9 + Math.random() * 2) * 5;
    const jitterY = Math.cos(i * 2.7 + Math.random() * 2) * 1.5;
    return {
      ...it,
      x: stepX * (col + 1) + jitterX,
      y: stepY * (row + 1) + jitterY,
      size: sizeFor(it.kind),
    };
  });
}

function Mapa() {
  const [mode, setMode] = useState<Mode>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const nodes = useMemo(() => buildNodes(), []);
  const visible = useMemo(
    () => mode === "all" ? nodes : nodes.filter((n) => n.group === mode),
    [nodes, mode],
  );

  // Posição das naves: última posição (mais avançada) por grupo dentro do filtro atual.
  const ship = {
    singular: [...nodes].reverse().find((n) => n.group === "singular"),
    team:     [...nodes].reverse().find((n) => n.group === "team"),
  };

  const selectedNode = selected ? nodes.find((n) => n.id === selected) : null;
  const teamMeta = selectedNode?.group === "team" ? getTeamDestination(selectedNode.id) : null;

  // Pôster com proporção alta (mapa longo) para caber 15 fileiras.
  const POSTER_RATIO = 2.6; // altura / largura

  return (
    <main className="px-4 py-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-display text-2xl text-gradient-neon">Mapa Intergaláctico</h1>
        <WalletBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        45 destinos quiz · arraste, dê pinch-zoom ou use os botões. Naves marcam o ponto mais avançado.
      </p>

      <div className="flex flex-wrap gap-2 mb-3 items-center" role="tablist">
        <FilterChip active={mode === "all"} onClick={() => setMode("all")} icon={<Sparkles className="w-3.5 h-3.5" />}>
          Todos ({nodes.length})
        </FilterChip>
        <FilterChip active={mode === "team"} onClick={() => setMode("team")} icon={<Users className="w-3.5 h-3.5" />}>
          Equipe ({TEAM_DESTINATIONS.length})
        </FilterChip>
        <div className="ml-auto flex items-center gap-1 text-xs">
          <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
            className="p-1.5 rounded-md border border-accent/30 hover:border-accent" aria-label="Diminuir zoom">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono w-10 text-center text-[11px]">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(2)))}
            className="p-1.5 rounded-md border border-accent/30 hover:border-accent" aria-label="Aumentar zoom">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded-md border border-accent/30 hover:border-accent" aria-label="Encaixar">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scroller: arraste vertical/horizontal + pinch-zoom no celular */}
      <div
        ref={scrollerRef}
        className="glass rounded-2xl border border-accent/30 relative overflow-auto"
        style={{
          height: "70vh",
          maxHeight: 680,
          touchAction: "pan-x pan-y pinch-zoom",
          background:
            "radial-gradient(ellipse at top, rgba(167,139,250,0.18), transparent 60%), radial-gradient(ellipse at bottom, rgba(34,211,238,0.15), transparent 55%), #05010f",
        }}
      >
        <div
          style={{
            width: `${100 * zoom}%`,
            aspectRatio: `1 / ${POSTER_RATIO}`,
            position: "relative",
            margin: "0 auto",
            transition: "width 200ms ease",
          }}
        >
          {/* fundo estrelado */}
          <div aria-hidden className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(1px 1px at 20% 8%, #fff 99%, transparent), radial-gradient(1px 1px at 70% 14%, #fff 99%, transparent), radial-gradient(1px 1px at 35% 22%, #cbd5e1 99%, transparent), radial-gradient(1.5px 1.5px at 85% 30%, #fff 99%, transparent), radial-gradient(1px 1px at 12% 42%, #fff 99%, transparent), radial-gradient(1px 1px at 55% 50%, #cbd5e1 99%, transparent), radial-gradient(1px 1px at 78% 58%, #fff 99%, transparent), radial-gradient(1.5px 1.5px at 28% 66%, #fff 99%, transparent), radial-gradient(1px 1px at 60% 74%, #cbd5e1 99%, transparent), radial-gradient(1px 1px at 90% 82%, #fff 99%, transparent), radial-gradient(1px 1px at 18% 90%, #fff 99%, transparent), radial-gradient(1px 1px at 48% 96%, #cbd5e1 99%, transparent)",
            }}
          />

          {/* Trajeto entre nós visíveis */}
          <svg viewBox="0 0 100 260" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="trail" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {visible.length > 1 && (
              <path
                d={visible.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x} ${(n.y / 100) * 260}`).join(" ")}
                fill="none"
                stroke="url(#trail)"
                strokeWidth="0.4"
                strokeDasharray="1.2 1.5"
              />
            )}
          </svg>

          {/* Nós: imagens reais por tipo */}
          {visible.map((n) => {
            const src = KIND_IMAGE[n.kind];
            const isSel = selected === n.id;
            const sizePct = n.size;
            return (
              <button
                key={n.id}
                onClick={() => setSelected(n.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${sizePct}%` }}
                aria-label={n.name}
              >
                <div className="relative aspect-square">
                  <img
                    src={src}
                    alt={n.name}
                    loading="lazy"
                    className={`w-full h-full object-contain drop-shadow-[0_0_18px_rgba(167,139,250,0.55)] transition-transform group-hover:scale-110 ${isSel ? "scale-110" : ""}`}
                  />
                  {isSel && (
                    <div className="absolute inset-0 rounded-full ring-2 ring-accent animate-pulse" />
                  )}
                </div>
                <div className={`mt-0.5 text-center text-[9px] leading-tight font-mono px-1 truncate ${isSel ? "text-accent" : "text-white/85"}`}>
                  {n.name}
                </div>
              </button>
            );
          })}

          {/* Naves: 🚀 singular e 🛸 equipe na última posição de cada grupo */}
          {ship.singular && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none"
              style={{ left: `${ship.singular.x + 4}%`, top: `${ship.singular.y}%` }}
              aria-label="Nave singular"
              title="Nave singular"
            >
              🚀
            </div>
          )}
          {ship.team && (
            <div
              className="absolute -translate-x-1/2 -translate-y-full text-2xl drop-shadow-[0_0_8px_rgba(167,139,250,0.9)] pointer-events-none"
              style={{ left: `${ship.team.x - 4}%`, top: `${ship.team.y}%` }}
              aria-label="Nave de equipe"
              title="Nave de equipe"
            >
              🛸
            </div>
          )}
        </div>
      </div>

      {/* detalhe do nó selecionado */}
      <div className="mt-3 glass rounded-xl p-4 border border-accent/20 min-h-[88px]">
        {selectedNode ? (
          <div className="flex gap-3">
            <img
              src={KIND_IMAGE[selectedNode.kind]}
              alt=""
              loading="lazy"
              className="w-16 h-16 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(167,139,250,0.6)]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-sm truncate">{selectedNode.name}</h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-auto shrink-0">
                  {selectedNode.group === "team" ? "equipe" : "singular"} · nv {selectedNode.level}
                </span>
              </div>
              <p className="text-xs text-foreground/70">
                Tipo: <span className="text-foreground/90">{KIND_LABEL[selectedNode.kind]}</span>
              </p>
              <p className="text-xs text-foreground/70">
                Transporte: <span className="text-foreground/90">{selectedNode.transport}</span>
              </p>
              {teamMeta && (
                <>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Constelação: <span className="text-foreground/80">{teamMeta.constellation}</span> · {teamMeta.distance}
                  </p>
                  <p className="text-[11px] text-foreground/70 line-clamp-2">{teamMeta.highlight}</p>
                </>
              )}
              <div className="mt-2">
                <Link
                  to="/galaxia"
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-bold"
                >
                  <Rocket className="w-3 h-3" /> Ir fazer o quiz
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            <Rocket className="w-4 h-4 inline mr-1 text-accent" />
            Toque num nó do mapa para ver detalhes do destino.
          </p>
        )}
      </div>

      <SpaceMapPanel />

      <div className="mt-6 text-xs text-muted-foreground">
        <Link to="/" className="underline">← voltar à home</Link>
      </div>
    </main>
  );
}


function FilterChip({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
        active
          ? "bg-accent text-accent-foreground border-accent"
          : "bg-transparent text-muted-foreground border-accent/30 hover:border-accent/60"
      }`}
    >
      {icon}{children}
    </button>
  );
}
