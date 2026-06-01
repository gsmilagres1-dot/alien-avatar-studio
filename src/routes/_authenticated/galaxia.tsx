import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Rocket, Stamp, MapPin, AlertTriangle, Sparkles, Skull, Check, ArrowRight, Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { listMyIdentities, generateShipImage } from "@/lib/identities.functions";
import { getJourneyState, startQuiz, submitQuiz, claimPassportWithPayment, claimVisaWithPayment } from "@/lib/intergalactic.functions";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { DESTINATIONS, destinationForLevel, MAX_QUIZ_ATTEMPTS } from "@/lib/intergalactic";
import { SHIPS } from "@/lib/alien";
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

interface Question { q: string; choices: string[]; answer: number }

function Galaxia() {
  const navigate = useNavigate();
  const { identityId } = Route.useSearch();
  const qc = useQueryClient();
  const listFn = useServerFn(listMyIdentities);
  const stateFn = useServerFn(getJourneyState);
  const quizStartFn = useServerFn(startQuiz);
  const quizSubmitFn = useServerFn(submitQuiz);
  const claimPassFn = useServerFn(claimPassportWithPayment);
  const claimVisaFn = useServerFn(claimVisaWithPayment);
  const shipFn = useServerFn(generateShipImage);

  const { data: ids, isLoading: idsLoading } = useQuery({
    queryKey: ["identities"], queryFn: () => listFn(),
  });

  const { data: state, isLoading: stateLoading } = useQuery({
    queryKey: ["journey", identityId],
    queryFn: () => stateFn({ data: { identityId: identityId! } }),
    enabled: !!identityId,
  });

  const [quiz, setQuiz] = useState<{ questions: Question[]; level: number; destinationName: string } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showPay, setShowPay] = useState<null | "passport" | "visa">(null);
  const [lastResult, setLastResult] = useState<{ passed: boolean; score: number; attemptsLeft: number; fatal: { name: string; transport: string } | null } | null>(null);
  const [shipCategory, setShipCategory] = useState<"esportiva" | "offroad" | "corrida">("esportiva");
  const [shipLoading, setShipLoading] = useState(false);

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
              <Plus className="w-3.5 h-3.5" /> Criar identidade (R$ 2,99)
            </Link>
          </div>
        </main>
      );
    }
    return (
      <main className="px-4 py-8 max-w-4xl mx-auto">
        <h1 className="font-display text-2xl text-gradient-neon mb-2">Escolha a identidade que vai viajar</h1>
        <p className="text-sm text-muted-foreground mb-6">Cada identidade tem sua própria viagem. Comprar uma nova identidade começa uma viagem do zero.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((i) => (
            <button key={i.id} onClick={() => navigate({ to: "/galaxia", search: { identityId: i.id } })}
              className="glass rounded-2xl overflow-hidden text-left hover:ring-2 hover:ring-accent transition">
              <img src={i.avatar_url} alt={i.alien_name} className="w-full aspect-square object-cover" />
              <div className="p-4">
                <div className="font-display text-lg text-gradient-neon">{i.alien_name}</div>
                <div className="text-xs text-muted-foreground">{i.species} · {i.planet_id}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (stateLoading || !state) return <Loader />;

  const { journey, passport, visas, identity, passportCredit, visaCredit } = state;
  const dest = destinationForLevel(journey.current_level);
  const attemptsLeft = MAX_QUIZ_ATTEMPTS - journey.attempts_used;

  // Payment overlay
  if (showPay) {
    const next = `/galaxia?identityId=${identityId}`;
    const returnUrl = `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&next=${encodeURIComponent(next)}`;
    return (
      <>
        <PaymentTestModeBanner />
        <main className="px-4 py-6 max-w-2xl mx-auto">
          <button onClick={() => setShowPay(null)} className="text-xs text-muted-foreground hover:underline mb-3">← cancelar</button>
          <h2 className="font-display text-xl mb-3 text-center">
            {showPay === "passport" ? "Passaporte Alienígena · R$ 2,99" : `Visto para ${dest.name} · R$ 1,99`}
          </h2>
          <StripeEmbeddedCheckout returnUrl={returnUrl} kind={showPay} journeyId={journey.id} />
        </main>
      </>
    );
  }

  // Journey ended (completed or lost)
  if (journey.status !== "active") {
    const fatal = journey.final_destination_kind === "fatal";
    return (
      <main className="px-4 py-10 max-w-2xl mx-auto">
        <div className={`glass rounded-2xl p-8 text-center ${fatal ? "border-2 border-destructive" : "border-2 border-accent"}`}>
          {fatal ? <Skull className="w-12 h-12 text-destructive mx-auto" /> : <Sparkles className="w-12 h-12 text-accent mx-auto" />}
          <h1 className="font-display text-2xl mt-3">
            {fatal ? "Perdido no espaço" : "Viagem completa!"}
          </h1>
          <p className="text-sm mt-2">
            {identity?.alien_name} {fatal ? "acabou em" : "chegou em"}{" "}
            <span className="font-bold text-gradient-neon">{journey.final_destination_name}</span>
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link to="/criar" className="px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-bold text-sm shadow-neon">
              Nova identidade (R$ 2,99) → nova viagem
            </Link>
            <Link to="/galeria" className="text-xs text-muted-foreground hover:underline">
              Ver na galeria
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // No passport yet
  if (!passport) {
    return (
      <main className="px-4 py-10 max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-8 text-center">
          <Stamp className="w-12 h-12 text-accent mx-auto" />
          <h1 className="font-display text-2xl mt-3 text-gradient-neon">Passaporte necessário</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {identity?.alien_name} precisa de um passaporte alienígena oficial pra viajar pela Federação.
          </p>
          {passportCredit ? (
            <button onClick={async () => {
              try {
                await claimPassFn({ data: { paymentId: passportCredit.id } });
                toast.success("Passaporte emitido!");
                await qc.invalidateQueries({ queryKey: ["journey", identityId] });
              } catch (e) { toast.error((e as Error).message); }
            }}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-bold shadow-neon">
              Usar passaporte grátis (teste)
            </button>
          ) : (
            <button onClick={() => setShowPay("passport")}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-accent-foreground font-bold shadow-neon">
              Comprar passaporte · R$ 2,99
            </button>
          )}
        </div>
      </main>
    );
  }

  // Ship selection — required before any quiz
  if (!identity?.ship_image_url) {
    return (
      <main className="px-4 py-8 max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-6 text-center">
          <Rocket className="w-10 h-10 text-accent mx-auto" />
          <h1 className="font-display text-2xl mt-3 text-gradient-neon">Escolha sua nave</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {identity?.alien_name} precisa de uma nave antes de embarcar no quiz da viagem.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
          {SHIPS.map((s) => (
            <button key={s.id} onClick={() => setShipCategory(s.id)}
              className={`px-3 py-3 rounded-xl border text-left transition ${shipCategory === s.id ? "border-accent bg-accent/15 shadow-neon" : "border-border bg-input/50"}`}>
              <div className="font-display text-sm">{s.name}</div>
              <div className="text-[10px] text-muted-foreground">{s.desc}</div>
            </button>
          ))}
        </div>
        <button disabled={shipLoading} onClick={async () => {
          setShipLoading(true);
          try {
            await shipFn({ data: { identityId: identityId!, category: shipCategory } });
            toast.success("Nave pronta para decolar!");
            await qc.invalidateQueries({ queryKey: ["journey", identityId] });
          } catch (e) { toast.error((e as Error).message); }
          finally { setShipLoading(false); }
        }}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-alien-grad text-primary-foreground font-display font-bold shadow-neon disabled:opacity-60">
          {shipLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando nave...</> : <><Wand2 className="w-4 h-4" />Gerar minha nave</>}
        </button>
      </main>
    );
  }

  // Active quiz
  if (quiz) {
    const allAnswered = answers.length === quiz.questions.length && answers.every((a) => a !== undefined);
    return (
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div className="text-xs text-muted-foreground mb-2">Nível {quiz.level} · {quiz.destinationName}</div>
        <h1 className="font-display text-xl text-gradient-neon mb-4">Quiz da viagem</h1>
        <div className="space-y-5">
          {quiz.questions.map((q, qi) => (
            <div key={qi} className="glass rounded-xl p-4">
              <div className="text-sm font-medium mb-3">{qi + 1}. {q.q}</div>
              <div className="space-y-2">
                {q.choices.map((c, ci) => (
                  <button key={ci} onClick={() => {
                    const next = [...answers]; next[qi] = ci; setAnswers(next);
                  }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${answers[qi] === ci ? "border-accent bg-accent/10" : "border-border hover:bg-accent/5"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button disabled={!allAnswered || quizLoading} onClick={async () => {
          setQuizLoading(true);
          try {
            const r = await quizSubmitFn({ data: { journeyId: journey.id, questions: quiz.questions, answers } });
            setLastResult(r);
            setQuiz(null); setAnswers([]);
            await qc.invalidateQueries({ queryKey: ["journey", identityId] });
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
      <div className="glass rounded-2xl p-5 mb-5 flex items-center gap-4">
        {identity?.avatar_url && <img src={identity.avatar_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Passaporte {passport.passport_number}</div>
          <div className="font-display text-lg text-gradient-neon">{identity?.alien_name}</div>
          <div className="text-xs text-muted-foreground">Origem: {passport.origin_planet}</div>
        </div>
      </div>

      {/* Level progress */}
      <div className="mb-5">
        <div className="text-xs text-muted-foreground mb-2">Progresso da viagem</div>
        <div className="flex items-center gap-2">
          {DESTINATIONS.map((d) => (
            <div key={d.id} className={`flex-1 h-2 rounded-full ${d.level < journey.current_level ? "bg-accent" : d.level === journey.current_level ? "bg-accent/40" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {lastResult && (
        <div className={`glass rounded-2xl p-5 mb-5 ${lastResult.passed ? "border-2 border-accent" : "border-2 border-destructive/50"}`}>
          {lastResult.passed ? (
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-accent mt-0.5" />
              <div>
                <div className="font-display text-lg">Passou! {lastResult.score}/5</div>
                <div className="text-xs text-muted-foreground">Agora compre o visto de R$ 1,99 pra embarcar.</div>
              </div>
            </div>
          ) : lastResult.fatal ? (
            <div className="flex items-start gap-3">
              <Skull className="w-6 h-6 text-destructive mt-0.5" />
              <div>
                <div className="font-display text-lg">Fim de linha · {lastResult.score}/5</div>
                <div className="text-xs text-muted-foreground">3 tentativas usadas. Você foi parar em <b>{lastResult.fatal.name}</b> ({lastResult.fatal.transport}).</div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-400 mt-0.5" />
              <div>
                <div className="font-display text-lg">Reprovou · {lastResult.score}/5</div>
                <div className="text-xs text-muted-foreground">{lastResult.attemptsLeft} tentativa(s) grátis restante(s).</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <div className="text-xs text-muted-foreground">Nível {journey.current_level} de {DESTINATIONS.length}</div>
        <h2 className="font-display text-2xl text-gradient-neon flex items-center gap-2 mt-1">
          <MapPin className="w-5 h-5" /> {dest.name}
        </h2>
        <div className="text-xs text-muted-foreground mt-1">Transporte: {dest.transport}</div>
        <div className="text-xs mt-3">Precisa de ≥ 80% no quiz. Tentativas restantes: <b>{attemptsLeft}</b>/{MAX_QUIZ_ATTEMPTS}</div>

        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <button disabled={quizLoading} onClick={async () => {
            setQuizLoading(true);
            try {
              const r = await quizStartFn({ data: { journeyId: journey.id } });
              setQuiz({ questions: r.questions, level: r.level, destinationName: r.destination.name });
              setAnswers([]); setLastResult(null);
            } catch (e) { toast.error((e as Error).message); }
            finally { setQuizLoading(false); }
          }}
            className="flex-1 px-5 py-3 rounded-full bg-accent text-accent-foreground font-bold disabled:opacity-50">
            {quizLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Iniciar quiz"}
          </button>
          {visaCredit ? (
            <button onClick={async () => {
              try {
                await claimVisaFn({ data: { journeyId: journey.id, paymentId: visaCredit.id } });
                toast.success(`Visto emitido para ${dest.name}!`);
                await qc.invalidateQueries({ queryKey: ["journey", identityId] });
              } catch (e) { toast.error((e as Error).message); }
            }} className="flex-1 px-5 py-3 rounded-full border border-accent/40 hover:bg-accent/10 text-sm">
              Usar visto grátis (teste) <ArrowRight className="w-3.5 h-3.5 inline" />
            </button>
          ) : (
            <button onClick={() => setShowPay("visa")} className="flex-1 px-5 py-3 rounded-full border border-accent/40 hover:bg-accent/10 text-sm">
              Comprar visto · R$ 1,99 <ArrowRight className="w-3.5 h-3.5 inline" />
            </button>
          )}
        </div>
      </div>

      {visas.length > 0 && (
        <div className="mt-6">
          <div className="text-xs text-muted-foreground mb-2">Vistos conquistados</div>
          <div className="flex flex-wrap gap-2">
            {visas.map((v) => (
              <span key={v.id} className="glass px-3 py-1.5 rounded-full text-xs">
                <Stamp className="w-3 h-3 inline mr-1" /> {v.destination_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function Loader() {
  return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
}
