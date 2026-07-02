import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, useRef } from "react";
import { Swords, Trophy, Coins, Loader2, ArrowLeft, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { getBattleFn, startBattleQuiz, submitBattleScore, expireBattleFn } from "@/lib/battles.functions";
import { TeamChat } from "@/components/TeamChat";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/batalha/$id")({
  head: () => ({ meta: [{ title: "Batalha · Alien" }] }),
  component: BattleDetail,
});

type Question = { q: string; choices: string[] };

function formatMs(ms: number) {
  if (ms <= 0) return "00:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function BattleDetail() {
  const { id } = Route.useParams();
  const getB = useServerFn(getBattleFn);
  const startQ = useServerFn(startBattleQuiz);
  const submitQ = useServerFn(submitBattleScore);
  const expireB = useServerFn(expireBattleFn);

  const battleQ = useQuery({ queryKey: ["battle", id], queryFn: () => getB({ data: { battleId: id } }), refetchInterval: 5000 });

  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then((r) => setUid(r.data.user?.id ?? null)); }, []);

  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const expiredCalled = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startM = useMutation({
    mutationFn: () => startQ({ data: { battleId: id } }),
    onSuccess: ({ questions }) => { setQuiz(questions); setAnswers([]); setIdx(0); },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitM = useMutation({
    mutationFn: (final: number[]) => submitQ({ data: { battleId: id, answers: final } }),
    onSuccess: ({ score, finalized, winnerId }) => {
      toast.success(`Lançado! Sua pontuação: ${score}/9`);
      setQuiz(null);
      battleQ.refetch();
      if (finalized) toast.success(winnerId ? "Batalha finalizada — vencedor definido!" : "Empate!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const expireM = useMutation({
    mutationFn: () => expireB({ data: { battleId: id } }),
    onSuccess: () => battleQ.refetch(),
    onError: () => { /* silent — the other side may have finalized first */ },
  });

  if (battleQ.isLoading || !battleQ.data) {
    return <main className="min-h-screen grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></main>;
  }

  const { battle, destination, mySubmission, participants, deadlineAt } = battleQ.data as {
    battle: {
      status: string; team_a_id: string; team_b_id: string; team_a_score: number; team_b_score: number;
      winner_team_id: string | null; bet_fichas: number; destination_key: string;
      team_a: { id: string; name: string; flag_emoji: string | null } | null;
      team_b: { id: string; name: string; flag_emoji: string | null } | null;
    };
    destination: { name: string } | null;
    mySubmission: { score: number | null } | null | undefined;
    participants: Array<{ id: string; user_id: string; team_id: string; score: number | null }>;
    deadlineAt: string | null;
  };

  const deadlineMs = deadlineAt ? new Date(deadlineAt).getTime() : null;
  const remaining = deadlineMs ? deadlineMs - now : null;
  const timedOut = remaining !== null && remaining <= 0;

  // Auto-expire when timer hits zero (only once, only during active state)
  useEffect(() => {
    if (battle.status === "active" && timedOut && !expiredCalled.current) {
      expiredCalled.current = true;
      // Auto-submit whatever the user answered so their partial score counts.
      if (quiz && !mySubmission) {
        const padded = [...answers, ...Array(9 - answers.length).fill(0)].slice(0, 9);
        submitM.mutate(padded);
      }
      // Give the server a moment, then force-finalize.
      setTimeout(() => expireM.mutate(), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut, battle.status]);

  const myTeamId = useMemo(() => {
    if (!uid) return null;
    const mine = participants.find((p) => p.user_id === uid);
    return mine?.team_id ?? null;
  }, [participants, uid]);

  const isFinished = battle.status === "finished";
  const teamA = participants.filter((p) => p.team_id === battle.team_a_id);
  const teamB = participants.filter((p) => p.team_id === battle.team_b_id);

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
          <Coins className="w-4 h-4" /> Pote: {battle.bet_fichas * 2} fichas · Prêmio ranking: +1000 pts
        </div>

        {battle.status === "active" && remaining !== null && (
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono ${
            remaining < 60_000 ? "bg-red-500/20 text-red-300 animate-pulse" : "bg-white/10 text-foreground"
          }`}>
            <Hourglass className="w-4 h-4" />
            {formatMs(remaining)} restantes
          </div>
        )}

        {isFinished && (
          <div className="mt-3 flex items-center justify-center gap-2 text-emerald-400">
            <Trophy className="w-5 h-5" />
            {battle.winner_team_id === battle.team_a_id ? battle.team_a?.name :
             battle.winner_team_id === battle.team_b_id ? battle.team_b?.name : "Empate"}
            <span className="text-xs text-muted-foreground">({battle.team_a_score} – {battle.team_b_score})</span>
          </div>
        )}
      </div>

      {/* Quiz state */}
      {battle.status === "active" && !mySubmission && !quiz && !timedOut && (
        <button onClick={() => startM.mutate()} disabled={startM.isPending}
          className="w-full px-4 py-3 rounded-xl bg-accent text-accent-foreground font-display font-bold">
          {startM.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Iniciar minhas 9 perguntas"}
        </button>
      )}

      {battle.status === "active" && mySubmission && !isFinished && (
        <div className="p-3 rounded-xl glass text-sm text-center text-emerald-400">
          Você já lançou: {mySubmission.score}/9. Aguardando os demais aliens…
        </div>
      )}

      {quiz && (
        <div className="p-4 rounded-2xl glass">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-between">
            <span>Pergunta {idx + 1}/9</span>
            <span className="text-muted-foreground">Ao terminar, sua resposta é lançada automaticamente</span>
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

      {/* Team Chat (available for active battles, for members of either team) */}
      {battle.status === "active" && myTeamId && (
        <div className="mt-4">
          <TeamChat teamId={myTeamId} currentUserId={uid ?? ""} />
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            Debata com sua equipe — o adversário só verá o resultado ao final.
          </p>
        </div>
      )}

      {/* Participants — hide opponent scores while active */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ParticipantsCol
          title={`${battle.team_a?.flag_emoji ?? ""} ${battle.team_a?.name ?? ""}`}
          rows={teamA}
          myTeam={myTeamId === battle.team_a_id}
          reveal={isFinished}
          currentUserId={uid}
        />
        <ParticipantsCol
          title={`${battle.team_b?.flag_emoji ?? ""} ${battle.team_b?.name ?? ""}`}
          rows={teamB}
          myTeam={myTeamId === battle.team_b_id}
          reveal={isFinished}
          currentUserId={uid}
        />
      </div>
    </main>
  );
}

function ParticipantsCol({
  title, rows, myTeam, reveal, currentUserId,
}: {
  title: string;
  rows: Array<{ id: string; user_id: string; score: number | null }>;
  myTeam: boolean; reveal: boolean; currentUserId: string | null;
}) {
  return (
    <div className="p-3 rounded-xl glass">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 truncate">{title}</div>
      <div className="space-y-1">
        {rows.length === 0 && <div className="text-[10px] text-muted-foreground">Sem envios</div>}
        {rows.map((p) => {
          const mine = p.user_id === currentUserId;
          const canSee = reveal || mine || myTeam;
          const submitted = p.score !== null;
          return (
            <div key={p.id} className="px-2 py-1 rounded bg-white/5 text-[11px] flex justify-between items-center">
              <span className="font-mono">{p.user_id.slice(0, 6)}</span>
              <span className={submitted ? "text-emerald-400" : "text-muted-foreground"}>
                {!submitted ? "…" : canSee ? `${p.score}/9` : "🔒"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
