import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Rocket, User, Users, Sparkles } from "lucide-react";
import { WalletBadge } from "@/components/WalletBadge";
import { DESTINATIONS, type DestinationKind } from "@/lib/intergalactic";
import { TEAM_DESTINATIONS, TEAM_KIND_LABEL, type TeamDestKind } from "@/lib/team-destinations";

export const Route = createFileRoute("/_authenticated/mapa")({
  component: Mapa,
  head: () => ({
    meta: [
      { title: "Mapa Intergaláctico — 45 destinos" },
      { name: "description", content: "Mapa interativo com os 45 destinos: 15 do modo singular + 30 exclusivos do modo Equipe." },
    ],
  }),
});

type Mode = "all" | "singular" | "team";

interface Node {
  id: string;
  name: string;
  kind: DestinationKind | TeamDestKind;
  group: "singular" | "team";
  level: number;
  transport: string;
  detail: string;
  x: number; // 0..100 (svg viewBox)
  y: number; // 0..100
}

// Spread 45 nodes ao longo de um caminho serpentino dentro de uma viewBox 100×260.
function buildNodes(): Node[] {
  const singularItems = DESTINATIONS.map((d) => ({
    id: d.id, name: d.name, kind: d.kind, level: d.level,
    transport: d.transport, group: "singular" as const,
    detail: d.kind,
  }));
  const teamItems = TEAM_DESTINATIONS.map((d) => ({
    id: d.id, name: d.name, kind: d.kind, level: d.level,
    transport: d.transport, group: "team" as const,
    detail: TEAM_KIND_LABEL[d.kind],
  }));
  const all = [...singularItems, ...teamItems];

  // serpentina: 5 colunas, ~9 linhas → 45 nós
  const COLS = 5;
  const ROWS = Math.ceil(all.length / COLS); // 9
  const stepX = 100 / (COLS + 1);
  const stepY = 260 / (ROWS + 1);

  return all.map((it, i) => {
    const row = Math.floor(i / COLS);
    const colInRow = i % COLS;
    const leftToRight = row % 2 === 0;
    const col = leftToRight ? colInRow : COLS - 1 - colInRow;
    // pequena variação para parecer caminho de mapa
    const jitterX = (Math.sin(i * 1.7) * 4);
    const jitterY = (Math.cos(i * 2.3) * 3);
    return {
      ...it,
      x: stepX * (col + 1) + jitterX,
      y: stepY * (row + 1) + jitterY,
    };
  });
}

const KIND_COLOR: Record<string, string> = {
  // singular
  planet: "#60a5fa",
  sun: "#f59e0b",
  moon: "#cbd5e1",
  fatal: "#ef4444",
  // team
  galaxy: "#a78bfa",
  nebula: "#f472b6",
  exoplanet: "#34d399",
  star_system: "#fbbf24",
  cluster: "#22d3ee",
  quasar: "#fb7185",
};

function Mapa() {
  const [mode, setMode] = useState<Mode>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const nodes = useMemo(() => buildNodes(), []);
  const visible = useMemo(
    () => mode === "all" ? nodes : nodes.filter((n) => n.group === mode),
    [nodes, mode],
  );

  // caminho percorrendo os nós visíveis em ordem
  const path = useMemo(() => {
    if (visible.length === 0) return "";
    return visible.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x.toFixed(2)} ${n.y.toFixed(2)}`).join(" ");
  }, [visible]);

  // nave singular e nave de equipe (último nó de cada grupo como "estacionamento")
  const ship = {
    singular: [...visible].reverse().find((n) => n.group === "singular"),
    team:     [...visible].reverse().find((n) => n.group === "team"),
  };

  const selectedNode = selected ? nodes.find((n) => n.id === selected) : null;

  return (
    <main className="px-4 py-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-display text-2xl text-gradient-neon">Mapa Intergaláctico</h1>
        <WalletBadge />
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        45 destinos · 15 singulares + 30 de equipe. Clique num nó para detalhes.
      </p>

      <div className="flex gap-2 mb-3" role="tablist">
        <FilterChip active={mode === "all"} onClick={() => setMode("all")} icon={<Sparkles className="w-3.5 h-3.5" />}>
          Todos ({nodes.length})
        </FilterChip>
        <FilterChip active={mode === "singular"} onClick={() => setMode("singular")} icon={<User className="w-3.5 h-3.5" />}>
          Singular ({DESTINATIONS.length})
        </FilterChip>
        <FilterChip active={mode === "team"} onClick={() => setMode("team")} icon={<Users className="w-3.5 h-3.5" />}>
          Equipe ({TEAM_DESTINATIONS.length})
        </FilterChip>
      </div>

      <div className="glass rounded-2xl p-2 border border-accent/30 relative overflow-hidden">
        {/* fundo estrelado */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(167,139,250,0.15),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.12),transparent_55%)] pointer-events-none" />
        <svg viewBox="0 0 100 260" className="w-full h-[70vh] max-h-[680px] relative" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="trail" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"  stopColor="#a78bfa" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="0.8" /></filter>
          </defs>

          {/* estrelas decorativas */}
          {Array.from({ length: 40 }).map((_, i) => (
            <circle key={i} cx={(i * 53) % 100} cy={(i * 97) % 260} r={0.3 + ((i * 7) % 5) / 10} fill="#fff" opacity={0.25 + ((i % 5) * 0.1)} />
          ))}

          {/* trajeto */}
          {path && (
            <path d={path} fill="none" stroke="url(#trail)" strokeWidth="0.6"
              strokeDasharray="1.5 1.5" filter="url(#glow)" />
          )}

          {/* nós */}
          {visible.map((n) => {
            const color = KIND_COLOR[n.kind] ?? "#a78bfa";
            const isSel = selected === n.id;
            const r = n.group === "singular" ? 2.4 : 2.0;
            return (
              <g key={n.id} className="cursor-pointer" onClick={() => setSelected(n.id)}>
                <circle cx={n.x} cy={n.y} r={r + 1.4} fill={color} opacity={isSel ? 0.55 : 0.25} />
                <circle cx={n.x} cy={n.y} r={r} fill={color}
                  stroke={isSel ? "#fff" : "rgba(255,255,255,0.4)"} strokeWidth={isSel ? 0.5 : 0.2} />
                {n.group === "team" && (
                  <circle cx={n.x} cy={n.y} r={r - 1} fill="none" stroke="#0b1020" strokeWidth="0.3" />
                )}
              </g>
            );
          })}

          {/* naves estacionadas */}
          {ship.singular && (
            <g transform={`translate(${ship.singular.x + 2.5} ${ship.singular.y - 3})`}>
              <text fontSize="3.2" fill="#fbbf24">🚀</text>
            </g>
          )}
          {ship.team && ship.team.id !== ship.singular?.id && (
            <g transform={`translate(${ship.team.x + 2.5} ${ship.team.y - 3})`}>
              <text fontSize="3.2" fill="#a78bfa">🛸</text>
            </g>
          )}
        </svg>
      </div>

      {/* legenda */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <LegendDot color={KIND_COLOR.planet}>planeta</LegendDot>
        <LegendDot color={KIND_COLOR.sun}>sol</LegendDot>
        <LegendDot color={KIND_COLOR.moon}>lua</LegendDot>
        <LegendDot color={KIND_COLOR.galaxy}>galáxia</LegendDot>
        <LegendDot color={KIND_COLOR.nebula}>nebulosa</LegendDot>
        <LegendDot color={KIND_COLOR.exoplanet}>exoplaneta</LegendDot>
        <LegendDot color={KIND_COLOR.star_system}>sistema estelar</LegendDot>
        <LegendDot color={KIND_COLOR.cluster}>aglomerado</LegendDot>
        <LegendDot color={KIND_COLOR.quasar}>quasar</LegendDot>
      </div>

      {/* detalhe do nó selecionado */}
      <div className="mt-3 glass rounded-xl p-4 border border-accent/20 min-h-[88px]">
        {selectedNode ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: KIND_COLOR[selectedNode.kind] ?? "#a78bfa" }} />
              <h3 className="font-display text-sm">{selectedNode.name}</h3>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-auto">
                {selectedNode.group === "team" ? "equipe" : "singular"} · nível {selectedNode.level}
              </span>
            </div>
            <p className="text-xs text-foreground/70">
              Tipo: <span className="text-foreground/90 capitalize">{selectedNode.detail.replaceAll("_", " ")}</span>
            </p>
            <p className="text-xs text-foreground/70">
              Transporte: <span className="text-foreground/90">{selectedNode.transport}</span>
            </p>
            {selectedNode.group === "team" && (
              <Link to="/equipes/destinos" className="text-[11px] underline text-accent mt-1 inline-block">
                Ver todos os destinos de equipe →
              </Link>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            <Rocket className="w-4 h-4 inline mr-1 text-accent" />
            Toque num nó do mapa para ver detalhes do destino.
          </p>
        )}
      </div>

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

function LegendDot({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} /> {children}
    </span>
  );
}
