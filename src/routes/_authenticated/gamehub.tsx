import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Gamepad2, Rocket, RotateCw, Trophy, Loader2 } from "lucide-react";
import { listMyIdentities } from "@/lib/identities.functions";
import { MiningGameCanvas } from "@/components/MiningGameCanvas";
import { KINDS, NODE_META, type NodeKind } from "@/lib/mining-game";
import { useUpgradeStats } from "@/hooks/useUpgradeStats";

export const Route = createFileRoute("/_authenticated/gamehub")({
  head: () => ({
    meta: [
      { title: "A&A · Across Ages — Game Hub" },
      { name: "description", content: "Mini-jogo de mineração espacial: pilote sua nave alien e minere asteroides, meteoros, planetas e constelações." },
      { property: "og:title", content: "A&A · Across Ages" },
      { property: "og:description", content: "Game Hub oficial da Identidade Alien: mineração espacial ao vivo com sua nave e piloto." },
    ],
  }),
  component: GameHub,
});

function GameHub() {
  const listFn = useServerFn(listMyIdentities);
  const { data, isLoading } = useQuery({ queryKey: ["my-identities"], queryFn: () => listFn() });
  const identities = useMemo(() => data?.identities ?? [], [data]);
  const [pilotId, setPilotId] = useState<string | null>(null);
  const pilot = identities.find((i) => i.id === pilotId) ?? identities[0] ?? null;
  const stats = useUpgradeStats();

  const [session, setSession] = useState<Record<NodeKind, number>>({
    asteroid: 0, meteor: 0, planet: 0, constellation: 0,
  });
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);

  function handleMined(kind: NodeKind, reward: number) {
    setSession((s) => ({ ...s, [kind]: s[kind] + 1 }));
    setScore((v) => v + reward);
  }

  function newRound() {
    setSession({ asteroid: 0, meteor: 0, planet: 0, constellation: 0 });
    setScore(0);
    setRound((r) => r + 1);
  }

  return (
    <main className="px-3 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Gamepad2 className="w-5 h-5 text-accent shrink-0" />
          <div className="min-w-0">
            <h1 className="font-display text-xl text-gradient-neon truncate">A&A · Across Ages</h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Mineração espacial · sessão {round}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={newRound}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-[11px] font-mono"
          title="Nova rodada"
        >
          <RotateCw className="w-3.5 h-3.5" /> Nova
        </button>
      </div>

      {/* Seletor de piloto/nave */}
      <section className="glass rounded-2xl p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Piloto ativo</div>
          <Link to="/criar" className="text-[10px] text-accent hover:underline">+ Novo piloto</Link>
        </div>
        {isLoading ? (
          <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-accent" /></div>
        ) : identities.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">
            Crie um avatar em <Link to="/criar" className="text-accent underline">/criar</Link> para pilotar.
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto snap-x -mx-1 px-1 pb-1">
            {identities.map((i) => {
              const active = (pilot?.id ?? identities[0]?.id) === i.id;
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setPilotId(i.id)}
                  className={`shrink-0 snap-start rounded-xl p-1 transition ${active ? "ring-2 ring-accent shadow-neon" : "opacity-70 hover:opacity-100"}`}
                >
                  <img src={i.avatar_url} alt={i.alien_name} className="w-12 h-12 rounded-lg object-cover object-[center_25%]" />
                  <div className="text-[9px] font-mono text-center mt-0.5 max-w-[56px] truncate">{i.alien_name}</div>
                </button>
              );
            })}
          </div>
        )}
        {pilot && (
          <div className="mt-2 grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
            <div className="glass rounded-lg py-1"><div className="text-muted-foreground">VEL</div><div className="text-cyan-300 font-bold">{stats.speedC}</div></div>
            <div className="glass rounded-lg py-1"><div className="text-muted-foreground">REA</div><div className="text-emerald-300 font-bold">{stats.reactor}</div></div>
            <div className="glass rounded-lg py-1"><div className="text-muted-foreground">ESC</div><div className="text-fuchsia-300 font-bold">{stats.shields}</div></div>
            <div className="glass rounded-lg py-1"><div className="text-muted-foreground">RAD</div><div className="text-amber-300 font-bold">{stats.radar}</div></div>
          </div>
        )}
      </section>

      {/* HUD pontuação */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        <div className="glass rounded-xl p-2 text-center col-span-1">
          <Trophy className="w-4 h-4 mx-auto text-amber-300" />
          <div className="text-[9px] font-mono text-muted-foreground uppercase mt-0.5">Score</div>
          <div className="text-base font-bold text-amber-200">{score}</div>
        </div>
        {KINDS.map((k) => {
          const m = NODE_META[k];
          return (
            <div key={k} className="glass rounded-xl p-2 text-center">
              <div className="text-lg leading-none">{m.emoji}</div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase mt-0.5 truncate">{m.label}</div>
              <div className="text-sm font-bold" style={{ color: m.color }}>{session[k]}</div>
            </div>
          );
        })}
      </div>

      {/* Canvas do jogo */}
      <MiningGameCanvas shipImageUrl={pilot?.ship_image_url ?? pilot?.avatar_url ?? null} onMined={handleMined} />

      <p className="mt-3 text-[10px] font-mono text-center text-muted-foreground leading-relaxed">
        Arraste (ou setas do teclado) para pilotar. Encoste nos corpos celestes para minerar.
      </p>

      <div className="mt-4 flex justify-center">
        <Link to="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass text-xs">
          <Rocket className="w-3.5 h-3.5" /> Voltar ao painel
        </Link>
      </div>
    </main>
  );
}
