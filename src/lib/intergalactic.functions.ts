import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  DESTINATIONS,
  MAX_QUIZ_ATTEMPTS,
  QUESTIONS_PER_QUIZ,
  QUIZ_PASS_RATIO,
  getDestination,
  pickFatalDestination,
} from "@/lib/intergalactic";

interface QuizQuestion { q: string; choices: string[]; answer: number }

const FALLBACK_QUIZ_BANK: QuizQuestion[] = [
  // Astronomia básica
  { q: "Qual planeta do Sistema Solar é conhecido como Planeta Vermelho?", choices: ["Vênus", "Marte", "Júpiter", "Mercúrio"], answer: 1 },
  { q: "Qual é a estrela no centro do nosso Sistema Solar?", choices: ["Betelgeuse", "Sírius", "Sol", "Alpha Centauri A"], answer: 2 },
  { q: "Qual satélite natural orbita a Terra?", choices: ["Europa", "Lua", "Titã", "Fobos"], answer: 1 },
  { q: "Qual planeta é famoso por seus anéis visíveis?", choices: ["Saturno", "Netuno", "Marte", "Urano"], answer: 0 },
  { q: "Qual planeta é o maior do Sistema Solar?", choices: ["Terra", "Júpiter", "Saturno", "Netuno"], answer: 1 },
  { q: "Como se chama a galáxia onde está o Sistema Solar?", choices: ["Andrômeda", "Via Láctea", "Nebulosa de Órion", "Sombrero"], answer: 1 },
  { q: "Qual planeta fica mais perto do Sol?", choices: ["Mercúrio", "Vênus", "Terra", "Marte"], answer: 0 },
  { q: "Plutão é mais conhecido hoje como quê?", choices: ["Lua", "Cometa", "Planeta anão", "Asteroide"], answer: 2 },
  { q: "Qual destas opções é uma lua de Júpiter?", choices: ["Europa", "Vênus", "Mercúrio", "Plutão"], answer: 0 },
  { q: "O Sol é classificado como quê?", choices: ["Planeta", "Lua", "Estrela", "Galáxia"], answer: 2 },
  { q: "Qual planeta é conhecido por ser muito quente e ter atmosfera densa?", choices: ["Marte", "Vênus", "Urano", "Netuno"], answer: 1 },
  { q: "Qual planeta é conhecido por seus ventos e por sua cor azul intensa?", choices: ["Netuno", "Marte", "Mercúrio", "Saturno"], answer: 0 },

  // Filmes / desenhos / alienígenas pop
  { q: "No filme E.T., o que o alienígena quer fazer o tempo todo?", choices: ["Comer pizza", "Telefonar para casa", "Voltar para a escola", "Pilotar uma nave"], answer: 1 },
  { q: "Qual é o nome do cachorro da família Jetsons?", choices: ["Rex", "Astro", "Snoopy", "Pluto"], answer: 1 },
  { q: "Em Star Wars, qual é a frase mais famosa de Darth Vader sobre Luke?", choices: ["Que a Força esteja com você", "Eu sou seu pai", "Não há tentar, faça", "Estes não são os droides"], answer: 1 },
  { q: "Em Star Wars, qual a espécie do mestre Yoda?", choices: ["Wookiee", "Ewok", "Desconhecida", "Hutt"], answer: 2 },
  { q: "Em Avatar (2009), como se chama a lua onde vivem os Na'vi?", choices: ["Pandora", "Krypton", "Tatooine", "Arrakis"], answer: 0 },
  { q: "De que cor é a pele dos Na'vi em Avatar?", choices: ["Verde", "Azul", "Roxa", "Cinza"], answer: 1 },
  { q: "Qual é o nome do alienígena peludo da série ALF?", choices: ["Gordon Shumway", "Mork", "Paul", "Roger"], answer: 0 },
  { q: "Em ALF, qual era a comida favorita do ALF (que ele nunca podia comer)?", choices: ["Pizza", "Gato", "Hambúrguer", "Sorvete"], answer: 1 },
  { q: "No filme Predador (1987), quem enfrenta o caçador alienígena na selva?", choices: ["Sylvester Stallone", "Arnold Schwarzenegger", "Bruce Willis", "Jean-Claude Van Damme"], answer: 1 },
  { q: "Em O Exterminador do Futuro, qual a frase clássica do T-800?", choices: ["Hasta la vista, baby", "Show me the money", "May the Force be with you", "To infinity and beyond"], answer: 0 },
  { q: "Em O Exterminador do Futuro 2, qual é o modelo do robô vilão líquido?", choices: ["T-800", "T-1000", "T-X", "T-900"], answer: 1 },
  { q: "Quem dirigiu O Exterminador do Futuro e Avatar?", choices: ["Steven Spielberg", "James Cameron", "George Lucas", "Ridley Scott"], answer: 1 },
  { q: "Em Perdido em Marte (2015), com Matt Damon, qual planta o astronauta cultiva em Marte?", choices: ["Tomate", "Batata", "Milho", "Alface"], answer: 1 },
  { q: "Os Jetsons vivem em que tipo de cenário?", choices: ["Caverna pré-histórica", "Cidade futurista nas nuvens", "Planeta marciano", "Submarino"], answer: 1 },
  { q: "Qual é o nome da robô empregada doméstica dos Jetsons?", choices: ["Rosie", "Wall-E", "C-3PO", "Bender"], answer: 0 },
  { q: "Em Star Wars, qual nave é pilotada por Han Solo e Chewbacca?", choices: ["Millennium Falcon", "X-Wing", "Estrela da Morte", "Tie Fighter"], answer: 0 },
  { q: "Qual é o planeta natal de Luke Skywalker em Star Wars?", choices: ["Naboo", "Tatooine", "Endor", "Hoth"], answer: 1 },
  { q: "Em Homens de Preto, o que os agentes usam para apagar a memória de testemunhas?", choices: ["Laser", "Neuralizador", "Soro da verdade", "Hipnose"], answer: 1 },
  { q: "Qual destes filmes NÃO é sobre alienígenas?", choices: ["E.T.", "Predador", "Titanic", "Independence Day"], answer: 2 },
  { q: "Em Toy Story, qual brinquedo acha que é um astronauta de verdade?", choices: ["Woody", "Buzz Lightyear", "Jessie", "Rex"], answer: 1 },
  { q: "Qual é a frase de Buzz Lightyear em Toy Story?", choices: ["Ao infinito e além!", "Eu voltarei", "Que a Força esteja com você", "Telefonar para casa"], answer: 0 },
  { q: "Em Star Wars, como se chama a arma laser dos Jedi?", choices: ["Blaster", "Sabre de luz", "Phaser", "Bastão de força"], answer: 1 },
  { q: "Qual desenho mostra uma família vivendo no futuro com carros voadores?", choices: ["Os Flintstones", "Os Jetsons", "Scooby-Doo", "Bob Esponja"], answer: 1 },
  { q: "Em E.T., qual doce o menino usa para atrair o alienígena?", choices: ["M&M's", "Reese's Pieces", "Skittles", "Bis"], answer: 1 },
  { q: "Qual destes é um clássico filme de ficção ambientado em Marte?", choices: ["Perdido em Marte", "Titanic", "Rocky", "O Rei Leão"], answer: 0 },
];

function buildFallbackQuiz(level: number, destinationName: string): QuizQuestion[] {
  const themed: QuizQuestion = {
    q: `Antes de pousar em ${destinationName}, qual item é essencial para começar uma viagem espacial segura?`,
    choices: ["Passaporte da viagem", "Guarda-chuva comum", "Patins", "Bola de praia"],
    answer: 0,
  };

  const seed = `${destinationName}-${level}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;

  const ordered = [...FALLBACK_QUIZ_BANK].sort((a, b) => {
    const ah = (hash ^ a.q.length) >>> 0;
    const bh = (hash ^ b.q.length) >>> 0;
    return ah - bh || a.q.localeCompare(b.q);
  });

  return [themed, ...ordered.slice(0, QUESTIONS_PER_QUIZ - 1)];
}

async function generateQuizWithAI(level: number, destinationName: string): Promise<QuizQuestion[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return buildFallbackQuiz(level, destinationName);
  const prompt = `Gere ${QUESTIONS_PER_QUIZ} perguntas DIVERTIDAS e LEVES de múltipla escolha em PT-BR, nível ${level}/5 de dificuldade, ambientadas na viagem ao destino "${destinationName}". Cada pergunta deve ter uma resposta que qualquer pessoa possa confirmar com uma busca rápida no Google — use fatos populares, curiosidades famosas e referências bem conhecidas. Misture temas POP e ACESSÍVEIS. Tom: descontraído, como um quiz de bar. Responda APENAS com JSON válido: {"questions":[{"q":"...","choices":["a","b","c","d"],"answer":0}]} onde "answer" é o índice (0-3) da correta. Sem texto fora do JSON.`;

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
    return buildFallbackQuiz(level, destinationName);
  }
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = j.choices?.[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { return buildFallbackQuiz(level, destinationName); }
  const arr = (parsed as { questions?: QuizQuestion[] }).questions ?? [];
  if (!Array.isArray(arr) || arr.length < QUESTIONS_PER_QUIZ) return buildFallbackQuiz(level, destinationName);
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
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey) throw new Error("Viagem não encontrada");
    if (journey.status !== "active") throw new Error("Esta viagem já terminou");

    const dest = getDestination(data.destinationId);
    if (!dest) throw new Error("Destino inválido");

    const { data: already } = await supabaseAdmin
      .from("visas").select("id").eq("journey_id", journey.id).eq("destination_id", dest.id).maybeSingle();
    if (already) throw new Error("Você já visitou esse destino");

    const questions = await generateQuizWithAI(dest.level, dest.name);
    return { questions, level: dest.level, destination: dest, attemptsUsed: journey.attempts_used };
  });

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    journeyId: z.string().uuid(),
    destinationId: z.string().min(1).max(64),
    questions: z.array(z.object({ q: z.string(), choices: z.array(z.string()), answer: z.number() })).length(QUESTIONS_PER_QUIZ),
    answers: z.array(z.number().min(0).max(3)).length(QUESTIONS_PER_QUIZ),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey || journey.status !== "active") throw new Error("Viagem inválida");

    const dest = getDestination(data.destinationId);
    if (!dest) throw new Error("Destino inválido");

    const score = data.answers.reduce((acc, a, i) => acc + (a === data.questions[i].answer ? 1 : 0), 0);
    const passed = score / QUESTIONS_PER_QUIZ >= QUIZ_PASS_RATIO;

    await supabaseAdmin.from("quiz_attempts").insert({
      user_id: userId, journey_id: journey.id, level: dest.level,
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

export const claimVisa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    journeyId: z.string().uuid(),
    destinationId: z.string().min(1).max(64),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("id", data.journeyId).eq("user_id", userId).maybeSingle();
    if (!journey || journey.status !== "active") throw new Error("Viagem inválida");

    const dest = getDestination(data.destinationId);
    if (!dest) throw new Error("Destino inválido");

    const { error } = await supabaseAdmin.from("visas").insert({
      user_id: userId, journey_id: journey.id, destination_id: dest.id,
      destination_name: dest.name, transport: dest.transport, kind: "normal",
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);

    const newLevel = journey.current_level + 1;
    if (newLevel > DESTINATIONS.length) {
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
    return { ok: true };
  });

export const completeJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ journeyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
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
