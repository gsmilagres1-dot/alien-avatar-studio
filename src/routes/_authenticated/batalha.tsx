import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Swords, Coins, Users, ChevronRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listBattlesForMyTeams,
  listOpenTeams,
  createBattleFn,
  acceptBattleFn,
  listBattleDestinations,
} from "@/lib/battles.functions";

export const Route = createFileRoute("/_authenticated/batalha")({
  head: () => ({ meta: [{ title: "Sala de Batalha · Alien" }] }),
  component: BattleRoom,
});

function BattleRoom() {
  const router = useRouter();
  const list = useServerFn(listBattlesForMyTeams);
  const opens = useServerFn(listOpenTeams);
  const create = useServerFn(createBattleFn);
  const accept = useServerFn(acceptBattleFn);

  const battlesQ = useQuery({ queryKey: ["battles"], queryFn: () => list() });
  const teamsQ = useQuery({ queryKey: ["open-teams"], queryFn: () => opens() });
  const destinations = listBattleDestinations();

  const [showForm, setShowForm] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [dest, setDest] = useState(destinations[0]?.id ?? "");
  const [bet, setBet] = useState(50);

  const myTeams = battlesQ.data?.teams ?? [];
  const myTeam = myTeams[0]; // first team where user is leader/member

  const createM = useMutation({
    mutationFn: () => create({ data: { teamAId: myTeam!.id, teamBId: opponent, destinationId: dest, betFichas: bet } }),
    onSuccess: ({ battleId }) => {
      toast.success("Desafio enviado!");
      router.navigate({ to: "/batalha/$id", params: { id: battleId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const acceptM = useMutation({
    mutationFn: (battleId: string) => accept({ data: { battleId } }),
    onSuccess: () => { toast.success("Batalha aceita!"); battlesQ.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <main className="relative z-10 min-h-screen px-4 py-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Swords className="w-6 h-6 text-fuchsia-400" />
          <h1 className="font-display text-2xl">Sala de Batalha</h1>
        </div>
        <Link to="/" className="text-xs text-muted-foreground">← Home</Link>
      </header>

      <p className="text-sm text-muted-foreground mb-4">
        Desafie outra equipe: 9 perguntas no destino escolhido. Quem somar mais pontos leva o pote de fichas.
      </p>

      {myTeam ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Link
            to="/pilotos"
            className="px-3 py-3 rounded-xl glass border border-white/10 text-center font-display text-sm flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-cyan-300" /> Buscar Equipes
          </Link>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-3 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-700 text-white font-display text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Convocar p/ Batalha
          </button>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-xl glass text-sm">
          Você precisa de uma equipe. <Link to="/equipes" className="underline">Criar equipe →</Link>
        </div>
      )}

      {showForm && myTeam && (
        <div className="mb-6 p-4 rounded-xl glass space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Equipe adversária</span>
            <select value={opponent} onChange={(e) => setOpponent(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-sm">
              <option value="">Selecionar...</option>
              {(teamsQ.data ?? []).filter((t) => t.id !== myTeam.id).map((t) => (
                <option key={t.id} value={t.id}>{t.flag_emoji ?? "🛸"} {t.name} ({t.members_count})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Destino</span>
            <select value={dest} onChange={(e) => setDest(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-sm">
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Aposta (fichas)</span>
            <input type="number" min={0} max={10000} value={bet} onChange={(e) => setBet(Math.max(0, Number(e.target.value)))}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-sm" />
          </label>
          <button
            onClick={() => createM.mutate()}
            disabled={!opponent || createM.isPending}
            className="w-full px-4 py-2.5 rounded-lg bg-accent text-accent-foreground font-bold disabled:opacity-50"
          >
            {createM.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enviar desafio"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground px-1">Suas batalhas</h2>
        {battlesQ.isLoading && <div className="text-sm text-muted-foreground">Carregando...</div>}
        {(battlesQ.data?.battles ?? []).length === 0 && !battlesQ.isLoading && (
          <div className="text-sm text-muted-foreground p-3 glass rounded-xl">Nenhuma batalha ainda.</div>
        )}
        {(battlesQ.data?.battles ?? []).map((b: any) => {
          const isLeaderB = b.team_b?.leader_id === undefined; // unknown here; rely on accept attempt
          const canAccept = b.status === "pending" && b.team_b_id && myTeams.some((t) => t.id === b.team_b_id);
          return (
            <div key={b.id} className="p-3 rounded-xl glass flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-display truncate">
                  {b.team_a?.flag_emoji ?? "🛸"} {b.team_a?.name} <span className="text-muted-foreground">vs</span> {b.team_b?.flag_emoji ?? "🛸"} {b.team_b?.name ?? "—"}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="uppercase tracking-widest">{b.status}</span>
                  <span className="flex items-center gap-0.5"><Coins className="w-3 h-3 text-amber-400" /> {b.bet_fichas * 2}</span>
                  {b.status === "finished" && <span>· {b.team_a_score} – {b.team_b_score}</span>}
                </div>
              </div>
              {canAccept ? (
                <button onClick={() => acceptM.mutate(b.id)} disabled={acceptM.isPending}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold">Aceitar</button>
              ) : (
                <Link to="/batalha/$id" params={{ id: b.id }} className="p-2 rounded-lg bg-white/10">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
