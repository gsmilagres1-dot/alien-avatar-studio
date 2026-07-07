import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DESTINATIONS,
  ALL_DESTINATIONS,
  MAX_QUIZ_ATTEMPTS,
  QUESTIONS_PER_QUIZ,
  QUESTIONS_PER_LEVEL,
  QUIZ_LEVELS,
  QUIZ_PASS_RATIO,
  GALAXY_SURPRISE_STEP,
  GALAXY_SURPRISE_MIN,
  GALAXY_SURPRISE_MAX,
  getAnyDestination,
  pickFatalDestination,
  tierFromScore,
} from "@/lib/intergalactic";
import { getBankForDestination } from "@/lib/intergalactic-questions";
import { getTeamBank, getTeamDestination } from "@/lib/team-destinations";

function getBankForAny(id: string) {
  const singular = getBankForDestination(id);
  if (singular.length > 0) return singular;
  return getTeamBank(id);
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}


interface QuizQuestion { q: string; choices: string[]; answer: number; level?: number }

/**
 * Monta um quiz de 15 perguntas distribuídas em 3 níveis de dificuldade
 * (5 por nível) a partir do banco temático de cada destino.
 * Cada tentativa embaralha o pool — então as 3 chances podem ter perguntas diferentes.
 */
function buildQuizFromBank(destinationId: string, attemptSeed: number, difficulty?: number): QuizQuestion[] {
  const bank = getBankForAny(destinationId);
  if (bank.length === 0) return [];

  const rng = mulberry32(attemptSeed);
  const out: QuizQuestion[] = [];

  // Se o jogador escolheu uma dificuldade, todas as 9 perguntas vêm daquele nível
  // (com fallback para outros níveis se o pool for pequeno).
  if (difficulty && difficulty >= 1 && difficulty <= QUIZ_LEVELS) {
    const primary = bank.filter((q) => q.level === difficulty);
    const fallback = bank.filter((q) => q.level !== difficulty);
    const pool = [...shuffle(primary, rng), ...shuffle(fallback, rng)].slice(0, QUESTIONS_PER_QUIZ);
    return pool.map((q) => ({ q: q.q, choices: q.choices, answer: q.answer, level: q.level }));
  }

  // Modo padrão: 3 perguntas por nível (fácil/médio/difícil).
  for (let lvl = 1; lvl <= QUIZ_LEVELS; lvl++) {
    const pool = bank.filter((q) => q.level === lvl);
    const picked = shuffle(pool, rng).slice(0, QUESTIONS_PER_LEVEL);
    out.push(...picked.map((q) => ({ q: q.q, choices: q.choices, answer: q.answer, level: lvl })));
  }
  return out;
}


function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}





async function ensureJourney(userId: string, identityId: string, supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>) {
  const { data: existing } = await supabaseAdmin
    .from("journeys").select("*").eq("identity_id", identityId).eq("user_id", userId).maybeSingle();
  if (existing) return existing;
  const { data: ident } = await supabaseAdmin
    .from("identities").select("id, user_id").eq("id", identityId).eq("user_id", userId).maybeSingle();
  if (!ident) throw new Error("Identidade não encontrada");
  const { data, error } = await supabaseAdmin
    .from("journeys").insert({ user_id: userId, identity_id: identityId }).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export const getJourneyState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ identityId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const journey = await ensureJourney(userId, data.identityId, supabaseAdmin);

    // Passaporte grátis (auto-emitido)
    let { data: passport } = await supabaseAdmin
      .from("passports").select("*").eq("user_id", userId).maybeSingle();
    if (!passport) {
      const num = "AP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const ins = await supabaseAdmin.from("passports").insert({
        user_id: userId, passport_number: num, origin_planet: "Terra",
      }).select("*").single();
      passport = ins.data;
    }

    const [{ data: visas }, { data: identity }] = await Promise.all([
      supabaseAdmin.from("visas").select("*").eq("journey_id", journey.id).order("issued_at"),
      supabaseAdmin.from("identities").select("alien_name, planet_id, avatar_url, ship_image_url, ship_category").eq("id", data.identityId).single(),
    ]);

    return { journey, passport, visas: visas ?? [], identity };
  });

export const startQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    journeyId: z.string().uuid(),
    destinationId: z.string().min(1).max(64),
    difficulty: z.number().int().min(1).max(3).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey) throw new Error("Viagem não encontrada");
    if (journey.status !== "active") throw new Error("Esta viagem já terminou");

    const dest = getAnyDestination(data.destinationId);
    if (!dest) throw new Error("Destino inválido");

    const { data: already } = await supabaseAdmin
      .from("visas").select("id").eq("journey_id", journey.id).eq("destination_id", dest.id).maybeSingle();
    if (already) throw new Error("Você já visitou esse destino");

    // Seed varia conforme tentativa + dificuldade: cada chance pode sortear perguntas diferentes.
    const seed = hashSeed(`${journey.id}:${dest.id}:${journey.attempts_used}:${data.difficulty ?? 0}`);
    const questions = buildQuizFromBank(dest.id, seed, data.difficulty);
    if (questions.length === 0) throw new Error("Banco de perguntas indisponível para este destino");
    // O app precisa mostrar na hora se a resposta marcada está certa ou errada,
    // para o botão S.O.S. fazer sentido durante o quiz.
    const safeQuestions = questions.map(({ q, choices, answer, level }) => ({ q, choices, answer, level }));
    return { questions: safeQuestions, level: dest.level, destination: dest, attemptsUsed: journey.attempts_used, difficulty: data.difficulty ?? null };
  });


function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    journeyId: z.string().uuid(),
    destinationId: z.string().min(1).max(64),
    answers: z.array(z.number().min(0).max(3)).length(QUESTIONS_PER_QUIZ),
    difficulty: z.number().int().min(1).max(3).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey || journey.status !== "active") throw new Error("Viagem inválida");

    const dest = getAnyDestination(data.destinationId);
    if (!dest) throw new Error("Destino inválido");

    // Re-derive the exact same quiz the client received (deterministic from
    // journey + destination + attempt index + difficulty). Never trust client-supplied
    // answer keys.
    const seed = hashSeed(`${journey.id}:${dest.id}:${journey.attempts_used}:${data.difficulty ?? 0}`);
    const questions = buildQuizFromBank(dest.id, seed, data.difficulty);
    if (questions.length !== QUESTIONS_PER_QUIZ) {
      throw new Error("Banco de perguntas indisponível para este destino");
    }


    const score = data.answers.reduce(
      (acc, a, i) => acc + (a === questions[i].answer ? 1 : 0),
      0,
    );
    const passed = score / QUESTIONS_PER_QUIZ >= QUIZ_PASS_RATIO;
    const tier = passed ? tierFromScore(score, QUESTIONS_PER_QUIZ) : null;

    await supabaseAdmin.from("quiz_attempts").insert({
      user_id: userId, journey_id: journey.id, level: dest.level,
      destination_id: dest.id,
      score, total: QUESTIONS_PER_QUIZ, passed,
      questions: questions as never, answers: data.answers,
    });

    if (passed) {
      await supabaseAdmin.from("journeys").update({ attempts_used: 0 }).eq("id", journey.id);
      const reward = tier === "gold" ? 25 : tier === "silver" ? 10 : 5;
      let fichasBalance: number | null = null;
      try {
        const { data: bal } = await supabaseAdmin.rpc("adjust_fichas", {
          _user_id: userId, _delta: reward, _reason: `quiz_${tier}`,
          _meta: { destinationId: dest.id, score },
        });
        fichasBalance = bal as number;
      } catch { /* wallet may not exist yet on first run */ }
      return { passed: true, score, attemptsLeft: MAX_QUIZ_ATTEMPTS, fatal: null, tier, fichasEarned: reward, fichasBalance, correctAnswers: questions.map((q) => q.answer) };
    }


    const newAttempts = journey.attempts_used + 1;
    if (newAttempts >= MAX_QUIZ_ATTEMPTS) {
      const fatal = pickFatalDestination(journey.id);
      await supabaseAdmin.from("journeys").update({
        status: "lost_in_space",
        attempts_used: newAttempts,
        final_destination_name: fatal.name,
        final_destination_kind: "fatal",
        completed_at: new Date().toISOString(),
      }).eq("id", journey.id);
      return { passed: false, score, attemptsLeft: 0, fatal, tier: null, correctAnswers: questions.map((q) => q.answer) };
    }
    await supabaseAdmin.from("journeys").update({ attempts_used: newAttempts }).eq("id", journey.id);
    return { passed: false, score, attemptsLeft: MAX_QUIZ_ATTEMPTS - newAttempts, fatal: null, tier: null, correctAnswers: questions.map((q) => q.answer) };
  });


export const claimVisa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    journeyId: z.string().uuid(),
    destinationId: z.string().min(1).max(64),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey || journey.status !== "active") throw new Error("Viagem inválida");

    const dest = getAnyDestination(data.destinationId);
    if (!dest) throw new Error("Destino inválido");

    // Require a passing quiz attempt for this exact destination before
    // issuing the visa. Tier is derived server-side from the best score.
    const { data: passes } = await supabaseAdmin
      .from("quiz_attempts")
      .select("score, total")
      .eq("journey_id", journey.id)
      .eq("destination_id", dest.id)
      .eq("passed", true)
      .order("score", { ascending: false })
      .limit(1);
    const best = passes?.[0];
    if (!best) throw new Error("Você precisa passar no quiz deste destino antes de embarcar");
    const tier = tierFromScore(best.score, best.total);

    const { error } = await supabaseAdmin.from("visas").insert({
      user_id: userId, journey_id: journey.id, destination_id: dest.id,
      destination_name: dest.name, transport: dest.transport, kind: "normal",
      tier,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);


    // Ligação surpresa: a cada GALAXY_SURPRISE_STEP visitas em galáxias,
    // o viajante recebe uma chamada com fichas aleatórias.
    let surpriseCall: { fichas: number; galaxyCount: number } | null = null;
    if (dest.kind === "galaxy") {
      const { data: galaxyVisas } = await supabaseAdmin
        .from("visas").select("destination_id").eq("journey_id", journey.id);
      const galaxyIds = new Set(
        ALL_DESTINATIONS.filter((d) => d.kind === "galaxy").map((d) => d.id),
      );
      const galaxyCount = (galaxyVisas ?? []).filter((v) => galaxyIds.has(v.destination_id as string)).length;
      if (galaxyCount > 0 && galaxyCount % GALAXY_SURPRISE_STEP === 0) {
        const fichas = Math.floor(
          GALAXY_SURPRISE_MIN + Math.random() * (GALAXY_SURPRISE_MAX - GALAXY_SURPRISE_MIN + 1),
        );
        try {
          await supabaseAdmin.rpc("adjust_fichas", {
            _user_id: userId, _delta: fichas, _reason: "galaxy_surprise_call",
            _meta: { destinationId: dest.id, galaxyCount },
          });
          surpriseCall = { fichas, galaxyCount };
        } catch { /* wallet may not exist yet */ }
      }
    }

    const newLevel = journey.current_level + 1;
    if (newLevel > ALL_DESTINATIONS.length) {
      await supabaseAdmin.from("journeys").update({
        status: "completed",
        current_level: newLevel,
        final_destination_name: dest.name,
        final_destination_kind: "normal",
        completed_at: new Date().toISOString(),
      }).eq("id", journey.id);
    } else {
      await supabaseAdmin.from("journeys").update({
        current_level: newLevel, attempts_used: 0,
      }).eq("id", journey.id);
    }
    return { ok: true, surpriseCall };
  });


export const completeJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ journeyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey || journey.status !== "active") throw new Error("Viagem inválida");
    const { data: visas } = await supabaseAdmin
      .from("visas").select("destination_name").eq("journey_id", journey.id).order("issued_at", { ascending: false }).limit(1);
    const last = visas?.[0]?.destination_name ?? "Casa";
    await supabaseAdmin.from("journeys").update({
      status: "completed",
      final_destination_name: last,
      final_destination_kind: "normal",
      completed_at: new Date().toISOString(),
    }).eq("id", journey.id);
    return { ok: true };
  });
