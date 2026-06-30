import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Swords, Trophy, Coins, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getBattleFn, startBattleQuiz, submitBattleScore } from "@/lib/battles.functions";

export const Route = createFileRoute("/_authenticated/batalha/$id")({
  head: () => ({ meta: [{ title: "Batalha · Alien" }] }),
  component: BattleDetail,
});

type Question = { q: string; choices: string[] };

function BattleDetail() {
  const { id } = Route.useParams();
  const getB = useServerFn(getBattleFn);
  const startQ = useServerFn(startBattleQuiz);
  const submitQ = useServerFn(submitBattleScore);

  const battleQ = useQuery({ queryKey: ["battle", id], queryFn: () => getB({ data: { battleId: id } }), refetchInterval: 5000 });

  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);

  const startM = useMutation({
    mutationFn: () => startQ({ data: { battleId: id } }),
    onSuccess: ({ questions }) => { setQuiz(questions); setAnswers([]); setIdx(0); },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitM = useMutation({
    mutationFn: (final: number[]) => submitQ({ data: { battleId: id, answers: final } }),
    onSuccess: ({ score, finalized, winnerId }) => {
      toast.success(`Pontuação: ${score}/9`);
      setQuiz(null);
      battleQ.refetch();
      if (finalized) {
        toast.success(winnerId ? "Batalha finalizada — vencedor definido!" : "Empate! Fichas devolvidas.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (battleQ.isLoading || !battleQ.data) {
    return <main className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></main>;
  }

  const { battle, destination, mySubmission, participants } = battleQ.data as any;

  return (
    <main className="relative z-10 min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-4">
        <Link to="/batalha" className="text-xs text-muted-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Sala de batalha
        </Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-accent">{battle.status}</span>
      </header>

      <div className="p-4 rounded-2xl glass mb-4 text-center">
        <Swords className="w-8 h-8 text-fuchsia-400 mx-auto mb-2" />
        <div className="font-display text-lg">
          {battle.team_a?.flag_emoji} {battle.team_a?.name}
          <span className="text-muted-foreground mx-2">vs</span>
          {battle.team_b?.flag_emoji} {battle.team_b?.name}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{destination?.name ?? battle.destination_key}</div>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-amber-300">
          <Coins className="w-4 h-4" /> Pote: {battle.bet_fichas * 2} fichas
        </div>
        {battle.status === "finished" && (
          <div className="mt-3 flex items-center justify-center gap-2 text-emerald-400">
            <Trophy className="w-5 h-5" />
            {battle.winner_team_id === battle.team_a_id ? battle.team_a?.name :
             battle.winner_team_id === battle.team_b_id ? battle.team_b?.name : "Empate"}
            <span className="text-xs text-muted-foreground">({battle.team_a_score} – {battle.team_b_score})</span>
          </div>
        )}
      </div>

      {/* Quiz state */}
      {battle.status === "active" && !mySubmission && !quiz && (
        <button onClick={() => startM.mutate()} disabled={startM.isPending}
          className="w-full px-4 py-3 rounded-xl bg-accent text-accent-foreground font-display font-bold">
          {startM.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Iniciar minhas 9 perguntas"}
        </button>
      )}

      {battle.status === "active" && mySubmission && (
        <div className="p-3 rounded-xl glass text-sm text-center text-emerald-400">
          Você já enviou: {mySubmission.score}/9. Aguardando os demais...
        </div>
      )}

      {quiz && (
        <div className="p-4 rounded-2xl glass">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Pergunta {idx + 1}/9
          </div>
          <div className="font-display text-base mb-3">{quiz[idx].q}</div>
          <div className="space-y-2">
            {quiz[idx].choices.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  const next = [...answers, i];
                  setAnswers(next);
                  if (idx + 1 >= quiz.length) {
                    submitM.mutate(next);
                  } else {
                    setIdx(idx + 1);
                  }
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
              >
                {String.fromCharCode(65 + i)}. {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="mt-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Participantes ({participants.length})</h2>
        <div className="space-y-1">
          {participants.map((p: any) => (
            <div key={p.id} className="px-3 py-2 rounded-lg glass text-xs flex justify-between">
              <span className="font-mono">{p.user_id.slice(0, 8)}</span>
              <span className={p.score != null ? "text-emerald-400" : "text-muted-foreground"}>
                {p.score != null ? `${p.score}/9` : "aguardando"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
