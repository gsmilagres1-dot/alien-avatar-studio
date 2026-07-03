import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Rocket, Sparkles, X, Check, XCircle, Star, Radio, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import {
  SPACE_OBJECTS,
  SPACE_MAP_UNLOCK_THRESHOLD,
  type SpaceObject,
  type SpaceQuestion,
} from "@/lib/space-objects";
import { getMyVisaCount } from "@/lib/space-map.functions";
import sunImg from "@/assets/map/sun.png";
import planetImg from "@/assets/map/planet.png";
import moonImg from "@/assets/map/moon.png";
import galaxyImg from "@/assets/map/galaxy.png";
import clusterImg from "@/assets/map/cluster.png";
import quasarImg from "@/assets/map/quasar.png";
import spaceSealsImg from "@/assets/space-achievement-seals.jpg";

const KIND_IMAGE: Record<SpaceObject["kind"], string> = {
  star: sunImg,
  asteroid: planetImg,
  comet: quasarImg,
  meteor: clusterImg,
  dwarf: moonImg,
  spacecraft: galaxyImg,
};

const KIND_LABEL: Record<SpaceObject["kind"], string> = {
  star: "Estrela",
  asteroid: "Asteroide",
  comet: "Cometa",
  meteor: "Meteoro",
  dwarf: "Planeta anão",
  spacecraft: "Nave / Sonda",
};

interface SpaceNode extends SpaceObject {
  x: number;
  y: number;
  size: number;
}

function hashId(id: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildNodes(objects: SpaceObject[]): SpaceNode[] {
  const cols = 3;
  const rows = Math.ceil(objects.length / cols);
  const stepX = 100 / (cols + 1);
  const stepY = 100 / (rows + 1);

  const sizeFor = (kind: SpaceObject["kind"]) => {
    if (kind === "star" || kind === "spacecraft") return 20;
    if (kind === "comet" || kind === "meteor") return 17;
    return 15;
  };

  return objects.map((obj, index) => {
    const row = Math.floor(index / cols);
    const colInRow = index % cols;
    const leftToRight = row % 2 === 0;
    const col = leftToRight ? colInRow : cols - 1 - colInRow;
    const h = hashId(obj.id);
    const jitterX = (((h % 100) / 100) - 0.5) * 7;
    const jitterY = ((((h >>> 8) % 100) / 100) - 0.5) * 2.4;

    return {
      ...obj,
      x: stepX * (col + 1) + jitterX,
      y: stepY * (row + 1) + jitterY,
      size: sizeFor(obj.kind),
    };
  });
}

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
  const [quizObject, setQuizObject] = useState<SpaceObject | null>(null);
  const [zoom, setZoom] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCount().then((r) => setVisaCount(r.count)).catch(() => setVisaCount(0));
  }, [fetchCount]);

  const locked = (visaCount ?? 0) < SPACE_MAP_UNLOCK_THRESHOLD;
  const nodes = useMemo(() => buildNodes(SPACE_OBJECTS), []);
  const visible = useMemo(
    () => kindFilter === "all" ? nodes : nodes.filter((o) => o.kind === kindFilter),
    [kindFilter, nodes],
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

  const posterRatio = 2.8;

  return (
    <section className="mt-6">
      <header className="mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="font-display text-lg text-gradient-neon">Mapa Espacial · 55 objetivos</h2>
          {locked ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-input/70 text-muted-foreground border border-border">
              <Lock className="w-3 h-3" /> Bloqueado
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/40">
              <Check className="w-3 h-3" /> Liberado
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Mesmo padrão do mapa intergaláctico: arraste, dê zoom, toque no objetivo e faça o quiz após {SPACE_MAP_UNLOCK_THRESHOLD}/{SPACE_MAP_UNLOCK_THRESHOLD} destinos.
        </p>
        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${Math.min(100, ((visaCount ?? 0) / SPACE_MAP_UNLOCK_THRESHOLD) * 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>selos: {visaCount ?? "…"}/{SPACE_MAP_UNLOCK_THRESHOLD}</span>
          {locked && <span>faltam {Math.max(0, SPACE_MAP_UNLOCK_THRESHOLD - (visaCount ?? 0))}</span>}
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-3 items-center" role="tablist">
        <div className="flex flex-wrap gap-1.5">
          {kinds.map((k) => (
            <button
              key={k.id}
              onClick={() => setKindFilter(k.id)}
              className={`text-[10px] px-2 py-1 rounded-full border transition ${
                kindFilter === k.id
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-transparent text-muted-foreground border-accent/30 hover:border-accent/60"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs">
          <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
            className="p-1.5 rounded-md border border-accent/30 hover:border-accent" aria-label="Diminuir zoom do mapa espacial">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono w-10 text-center text-[11px]">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.4, +(z + 0.2).toFixed(2)))}
            className="p-1.5 rounded-md border border-accent/30 hover:border-accent" aria-label="Aumentar zoom do mapa espacial">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded-md border border-accent/30 hover:border-accent" aria-label="Encaixar mapa espacial">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
            aspectRatio: `1 / ${posterRatio}`,
            position: "relative",
            margin: "0 auto",
            transition: "width 200ms ease",
          }}
        >
          <div aria-hidden className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(1px 1px at 20% 8%, #fff 99%, transparent), radial-gradient(1px 1px at 70% 14%, #fff 99%, transparent), radial-gradient(1px 1px at 35% 22%, #cbd5e1 99%, transparent), radial-gradient(1.5px 1.5px at 85% 30%, #fff 99%, transparent), radial-gradient(1px 1px at 12% 42%, #fff 99%, transparent), radial-gradient(1px 1px at 55% 50%, #cbd5e1 99%, transparent), radial-gradient(1px 1px at 78% 58%, #fff 99%, transparent), radial-gradient(1.5px 1.5px at 28% 66%, #fff 99%, transparent), radial-gradient(1px 1px at 60% 74%, #cbd5e1 99%, transparent), radial-gradient(1px 1px at 90% 82%, #fff 99%, transparent), radial-gradient(1px 1px at 18% 90%, #fff 99%, transparent), radial-gradient(1px 1px at 48% 96%, #cbd5e1 99%, transparent)",
            }}
          />

          <svg viewBox="0 0 100 280" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="space-trail" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {visible.length > 1 && (
              <path
                d={visible.map((n, i) => `${i === 0 ? "M" : "L"} ${n.x} ${(n.y / 100) * 280}`).join(" ")}
                fill="none"
                stroke="url(#space-trail)"
                strokeWidth="0.4"
                strokeDasharray="1.2 1.5"
              />
            )}
          </svg>

          {visible.map((node) => {
            const src = KIND_IMAGE[node.kind];
            const isSelected = selected?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelected(node)}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${node.x}%`, top: `${node.y}%`, width: `${node.size}%` }}
                aria-label={node.name}
              >
                <div className="relative aspect-square">
                  <img
                    src={src}
                    alt={node.name}
                    loading="lazy"
                    className={`w-full h-full object-contain drop-shadow-[0_0_18px_rgba(167,139,250,0.55)] transition-transform group-hover:scale-110 ${isSelected ? "scale-110" : ""} ${locked ? "grayscale opacity-55" : ""}`}
                  />
                  {isSelected && <div className="absolute inset-0 rounded-full ring-2 ring-accent animate-pulse" />}
                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-accent drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    </div>
                  )}
                </div>
                <div className={`mt-0.5 text-center text-[9px] leading-tight font-mono px-1 truncate ${isSelected ? "text-accent" : "text-foreground/85"}`}>
                  {locked ? "???" : node.name}
                </div>
              </button>
            );
          })}

          <div
            className="absolute -translate-x-1/2 -translate-y-full text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none"
            style={{ left: `${visible[0]?.x ?? 50}%`, top: `${visible[0]?.y ?? 8}%` }}
            aria-label="Nave do mapa espacial"
            title="Nave do mapa espacial"
          >
            🚀
          </div>
        </div>
      </div>

      <div className="mt-3 glass rounded-xl p-4 border border-accent/20 min-h-[96px]">
        {selected ? (
          <div className="flex gap-3">
            <img
              src={KIND_IMAGE[selected.kind]}
              alt=""
              loading="lazy"
              className="w-16 h-16 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(167,139,250,0.6)]"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-sm truncate">{locked ? "Objetivo bloqueado" : selected.name}</h3>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-auto shrink-0">
                  {KIND_LABEL[selected.kind]}
                </span>
              </div>
              <p className="text-xs text-foreground/70 line-clamp-2">
                {locked ? `Libera com ${SPACE_MAP_UNLOCK_THRESHOLD}/${SPACE_MAP_UNLOCK_THRESHOLD} destinos do mapa principal.` : selected.fact}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => locked ? toast.info(`Complete os ${SPACE_MAP_UNLOCK_THRESHOLD} destinos para liberar este quiz.`) : setQuizObject(selected)}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-bold"
                >
                  <Rocket className="w-3 h-3" /> Ir fazer o quiz
                </button>
                <span className="text-[10px] text-muted-foreground">15 perguntas no banco · 9 sorteadas</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">
            <Rocket className="w-4 h-4 inline mr-1 text-accent" />
            Toque num objetivo do mapa para ver detalhes.
          </p>
        )}
      </div>

      <div className="mt-3 glass rounded-xl p-4 border border-accent/20 flex items-center gap-3">
        <img
          src={spaceSealsImg}
          alt="Selos de conquistas do mapa espacial"
          loading="lazy"
          className="w-16 h-16 rounded-lg object-cover object-top border border-accent/30 shrink-0"
        />
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Selos do novo mapa</div>
          <div className="font-display text-sm text-gradient-neon">Emblemas de conquistas espaciais</div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Usados como selos dos objetivos concluídos neste mapa, seguindo o padrão de conquistas do aplicativo.
          </p>
        </div>
      </div>

      {quizObject && (
        <SpaceQuiz object={quizObject} onClose={() => setQuizObject(null)} />
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

  const objectImage = KIND_IMAGE[object.kind];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-accent/40 max-h-[90vh] overflow-y-auto">
        <header className="p-3 flex items-center gap-2 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur z-10">
          <img src={objectImage} alt="" className="w-9 h-9 object-contain" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-accent">{KIND_LABEL[object.kind]}</div>
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
                    className="rounded-lg border border-accent/40 bg-accent/10 hover:bg-accent/20 py-3 text-xs font-semibold"
                  >
                    {lvl === 1 ? "Fácil" : lvl === 2 ? "Médio" : "Difícil"}
                    <div className="flex justify-center gap-0.5 mt-1">
                      {Array.from({ length: lvl }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-accent text-accent" />
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
              <div className="mt-3 text-center">
                <a
                  href="#sos"
                  onClick={(e) => { e.preventDefault(); toast.info("SOS disponível para voltar a pergunta usando fichas."); }}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-200"
                >
                  <Radio className="w-3 h-3" /> SOS
                </a>
              </div>
            </>
          )}

          {showResult && (
            <div className="text-center py-4">
              <img
                src={spaceSealsImg}
                alt="Selo de conquista do mapa espacial"
                loading="lazy"
                className="w-20 h-20 mx-auto mb-2 rounded-xl object-cover object-top border border-accent/30"
              />
              <p className="font-display text-lg">{score}/{questions.length} acertos</p>
              <p className="text-xs text-muted-foreground mt-1">
                {score >= 7 ? "Excelente! Você domina este objeto." : score >= 5 ? "Boa! Vale revisar os detalhes." : "Continue explorando — a galáxia é vasta."}
              </p>
              <div className="mt-4 flex gap-2 justify-center">
                <button
                  onClick={() => { setDifficulty(null); setShowResult(false); }}
                  className="text-xs px-3 py-2 rounded-lg border border-accent/40 hover:bg-accent/15"
                >
                  Tentar outra dificuldade
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
