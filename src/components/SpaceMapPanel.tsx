import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Rocket, Sparkles, X, Check, XCircle, Star, Radio } from "lucide-react";
import {
  SPACE_OBJECTS,
  SPACE_MAP_UNLOCK_THRESHOLD,
  type SpaceObject,
  type SpaceQuestion,
} from "@/lib/space-objects";
import { getMyVisaCount } from "@/lib/space-map.functions";

// Ícones/estilos por tipo — visual escuro mesclado
const KIND_STYLE: Record<SpaceObject["kind"], { emoji: string; ring: string }> = {
  star:       { emoji: "⭐", ring: "ring-yellow-300/60" },
  asteroid:   { emoji: "🪨", ring: "ring-stone-400/60" },
  comet:      { emoji: "☄️", ring: "ring-cyan-300/60" },
  meteor:     { emoji: "🌠", ring: "ring-orange-300/60" },
  dwarf:      { emoji: "🌑", ring: "ring-indigo-300/60" },
  spacecraft: { emoji: "🚀", ring: "ring-fuchsia-300/60" },
};

const KIND_LABEL: Record<SpaceObject["kind"], string> = {
  star: "Estrela",
  asteroid: "Asteroide",
  comet: "Cometa",
  meteor: "Meteoro",
  dwarf: "Planeta anão",
  spacecraft: "Nave / Sonda",
};

/** Sorteia 9 perguntas da lista filtradas por dificuldade (fallback: quaisquer 9). */
function pickQuestions(all: SpaceQuestion[], level: 1 | 2 | 3): SpaceQuestion[] {
  const byLevel = all.filter((q) => q.level === level);
  const pool = byLevel.length >= 9 ? byLevel : all;
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 9);
}

export function SpaceMapPanel() {
  const fetchCount = useServerFn(getMyVisaCount);
  const [visaCount, setVisaCount] = useState<number | null>(null);
  const [kindFilter, setKindFilter] = useState<SpaceObject["kind"] | "all">("all");
  const [selected, setSelected] = useState<SpaceObject | null>(null);

  useEffect(() => {
    fetchCount().then((r) => setVisaCount(r.count)).catch(() => setVisaCount(0));
  }, [fetchCount]);

  const locked = (visaCount ?? 0) < SPACE_MAP_UNLOCK_THRESHOLD;
  const filtered = useMemo(() =>
    kindFilter === "all" ? SPACE_OBJECTS : SPACE_OBJECTS.filter((o) => o.kind === kindFilter),
    [kindFilter],
  );

  const kinds: Array<{ id: SpaceObject["kind"] | "all"; label: string }> = [
    { id: "all", label: `Todos (${SPACE_OBJECTS.length})` },
    { id: "star", label: "Estrelas" },
    { id: "asteroid", label: "Asteroides" },
    { id: "comet", label: "Cometas" },
    { id: "meteor", label: "Meteoros" },
    { id: "dwarf", label: "Anões" },
    { id: "spacecraft", label: "Naves/Sondas" },
  ];

  return (
    <section className="mt-6 glass rounded-2xl border border-fuchsia-400/30 overflow-hidden">
      <header className="p-4 bg-gradient-to-r from-fuchsia-500/15 via-cyan-500/10 to-transparent">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fuchsia-300" />
          <h2 className="font-display text-lg text-fuchsia-200">Mapa Espacial · Bônus</h2>
          {locked ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/40">
              <Lock className="w-3 h-3" /> Bloqueado
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
              <Check className="w-3 h-3" /> Liberado
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          {SPACE_OBJECTS.length} objetos · 15 perguntas cada · desbloqueia ao completar os {SPACE_MAP_UNLOCK_THRESHOLD} destinos.
        </p>
        <div className="mt-2 h-2 rounded-full bg-black/40 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-300"
            style={{ width: `${Math.min(100, ((visaCount ?? 0) / SPACE_MAP_UNLOCK_THRESHOLD) * 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>selos: {visaCount ?? "…"}/{SPACE_MAP_UNLOCK_THRESHOLD}</span>
          {locked && <span>faltam {Math.max(0, SPACE_MAP_UNLOCK_THRESHOLD - (visaCount ?? 0))}</span>}
        </div>
      </header>

      <div className="p-3">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {kinds.map((k) => (
            <button
              key={k.id}
              onClick={() => setKindFilter(k.id)}
              disabled={locked}
              className={`text-[10px] px-2 py-1 rounded-full border transition ${
                kindFilter === k.id
                  ? "bg-fuchsia-400/80 text-black border-fuchsia-300"
                  : "bg-transparent text-foreground/70 border-white/15 hover:border-fuchsia-300/60"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {filtered.map((obj) => {
            const style = KIND_STYLE[obj.kind];
            return (
              <button
                key={obj.id}
                onClick={() => !locked && setSelected(obj)}
                disabled={locked}
                className={`group relative aspect-square rounded-xl border border-white/10 bg-gradient-to-b from-black/60 to-fuchsia-950/40 p-2 flex flex-col items-center justify-center gap-1 ring-1 ${style.ring} hover:scale-[1.03] transition ${locked ? "cursor-not-allowed opacity-60" : ""}`}
                aria-label={obj.name}
              >
                <div className="text-2xl">{style.emoji}</div>
                <div className="text-[9px] font-mono leading-tight text-center line-clamp-2 text-white/90">
                  {locked ? "???" : obj.name}
                </div>
                {locked && (
                  <Lock className="absolute top-1 right-1 w-3 h-3 text-fuchsia-300/70" />
                )}
              </button>
            );
          })}
        </div>

        {locked && (
          <p className="mt-3 text-[11px] text-center text-fuchsia-200/80">
            <Rocket className="w-3 h-3 inline mr-1" />
            Complete os {SPACE_MAP_UNLOCK_THRESHOLD} destinos para destravar o mapa e os quizzes bônus.
          </p>
        )}
      </div>

      {selected && (
        <SpaceQuiz object={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

// ============ Quiz modal ============
function SpaceQuiz({ object, onClose }: { object: SpaceObject; onClose: () => void }) {
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | null>(null);
  const [questions, setQuestions] = useState<SpaceQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const start = (lvl: 1 | 2 | 3) => {
    setDifficulty(lvl);
    setQuestions(pickQuestions(object.questions, lvl));
    setIdx(0);
    setAnswers([]);
    setPicked(null);
    setShowResult(false);
  };

  const current = questions[idx];
  const done = questions.length > 0 && idx >= questions.length;
  const score = answers.filter((a, i) => a === questions[i]?.answer).length;

  const submit = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => {
      setAnswers((a) => [...a, i]);
      setPicked(null);
      if (idx + 1 >= questions.length) setShowResult(true);
      else setIdx(idx + 1);
    }, 1200);
  };

  const style = KIND_STYLE[object.kind];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-gradient-to-b from-fuchsia-950/95 to-black rounded-2xl border border-fuchsia-400/40 max-h-[90vh] overflow-y-auto">
        <header className="p-3 flex items-center gap-2 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur z-10">
          <div className="text-2xl">{style.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-fuchsia-300">{KIND_LABEL[object.kind]}</div>
            <div className="font-display text-sm truncate">{object.name}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4">
          {!difficulty && (
            <>
              <p className="text-xs text-foreground/80 mb-3">{object.fact}</p>
              <p className="text-[11px] text-muted-foreground mb-3">
                Escolha a dificuldade — 9 perguntas sorteadas de um banco de 15.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => start(lvl)}
                    className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 hover:bg-fuchsia-500/25 py-3 text-xs font-semibold"
                  >
                    {lvl === 1 ? "Fácil" : lvl === 2 ? "Médio" : "Difícil"}
                    <div className="flex justify-center gap-0.5 mt-1">
                      {Array.from({ length: lvl }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-fuchsia-300 text-fuchsia-300" />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {difficulty && !showResult && current && (
            <>
              <div className="flex items-center justify-between mb-2 text-[10px] font-mono text-muted-foreground">
                <span>Pergunta {idx + 1}/{questions.length}</span>
                <span>Nível {difficulty}</span>
              </div>
              <div className="h-1 rounded-full bg-black/50 mb-3 overflow-hidden">
                <div className="h-full bg-fuchsia-400" style={{ width: `${(idx / questions.length) * 100}%` }} />
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
                    : "border-white/15 hover:border-fuchsia-300/60";
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
              <div className="mt-3 text-center">
                <a
                  href="#sos"
                  onClick={(e) => { e.preventDefault(); alert("SOS acionado! Um mentor será notificado."); }}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-200"
                >
                  <Radio className="w-3 h-3" /> SOS
                </a>
              </div>
            </>
          )}

          {showResult && (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">{score >= 7 ? "🏆" : score >= 5 ? "🥈" : "🥉"}</div>
              <p className="font-display text-lg">{score}/{questions.length} acertos</p>
              <p className="text-xs text-muted-foreground mt-1">
                {score >= 7 ? "Excelente! Você domina este objeto." : score >= 5 ? "Boa! Vale revisar os detalhes." : "Continue explorando — a galáxia é vasta."}
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => { setDifficulty(null); setShowResult(false); }}
                  className="text-xs px-3 py-2 rounded-lg border border-fuchsia-400/40 hover:bg-fuchsia-500/15"
                >
                  Tentar outra dificuldade
                </button>
                <button
                  onClick={onClose}
                  className="text-xs px-3 py-2 rounded-lg bg-fuchsia-400 text-black font-bold"
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
