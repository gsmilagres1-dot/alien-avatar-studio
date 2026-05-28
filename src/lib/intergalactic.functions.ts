import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  DESTINATIONS,
  MAX_QUIZ_ATTEMPTS,
  QUESTIONS_PER_QUIZ,
  QUIZ_PASS_RATIO,
  destinationForLevel,
  pickFatalDestination,
} from "@/lib/intergalactic";

interface QuizQuestion { q: string; choices: string[]; answer: number }

async function generateQuizWithAI(level: number, destinationName: string): Promise<QuizQuestion[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");
  const prompt = `Gere ${QUESTIONS_PER_QUIZ} perguntas de múltipla escolha em PT-BR, nível ${level}/5 de dificuldade, sobre o destino intergaláctico "${destinationName}" — temas: astronomia, exploração espacial, transportes (naves, teletransporte, buracos de minhoca), física básica do espaço. Responda APENAS com JSON válido no formato: {"questions":[{"q":"...","choices":["a","b","c","d"],"answer":0}]} onde "answer" é o índice (0-3) da resposta correta. Sem comentários ou texto fora do JSON.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Muitos pedidos à IA — aguarde");
    if (res.status === 402) throw new Error("Créditos de IA esgotados");
    throw new Error(`Falha IA (${res.status}): ${t.slice(0, 200)}`);
  }
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = j.choices?.[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { throw new Error("Resposta da IA inválida"); }
  const arr = (parsed as { questions?: QuizQuestion[] }).questions ?? [];
  if (!Array.isArray(arr) || arr.length < QUESTIONS_PER_QUIZ) throw new Error("IA não retornou perguntas suficientes");
  return arr.slice(0, QUESTIONS_PER_QUIZ).map((q) => ({
    q: String(q.q),
    choices: q.choices.slice(0, 4).map(String),
    answer: Math.max(0, Math.min(3, Number(q.answer) | 0)),
  }));
}

async function ensureJourney(userId: string, identityId: string) {
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
    const journey = await ensureJourney(userId, data.identityId);
    const [{ data: passport }, { data: visas }, { data: identity }] = await Promise.all([
      supabaseAdmin.from("passports").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("visas").select("*").eq("journey_id", journey.id).order("issued_at"),
      supabaseAdmin.from("identities").select("alien_name, planet_id, avatar_url").eq("id", data.identityId).single(),
    ]);
    return { journey, passport, visas: visas ?? [], identity };
  });

export const startQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ journeyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey) throw new Error("Viagem não encontrada");
    if (journey.status !== "active") throw new Error("Esta viagem já terminou");

    const { data: passport } = await supabaseAdmin
      .from("passports").select("id").eq("user_id", userId).maybeSingle();
    if (!passport) throw new Error("Você precisa de um passaporte primeiro");

    const dest = destinationForLevel(journey.current_level);
    const questions = await generateQuizWithAI(journey.current_level, dest.name);
    return { questions, level: journey.current_level, destination: dest, attemptsUsed: journey.attempts_used };
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    journeyId: z.string().uuid(),
    questions: z.array(z.object({ q: z.string(), choices: z.array(z.string()), answer: z.number() })).length(QUESTIONS_PER_QUIZ),
    answers: z.array(z.number().min(0).max(3)).length(QUESTIONS_PER_QUIZ),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey || journey.status !== "active") throw new Error("Viagem inválida");

    const score = data.answers.reduce((acc, a, i) => acc + (a === data.questions[i].answer ? 1 : 0), 0);
    const passed = score / QUESTIONS_PER_QUIZ >= QUIZ_PASS_RATIO;

    await supabaseAdmin.from("quiz_attempts").insert({
      user_id: userId, journey_id: journey.id, level: journey.current_level,
      score, total: QUESTIONS_PER_QUIZ, passed, questions: data.questions, answers: data.answers,
    });

    if (passed) {
      await supabaseAdmin.from("journeys").update({ attempts_used: 0 }).eq("id", journey.id);
      return { passed: true, score, attemptsLeft: MAX_QUIZ_ATTEMPTS, fatal: null };
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
      return { passed: false, score, attemptsLeft: 0, fatal };
    }
    await supabaseAdmin.from("journeys").update({ attempts_used: newAttempts }).eq("id", journey.id);
    return { passed: false, score, attemptsLeft: MAX_QUIZ_ATTEMPTS - newAttempts, fatal: null };
  });

export const claimVisaWithPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    journeyId: z.string().uuid(), paymentId: z.string().uuid(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: pay } = await supabaseAdmin
      .from("payment_transactions").select("*").eq("id", data.paymentId).eq("user_id", userId).maybeSingle();
    if (!pay || pay.status !== "completed" || pay.credits_remaining < 1) throw new Error("Pagamento inválido");
    if (pay.kind !== "visa") throw new Error("Esse pagamento não é de visto");

    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey || journey.status !== "active") throw new Error("Viagem inválida");

    const dest = destinationForLevel(journey.current_level);
    const { error } = await supabaseAdmin.from("visas").insert({
      user_id: userId, journey_id: journey.id, destination_id: dest.id,
      destination_name: dest.name, transport: dest.transport, payment_id: pay.id, kind: "normal",
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);

    await supabaseAdmin.from("payment_transactions").update({ credits_remaining: 0 }).eq("id", pay.id);

    if (journey.current_level >= DESTINATIONS.length) {
      await supabaseAdmin.from("journeys").update({
        status: "completed",
        final_destination_name: dest.name,
        final_destination_kind: "normal",
        completed_at: new Date().toISOString(),
      }).eq("id", journey.id);
    } else {
      await supabaseAdmin.from("journeys").update({
        current_level: journey.current_level + 1, attempts_used: 0,
      }).eq("id", journey.id);
    }
    return { ok: true };
  });

export const claimPassportWithPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ paymentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: pay } = await supabaseAdmin
      .from("payment_transactions").select("*").eq("id", data.paymentId).eq("user_id", userId).maybeSingle();
    if (!pay || pay.status !== "completed" || pay.credits_remaining < 1) throw new Error("Pagamento inválido");
    if (pay.kind !== "passport") throw new Error("Esse pagamento não é de passaporte");

    const { data: existing } = await supabaseAdmin
      .from("passports").select("id").eq("user_id", userId).maybeSingle();
    if (!existing) {
      const num = "AP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      await supabaseAdmin.from("passports").insert({
        user_id: userId, passport_number: num, origin_planet: "Terra", payment_id: pay.id,
      });
    }
    await supabaseAdmin.from("payment_transactions").update({ credits_remaining: 0 }).eq("id", pay.id);
    return { ok: true };
  });
