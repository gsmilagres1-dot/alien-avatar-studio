import { useState } from "react";
import { Film, X, Check, XCircle, RotateCcw, Sparkles } from "lucide-react";
import { CINEMA_TITLES, shuffleQuestions, type CinemaTitle, type CinemaQuestion } from "@/lib/cinema-quiz";

const CATEGORY_LABEL: Record<CinemaTitle["category"], string> = {
  aliens: "Alienígenas",
  "espaço": "Espaço",
  tempo: "Viagem no tempo",
  fantasia: "Fantasia",
  "animação": "Animação",
};

export function CinemaMapPanel() {
  const [active, setActive] = useState<CinemaTitle | null>(null);

  return (
    <section className="mt-8">
      <header className="mb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg text-gradient-neon">
            Mapa 3 · Cinema Cósmico 🎥
          </h2>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40">
            <Sparkles className="w-3 h-3" /> Livre
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Quiz de cultura geral de cinema e séries sobre aliens, espaço, ficção científica e viagens no tempo.
          Livre para todos os pilotos singulares — sem prêmios, sem selos, só diversão. 5 perguntas por título.
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CINEMA_TITLES.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t)}
            className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-accent/30 bg-gradient-to-br from-black/70 via-purple-950/50 to-black/70 hover:border-accent transition text-left p-3 flex flex-col"
          >
            <div className="text-4xl leading-none drop-shadow-[0_0_10px_rgba(167,139,250,0.7)]" aria-hidden>
              {t.emoji}
            </div>
            <div className="mt-auto">
              <div className="text-[9px] uppercase tracking-widest text-accent/80 font-mono">
                {CATEGORY_LABEL[t.category]}
              </div>
              <div className="font-display text-xs leading-tight text-foreground">
                {t.title}
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none bg-accent/0 group-hover:bg-accent/5 transition" />
          </button>
        ))}
      </div>

      {active && <CinemaQuizModal title={active} onClose={() => setActive(null)} />}
    </section>
  );
}

// ============ Quiz modal (livre, sem servidor) ============
function CinemaQuizModal({ title, onClose }: { title: CinemaTitle; onClose: () => void }) {
  const [questions, setQuestions] = useState<CinemaQuestion[]>(() => shuffleQuestions(title.questions));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const restart = () => {
    setQuestions(shuffleQuestions(title.questions));
    setIdx(0);
    setPicked(null);
    setAnswers([]);
    setDone(false);
  };

  const submit = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => {
      const next = [...answers, i];
      setAnswers(next);
      setPicked(null);
      if (idx + 1 >= questions.length) setDone(true);
      else setIdx(idx + 1);
    }, 1100);
  };

  const current = questions[idx];
  const score = answers.filter((a, k) => a === questions[k]?.answer).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-accent/40 max-h-[90vh] overflow-y-auto">
        <header className="p-3 flex items-center gap-2 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur z-10">
          <span aria-hidden className="text-2xl leading-none">{title.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-accent">
              {CATEGORY_LABEL[title.category]}
            </div>
            <div className="font-display text-sm truncate">{title.title}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4">
          {!done && current && (
            <>
              <p className="text-[11px] italic text-muted-foreground mb-3">{title.tagline}</p>
              <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-muted-foreground">
                <span>Pergunta {idx + 1}/{questions.length}</span>
                <span>Acertos: {score}</span>
              </div>
              <div className="h-1 rounded-full bg-black/50 mb-3 overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${(idx / questions.length) * 100}%` }} />
              </div>
              <p className="text-sm mb-3 font-medium">{current.q}</p>
              <div className="grid gap-2">
                {current.options.map((opt, i) => {
                  const isCorrect = i === current.answer;
                  const revealed = picked !== null;
                  const highlight = revealed
                    ? isCorrect
                      ? "border-emerald-400 bg-emerald-500/20"
                      : i === picked
                        ? "border-red-400 bg-red-500/20"
                        : "border-white/10 opacity-60"
                    : "border-white/15 hover:border-accent/60";
                  return (
                    <button
                      key={i}
                      onClick={() => submit(i)}
                      disabled={revealed}
                      className={`text-left text-xs px-3 py-2 rounded-lg border ${highlight} transition flex items-center gap-2`}
                    >
                      <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {revealed && isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                      {revealed && !isCorrect && i === picked && <XCircle className="w-4 h-4 text-red-400" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {done && (
            <div className="text-center py-4">
              <div className="text-5xl mb-2" aria-hidden>{title.emoji}</div>
              <p className="font-display text-2xl">{score}/{questions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {score === questions.length
                  ? "Nerdão oficial! Passa manteiga na pipoca."
                  : score >= 3
                    ? "Boa! Dá pra debater no cinema sem passar vergonha."
                    : "Bora ver o filme de novo — vale a maratona."}
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={restart}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-accent/40 hover:bg-accent/15"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Refazer
                </button>
                <button
                  onClick={onClose}
                  className="text-xs px-3 py-2 rounded-lg bg-accent text-accent-foreground font-bold"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
