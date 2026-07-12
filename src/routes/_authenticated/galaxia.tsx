import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Rocket, Stamp, MapPin, AlertTriangle, Sparkles, Skull, Check, ArrowRight, Plus, Wand2, Sun, Moon, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { listMyIdentities, generateShipImage } from "@/lib/identities.functions";
import { getJourneyState, startQuiz, submitQuiz, claimVisa } from "@/lib/intergalactic.functions";
import { DESTINATIONS, ALL_DESTINATIONS, getAnyDestination, MAX_QUIZ_ATTEMPTS, KIND_LABEL, TELEPORTER_THRESHOLD, TELESCOPE_JIMMY_WATH_THRESHOLD, WORMHOLE_SURPRISE_THRESHOLD, type Destination } from "@/lib/intergalactic";
import { SHIPS } from "@/lib/alien";
import { DestinationBadge } from "@/components/DestinationBadge";
import { TeleporterPrize } from "@/components/TeleporterPrize";
import { WormholePrize } from "@/components/WormholePrize";
import { WormholeSurprisePrize } from "@/components/WormholeSurprisePrize";
import { TelescopePrize } from "@/components/TelescopePrize";
import { SOSButton } from "@/components/SOSButton";

import { WalletBadge } from "@/components/WalletBadge";
import shipEsportiva from "@/assets/ship-esportiva.jpg";
import shipOffroad from "@/assets/ship-offroad.jpg";
import shipCorrida from "@/assets/ship-corrida.jpg";

const SHIP_PREVIEWS: Record<"esportiva" | "offroad" | "corrida", string> = {
  esportiva: shipEsportiva,
  offroad: shipOffroad,
  corrida: shipCorrida,
};

export const Route = createFileRoute("/_authenticated/galaxia")({
  validateSearch: (s: Record<string, unknown>) => ({
    identityId: typeof s.identityId === "string" ? s.identityId : undefined,
  }),
  component: Galaxia,
});

interface Question { q: string; choices: string[]; answer?: number; level?: number }
const LEVEL_LABEL: Record<number, string> = { 1: "Fácil", 2: "Médio", 3: "Difícil" };

function KindIcon({ kind, className }: { kind: Destination["kind"]; className?: string }) {
  if (kind === "sun") return <Sun className={className} />;
  if (kind === "moon") return <Moon className={className} />;
  return <Globe2 className={className} />;
}

function Galaxia() {
  const navigate = useNavigate();
  const { identityId } = Route.useSearch();
  const qc = useQueryClient();
  const listFn = useServerFn(listMyIdentities);
  const stateFn = useServerFn(getJourneyState);
  const quizStartFn = useServerFn(startQuiz);
  const quizSubmitFn = useServerFn(submitQuiz);
  const claimVisaFn = useServerFn(claimVisa);
  
  const shipFn = useServerFn(generateShipImage);

  const { data: ids, isLoading: idsLoading } = useQuery({
    queryKey: ["identities"], queryFn: () => listFn(),
  });

  const { data: state, isLoading: stateLoading } = useQuery({
    queryKey: ["journey", identityId],
    queryFn: () => stateFn({ data: { identityId: identityId! } }),
    enabled: !!identityId,
  });

  const [chosenDestId, setChosenDestId] = useState<string | null>(null);
  const [chosenDifficulty, setChosenDifficulty] = useState<1 | 2 | 3 | null>(null);
  const [quiz, setQuiz] = useState<{ questions: Question[]; level: number; destinationId: string; destinationName: string; difficulty: 1 | 2 | 3 | null } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ passed: boolean; score: number; attemptsLeft: number; fatal: { name: string; transport: string } | null; tier: "bronze" | "silver" | "gold" | null; fichasEarned?: number } | null>(null);
  const [review, setReview] = useState<number[] | null>(null);
  const [shipCategory, setShipCategory] = useState<"esportiva" | "offroad" | "corrida">("esportiva");
  const [shipLoading, setShipLoading] = useState(false);
  const [journeyStep, setJourneyStep] = useState<"passport" | "destination" | "ship">("passport");


  useEffect(() => {
    if (chosenDestId) setJourneyStep("ship");
    else setJourneyStep("passport");
  }, [chosenDestId]);

  if (idsLoading) return <Loader />;

  // Picker step
  if (!identityId) {
    const list = ids?.identities ?? [];
    if (list.length === 0) {
      return (
        <main className="px-4 py-10 max-w-2xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center">
            <Rocket className="w-10 h-10 text-accent mx-auto" />
            <h1 className="font-display text-2xl mt-3 text-gradient-neon">Área Intergaláctica</h1>
            <p className="text-sm text-muted-foreground mt-2">Você precisa de uma identidade alienígena antes de viajar.</p>
            <Link to="/criar" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-neon">
              <Plus className="w-3.5 h-3.5" /> Criar identidade (grátis)
            </Link>
          </div>
        </main>
      );
    }
    return (
      <main className="px-4 py-8 max-w-4xl mx-auto">
        <h1 className="font-display text-2xl text-gradient-neon mb-2">Escolha a identidade que vai viajar</h1>
        <p className="text-sm text-muted-foreground mb-6">Cada identidade tem sua própria viagem 100% grátis.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((i) => (
            <button key={i.id} onClick={() => navigate({ to: "/galaxia", search: { identityId: i.id } })}
              className="glass rounded-2xl overflow-hidden text-left hover:ring-2 hover:ring-accent transition">
              <img src={i.avatar_url} alt={i.alien_name} className="w-full aspect-square object-cover object-[center_25%]" />
              <div className="p-4">
                <div className="font-display text-lg text-gradient-neon">{i.alien_name}</div>
                <div className="text-xs text-muted-foreground">{i.species}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (stateLoading || !state) return <Loader />;

  const { journey, passport, visas, identity } = state;
  const visitedIds = new Set(visas.map((v) => v.destination_id));
  const remaining = ALL_DESTINATIONS.filter((d) => !visitedIds.has(d.id));
  const currentDest = chosenDestId ? getAnyDestination(chosenDestId) ?? null : null;
  const attemptsLeft = MAX_QUIZ_ATTEMPTS - journey.attempts_used;

  // Journey lost
  if (journey.status !== "active") {
    const fatal = journey.final_destination_kind === "fatal";
    return (
      <main className="px-4 py-10 max-w-2xl mx-auto">
        <div className={`glass rounded-2xl p-8 text-center ${fatal ? "border-2 border-destructive" : "border-2 border-accent"}`}>
          {fatal ? <Skull className="w-12 h-12 text-destructive mx-auto" /> : <Sparkles className="w-12 h-12 text-accent mx-auto" />}
          <h1 className="font-display text-2xl mt-3">Perdido no espaço</h1>
          <p className="text-sm mt-2">
            {identity?.alien_name} {fatal ? "acabou em" : "chegou em"}{" "}
            <span className="font-bold text-gradient-neon">{journey.final_destination_name}</span>
          </p>
          {!fatal && visas.length >= TELEPORTER_THRESHOLD && (
            <div className="mt-6">
              <TeleporterPrize visitedCount={visas.length} totalCount={TELEPORTER_THRESHOLD} variant="reward" />
            </div>
          )}
          {!fatal && visas.length >= 15 && (
            <div className="mt-4">
              <WormholePrize visitedCount={visas.length} variant="reward" />
            </div>
          )}
          {!fatal && (
            <div className="mt-4">
              <WormholeSurprisePrize visitedCount={visas.length} variant={visas.length >= WORMHOLE_SURPRISE_THRESHOLD ? "reward" : "banner"} />
            </div>
          )}
          {!fatal && (
            <div className="mt-4">
              <TelescopePrize visitedCount={visas.length} totalCount={TELESCOPE_JIMMY_WATH_THRESHOLD} variant={visas.length >= TELESCOPE_JIMMY_WATH_THRESHOLD ? "reward" : "banner"} />
            </div>
          )}

          {visas.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                Selos conquistados · painel da nave
              </div>
              <div className="flex flex-wrap gap-3 justify-center rounded-2xl border border-accent/30 bg-black/30 p-4">
                {visas.map((v) => (
                  <DestinationBadge
                    key={v.id}
                    destinationId={v.destination_id}
                    destinationName={v.destination_name}
                    tier={(v.tier ?? "bronze") as "bronze" | "silver" | "gold"}
                    size={80}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/criar" className="px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-neon">
              Nova identidade (grátis) → nova viagem
            </Link>
            <Link to="/galeria" className="text-xs text-muted-foreground hover:underline">
              Ver na galeria
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!passport) return <Loader />;

  // Ship is optional — user can generate it anytime from the journey panel

  // Active quiz
  if (quiz) {
    const allAnswered = answers.length === quiz.questions.length && answers.every((a) => a !== undefined);
    return (
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-xs text-muted-foreground">Quiz da viagem · {quiz.destinationName}</div>
            <h1 className="font-display text-xl text-gradient-neon mt-1">
              9 perguntas · {quiz.difficulty ? LEVEL_LABEL[quiz.difficulty] : "3 níveis"}
            </h1>
            <p className="text-xs text-muted-foreground">Acerte 60% (6/9) para embarcar. {MAX_QUIZ_ATTEMPTS - journey.attempts_used} chance(s).</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <WalletBadge />
            <SOSButton
              cost={25}
              reason="sos_voltar_pergunta_quiz"
              label="Resposta errada"
              meta={{ destinationId: quiz.destinationId }}
              onSuccess={() => {
                // Remove a última resposta marcada para o jogador refazer
                if (answers.length === 0) { toast.info("Nada para desfazer ainda."); return; }
                const next = [...answers]; next.pop(); setAnswers(next);
              }}
            />
          </div>
        </div>
        <div className="space-y-5">
          {quiz.questions.map((q, qi) => {
            const picked = answers[qi];
            const locked = picked !== undefined;
            const prev = qi > 0 ? quiz.questions[qi - 1].level : undefined;
            const showHeader = q.level && q.level !== prev;
            return (
              <div key={qi}>
                {showHeader && (
                  <div className="mt-4 mb-2 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${q.level === 1 ? "bg-green-500/20 text-green-400" : q.level === 2 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                      Nível {q.level} · {LEVEL_LABEL[q.level!]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">3 perguntas</span>
                  </div>
                )}
                <div className="glass rounded-xl p-4">
                <div className="text-sm font-medium mb-3">{qi + 1}. {q.q}</div>
                <div className="space-y-2">
                  {q.choices.map((c, ci) => {
                    const isPicked = picked === ci;
                    const correctIdx = review?.[qi] ?? q.answer;
                    const reviewing = picked !== undefined && correctIdx !== undefined;
                    const isCorrect = reviewing && ci === correctIdx;
                    const isWrongPick = reviewing && isPicked && ci !== correctIdx;
                    let cls = "border-border hover:bg-accent/5";
                    if (reviewing) {
                      if (isCorrect) cls = "border-green-500 bg-green-500/15 text-green-300";
                      else if (isWrongPick) cls = "border-red-500 bg-red-500/15 text-red-300 line-through";
                      else cls = "border-border opacity-50";
                    } else if (locked) {
                      if (isPicked) cls = "border-accent bg-accent/10";
                      else cls = "border-border opacity-60";
                    }
                    return (
                      <button key={ci} disabled={locked || reviewing} onClick={() => {
                        if (locked) return;
                        const next = [...answers]; next[qi] = ci; setAnswers(next);
                      }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm border flex items-center justify-between gap-2 ${cls}`}>
                        <span>{c}</span>
                        {reviewing && isCorrect && <span className="text-[10px] font-bold">✓ correta</span>}
                        {reviewing && isWrongPick && <span className="text-[10px] font-bold">✗ sua resposta</span>}
                      </button>
                    );
                  })}
                </div>
                </div>
              </div>
            );
          })}
        </div>
        <button disabled={!allAnswered || quizLoading} onClick={async () => {
          setQuizLoading(true);
          try {
            const r = await quizSubmitFn({ data: { journeyId: journey.id, destinationId: quiz.destinationId, answers, ...(quiz.difficulty ? { difficulty: quiz.difficulty } : {}) } });
            setLastResult(r);
            await qc.invalidateQueries({ queryKey: ["journey", identityId] });
            await qc.invalidateQueries({ queryKey: ["wallet"] });
            setQuiz(null);
            setAnswers([]);
            setReview(null);
          } catch (e) { toast.error((e as Error).message); }
          finally { setQuizLoading(false); }
        }}
          className="mt-6 w-full px-5 py-3 rounded-full bg-accent text-accent-foreground font-bold disabled:opacity-50">
          {quizLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Enviar respostas"}
        </button>
      </main>
    );
  }

  // Main journey panel
  return (
    <main className="px-4 py-8 max-w-3xl mx-auto">
      <div className="glass rounded-2xl p-5 mb-5">
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          {[
            "1 · Identidade",
            "2 · Passaporte",
            "3 · Destino",
            "4 · Nave",
            "5 · Quiz",
          ].map((item, index) => (
            <div key={item} className={`rounded-full px-3 py-2 text-center border ${index < (journeyStep === "passport" ? 2 : journeyStep === "destination" ? 3 : 4) ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-input/40"}`}>
              {item}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
        {identity?.avatar_url && <img src={identity.avatar_url} alt="" className="w-16 h-16 rounded-xl object-cover object-[center_25%]" />}
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Passaporte {passport.passport_number}</div>
          <div className="font-display text-lg text-gradient-neon">{identity?.alien_name}</div>
          <div className="text-xs text-muted-foreground">Origem: {passport.origin_planet}</div>
        </div>
        {identity?.ship_image_url ? (
          <img src={identity.ship_image_url} alt="Nave" className="w-20 h-20 rounded-xl object-cover border border-accent/40" />
        ) : (
          <details className="text-xs">
            <summary className="cursor-pointer text-accent hover:underline">+ nave (opcional)</summary>
            <div className="mt-2 w-56 space-y-2">
              <div className="grid grid-cols-3 gap-1">
                {SHIPS.map((s) => (
                  <button key={s.id} onClick={() => setShipCategory(s.id)}
                    className={`rounded-md border overflow-hidden text-left text-[10px] ${shipCategory === s.id ? "border-accent ring-1 ring-accent" : "border-border"}`}>
                    <img src={SHIP_PREVIEWS[s.id]} alt={s.name} className="w-full aspect-square object-cover" />
                    <div className="px-1 py-0.5">{s.name}</div>
                  </button>
                ))}
              </div>
              <button disabled={shipLoading} onClick={async () => {
                setShipLoading(true);
                try {
                  const r = await shipFn({ data: { identityId: identityId!, category: shipCategory } });
                  if (r?.fallback) {
                    toast.warning("Modo teste: créditos de IA esgotados. Usamos uma nave padrão.", { duration: 6000 });
                  } else {
                    toast.success("Nave pronta!");
                  }
                  await qc.invalidateQueries({ queryKey: ["journey", identityId] });
                } catch (e) { toast.error((e as Error).message); }
                finally { setShipLoading(false); }
              }} className="w-full px-2 py-1.5 rounded-md bg-accent text-accent-foreground text-[11px] font-bold disabled:opacity-60">
                {shipLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Gerar nave"}
              </button>
            </div>
          </details>
        )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Destinos visitados</span>
          <span>{visas.length}/{ALL_DESTINATIONS.length}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${(visas.length / ALL_DESTINATIONS.length) * 100}%` }} />
        </div>
      </div>

      {lastResult && (
        <div className={`glass rounded-2xl p-5 mb-5 ${lastResult.passed ? "border-2 border-accent" : "border-2 border-destructive/50"}`}>
          {lastResult.passed ? (
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-accent mt-0.5" />
              <div className="flex-1">
                <div className="font-display text-lg">Passou! {lastResult.score}/9</div>
                <div className="text-xs text-muted-foreground">
                  Emblema conquistado: <b className="uppercase">{lastResult.tier === "gold" ? "Ouro (9/9)" : lastResult.tier === "silver" ? "Prata (8/9)" : "Bronze (6–7/9)"}</b>. Embarque agora com o selo ou refaça o quiz para tentar uma nota melhor.
                </div>
                {lastResult.fichasEarned ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[11px] font-bold animate-pulse">
                    ☎️ +{lastResult.fichasEarned} fichas do teletransportador!
                  </div>
                ) : null}
              </div>
              {currentDest && lastResult.tier && (
                <DestinationBadge
                  destinationId={currentDest.id}
                  destinationName={currentDest.name}
                  tier={lastResult.tier}
                  size={88}
                />
              )}
            </div>
          ) : lastResult.fatal ? (
            <div className="flex items-start gap-3">
              <Skull className="w-6 h-6 text-destructive mt-0.5" />
              <div>
                <div className="font-display text-lg">Fim de linha · {lastResult.score}/9</div>
                <div className="text-xs text-muted-foreground">3 tentativas usadas. Você foi parar em <b>{lastResult.fatal.name}</b> ({lastResult.fatal.transport}).</div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-400 mt-0.5" />
              <div>
                <div className="font-display text-lg">Reprovou · {lastResult.score}/9</div>
                <div className="text-xs text-muted-foreground">{lastResult.attemptsLeft} tentativa(s) grátis restante(s).</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Destination picker */}
      {!currentDest && journeyStep === "passport" && (
        <div className="glass rounded-2xl p-5">
          <h2 className="font-display text-xl text-gradient-neon flex items-center gap-2"><Stamp className="w-5 h-5" /> Etapa 2 · Fazer passaporte</h2>
          <p className="text-xs text-muted-foreground mt-1">Seu passaporte galáctico já está liberado gratuitamente para esta identidade.</p>

          <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Passaporte emitido</div>
            <div className="mt-1 font-display text-lg">{passport.passport_number}</div>
            <div className="text-xs text-muted-foreground">Origem: {passport.origin_planet}</div>
          </div>

          <button onClick={() => setJourneyStep("destination")} className="mt-5 w-full px-5 py-3 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-neon">
            Continuar para escolher destino
          </button>
        </div>
      )}

      {!currentDest && journeyStep === "destination" && (
        <div className="glass rounded-2xl p-5">
          <TeleporterPrize visitedCount={visas.length} totalCount={TELEPORTER_THRESHOLD} variant="banner" />
          {visas.length >= TELEPORTER_THRESHOLD && (
            <WormholePrize visitedCount={visas.length} variant="banner" />
          )}
          <WormholeSurprisePrize visitedCount={visas.length} variant="banner" />
          <TelescopePrize visitedCount={visas.length} totalCount={TELESCOPE_JIMMY_WATH_THRESHOLD} variant="banner" />

          <h2 className="font-display text-xl text-gradient-neon flex items-center gap-2"><MapPin className="w-5 h-5" /> Etapa 3 · Escolha seu destino</h2>
          <p className="text-xs text-muted-foreground mt-1">Passaporte liberado. Agora escolha o destino, depois sua nave e então comece o quiz. Tudo grátis.</p>

           {remaining.length === 0 ? (
            <div className="mt-5 text-center">
              <Sparkles className="w-10 h-10 text-accent mx-auto" />
               <p className="font-display text-lg mt-2">45/45 selos conquistados</p>
               <p className="text-xs text-muted-foreground mt-2">Sua viagem continua no segundo mapa.</p>
               <Link to="/mapa" className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-neon">
                 Seguir para o Mapa Espacial <ArrowRight className="w-3.5 h-3.5" />
               </Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {remaining.map((d) => (
                <button key={d.id} onClick={() => setChosenDestId(d.id)}
                  className="rounded-xl border border-border bg-input/50 hover:border-accent hover:bg-accent/5 p-3 text-left transition">
                  <div className="flex items-center gap-2">
                    <KindIcon kind={d.kind} className="w-4 h-4 text-accent" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{KIND_LABEL[d.kind]}</span>
                  </div>
                  <div className="font-display text-sm mt-1">{d.name}</div>
                  <div className="text-[10px] text-muted-foreground">{d.transport}</div>
                  <div className="text-[10px] text-accent mt-1">Dificuldade {d.level}/5</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {currentDest && (
        <div className="glass rounded-2xl p-6">
          <button onClick={() => setChosenDestId(null)} className="text-xs text-muted-foreground hover:text-accent mb-3">← trocar destino</button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <KindIcon kind={currentDest.kind} className="w-3.5 h-3.5" />
            {KIND_LABEL[currentDest.kind]} · Dificuldade {currentDest.level}/5
          </div>
          <h2 className="font-display text-2xl text-gradient-neon flex items-center gap-2 mt-1">
            <MapPin className="w-5 h-5" /> Etapas 4 e 5 · {currentDest.name}
          </h2>
          <div className="text-xs text-muted-foreground mt-1">Transporte: {currentDest.transport}</div>

          <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Etapa 4 · Escolher nave</div>
            {identity?.ship_image_url ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr] items-center">
                <img src={identity.ship_image_url} alt="Nave escolhida" className="w-full rounded-xl object-cover border border-accent/30" />
                <div>
                  <div className="font-display text-base">Nave pronta para embarque</div>
                  <div className="text-xs text-muted-foreground">Você já escolheu a nave {identity.ship_category} para esta viagem.</div>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {SHIPS.map((s) => (
                    <button key={s.id} onClick={() => setShipCategory(s.id)}
                      className={`rounded-lg border overflow-hidden text-left ${shipCategory === s.id ? "border-accent ring-1 ring-accent" : "border-border bg-input/40"}`}>
                      <img src={SHIP_PREVIEWS[s.id]} alt={s.name} className="w-full aspect-square object-cover" />
                      <div className="p-2">
                        <div className="font-display text-xs">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <button disabled={shipLoading} onClick={async () => {
                  setShipLoading(true);
                  try {
                    const r = await shipFn({ data: { identityId: identityId!, category: shipCategory } });
                  if (r?.fallback) {
                    toast.warning("Modo teste: créditos de IA esgotados. Usamos uma nave padrão.", { duration: 6000 });
                  } else {
                    toast.success("Nave pronta!");
                  }
                    await qc.invalidateQueries({ queryKey: ["journey", identityId] });
                  } catch (e) { toast.error((e as Error).message); }
                  finally { setShipLoading(false); }
                }} className="mt-4 w-full px-4 py-3 rounded-full bg-accent text-accent-foreground font-bold text-sm disabled:opacity-60">
                  {shipLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Gerar nave grátis"}
                </button>
              </>
            )}
          </div>

          <div className="text-xs mt-4">Etapa 5 · Precisa de ≥ 60% (6/9) no quiz. Tentativas restantes: <b>{attemptsLeft}</b>/{MAX_QUIZ_ATTEMPTS}</div>

          {/* Seletor de dificuldade */}
          <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Escolha a dificuldade do quiz</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { v: null, label: "Misto", desc: "3+3+3", cls: "border-border" },
                { v: 1 as const, label: "Fácil", desc: "9 fáceis", cls: "border-green-500/40 text-green-300" },
                { v: 2 as const, label: "Médio", desc: "9 médias", cls: "border-yellow-500/40 text-yellow-300" },
                { v: 3 as const, label: "Difícil", desc: "9 difíceis", cls: "border-red-500/40 text-red-300" },
              ] as const).map((opt) => {
                const active = chosenDifficulty === opt.v;
                return (
                  <button key={String(opt.v)} onClick={() => setChosenDifficulty(opt.v)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${opt.cls} ${active ? "ring-2 ring-accent bg-accent/10" : "opacity-70 hover:opacity-100"}`}>
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button disabled={quizLoading} onClick={async () => {
              setQuizLoading(true);
              try {
                const r = await quizStartFn({ data: { journeyId: journey.id, destinationId: currentDest.id, ...(chosenDifficulty ? { difficulty: chosenDifficulty } : {}) } });
                setQuiz({ questions: r.questions, level: r.level, destinationId: currentDest.id, destinationName: r.destination.name, difficulty: chosenDifficulty });
                setAnswers([]); setLastResult(null); setReview(null);
              } catch (e) { toast.error((e as Error).message); }
              finally { setQuizLoading(false); }
            }}
              className="flex-1 px-5 py-3 rounded-full bg-accent text-accent-foreground font-bold disabled:opacity-50">
              {quizLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (lastResult?.passed ? "Refazer quiz" : "Iniciar quiz")}
            </button>

            {lastResult?.passed && lastResult.tier && (
              <button onClick={async () => {
                try {
                  const r = await claimVisaFn({ data: { journeyId: journey.id, destinationId: currentDest.id } });
                  toast.success(`Visto ${lastResult.tier === "gold" ? "OURO" : lastResult.tier === "silver" ? "PRATA" : "BRONZE"} emitido para ${currentDest.name}!`);
                  if (r?.surpriseCall) {
                    toast(`☎️ Ligação surpresa! +${r.surpriseCall.fichas} fichas (${r.surpriseCall.galaxyCount} galáxias visitadas)`, {
                      duration: 7000,
                      style: { background: "oklch(0.25 0.08 280)", color: "#fde68a", border: "1px solid #fbbf24" },
                    });
                    await qc.invalidateQueries({ queryKey: ["wallet"] });
                  }
                  setChosenDestId(null); setLastResult(null);
                  await qc.invalidateQueries({ queryKey: ["journey", identityId] });
                } catch (e) { toast.error((e as Error).message); }

              }} className="flex-1 px-5 py-3 rounded-full border border-accent/40 hover:bg-accent/10 text-sm">
                Embarcar com selo {lastResult.tier === "gold" ? "OURO" : lastResult.tier === "silver" ? "PRATA" : "BRONZE"} <ArrowRight className="w-3.5 h-3.5 inline" />
              </button>
            )}
          </div>
        </div>
      )}

      {visas.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              Painel · Selos de embarque conquistados
            </div>
            <div className="text-[10px] font-mono text-accent">{visas.length}/{ALL_DESTINATIONS.length}</div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center rounded-2xl border border-accent/30 bg-gradient-to-b from-black/40 to-accent/5 p-4 shadow-inner">
            {visas.map((v) => (
              <DestinationBadge
                key={v.id}
                destinationId={v.destination_id}
                destinationName={v.destination_name}
                tier={(v.tier ?? "bronze") as "bronze" | "silver" | "gold"}
                size={84}
              />
            ))}
          </div>
          {visas.length >= TELEPORTER_THRESHOLD && (
            <div className="mt-5">
              <TeleporterPrize visitedCount={visas.length} totalCount={TELEPORTER_THRESHOLD} variant="reward" />
            </div>
          )}
          {visas.length >= 15 && (
            <div className="mt-4">
              <WormholePrize visitedCount={visas.length} variant="reward" />
            </div>
          )}
          <div className="mt-4">
            <WormholeSurprisePrize visitedCount={visas.length} variant={visas.length >= WORMHOLE_SURPRISE_THRESHOLD ? "reward" : "banner"} />
          </div>
          <div className="mt-4">
            <TelescopePrize visitedCount={visas.length} totalCount={TELESCOPE_JIMMY_WATH_THRESHOLD} variant={visas.length >= TELESCOPE_JIMMY_WATH_THRESHOLD ? "reward" : "banner"} />
          </div>

        </div>
      )}
    </main>
  );
}

function Loader() {
  return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
}
