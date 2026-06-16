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

// Banco temático por destino: 5 perguntas exclusivas para cada um dos 15 destinos = 75 perguntas únicas.
const DESTINATION_QUESTIONS: Record<string, QuizQuestion[]> = {
  mercurio: [
    { q: "Mercúrio é o planeta mais próximo de quê?", choices: ["Lua", "Sol", "Terra", "Marte"], answer: 1 },
    { q: "Mercúrio tem atmosfera densa como a da Terra?", choices: ["Sim, idêntica", "Não, é praticamente nula", "Sim, só de oxigênio", "Sim, só à noite"], answer: 1 },
    { q: "Qual a característica marcante da superfície de Mercúrio?", choices: ["Oceanos azuis", "Florestas", "Crateras como a da Lua", "Anéis de gelo"], answer: 2 },
    { q: "Mercúrio é maior ou menor que a Terra?", choices: ["Muito maior", "Igual", "Menor", "Do tamanho de Júpiter"], answer: 2 },
    { q: "O nome Mercúrio vem de qual mitologia?", choices: ["Egípcia", "Nórdica", "Romana", "Japonesa"], answer: 2 },
    { q: "Quanto dura um ano em Mercúrio (aproximadamente)?", choices: ["88 dias terrestres", "1 ano terrestre", "10 anos", "100 dias"], answer: 0 },
  ],
  venus: [
    { q: "Vênus é conhecido como planeta gêmeo de qual outro?", choices: ["Marte", "Terra", "Júpiter", "Saturno"], answer: 1 },
    { q: "Vênus é famoso por ser extremamente:", choices: ["Frio", "Quente", "Úmido", "Verde"], answer: 1 },
    { q: "Qual deusa dá nome a Vênus?", choices: ["Da guerra", "Do amor e beleza", "Da caça", "Do mar"], answer: 1 },
    { q: "Vênus gira em qual sentido em relação à maioria dos planetas?", choices: ["Mesmo sentido", "Sentido contrário", "Não gira", "De lado"], answer: 1 },
    { q: "Vênus é visível da Terra como:", choices: ["Estrela d'alva", "Cometa", "Buraco negro", "Galáxia"], answer: 0 },
    { q: "A atmosfera de Vênus é feita principalmente de:", choices: ["Oxigênio", "Dióxido de carbono", "Hélio", "Água"], answer: 1 },
  ],
  marte: [
    { q: "Marte é conhecido como Planeta:", choices: ["Azul", "Vermelho", "Verde", "Branco"], answer: 1 },
    { q: "Em Perdido em Marte, com Matt Damon, qual planta o astronauta cultiva?", choices: ["Tomate", "Batata", "Milho", "Alface"], answer: 1 },
    { q: "Quantas luas Marte possui?", choices: ["0", "1", "2", "10"], answer: 2 },
    { q: "Qual o nome do maior vulcão de Marte (e do Sistema Solar)?", choices: ["Olympus Mons", "Vesúvio", "Fuji", "Etna"], answer: 0 },
    { q: "Qual empresa de Elon Musk planeja levar humanos a Marte?", choices: ["Tesla", "SpaceX", "Boring", "Neuralink"], answer: 1 },
    { q: "Como se chamam as duas luas de Marte?", choices: ["Fobos e Deimos", "Lua e Sol", "Titã e Europa", "Caronte e Tritão"], answer: 0 },
  ],
  jupiter: [
    { q: "Júpiter é o ___ planeta do Sistema Solar.", choices: ["Menor", "Maior", "Mais frio", "Mais próximo do Sol"], answer: 1 },
    { q: "Júpiter tem uma tempestade gigante chamada:", choices: ["Olho do Furacão", "Grande Mancha Vermelha", "Tornado Azul", "Buraco Branco"], answer: 1 },
    { q: "Qual destas é uma lua de Júpiter?", choices: ["Europa", "Titã", "Lua", "Fobos"], answer: 0 },
    { q: "Júpiter é majoritariamente feito de:", choices: ["Pedra e ferro", "Água", "Hidrogênio e hélio", "Gelo"], answer: 2 },
    { q: "Júpiter recebeu nome de qual deus romano?", choices: ["Da guerra", "Rei dos deuses", "Do mar", "Do amor"], answer: 1 },
    { q: "Júpiter é um planeta:", choices: ["Rochoso", "Gasoso", "De gelo", "De fogo"], answer: 1 },
  ],
  saturno: [
    { q: "Saturno é famoso por ter:", choices: ["Vida", "Anéis visíveis", "Florestas", "Oceanos"], answer: 1 },
    { q: "Os anéis de Saturno são feitos principalmente de:", choices: ["Metal", "Gelo e rocha", "Plástico", "Gás"], answer: 1 },
    { q: "Qual a maior lua de Saturno?", choices: ["Europa", "Titã", "Lua", "Fobos"], answer: 1 },
    { q: "Saturno é um planeta:", choices: ["Rochoso", "Gasoso", "De gelo puro", "De fogo"], answer: 1 },
    { q: "Saturno é o ___ maior planeta do Sistema Solar.", choices: ["Primeiro", "Segundo", "Terceiro", "Último"], answer: 1 },
    { q: "A lua Titã, de Saturno, é conhecida por ter:", choices: ["Florestas", "Atmosfera densa e lagos de metano", "Oceano de chocolate", "Cidades"], answer: 1 },
  ],
  urano: [
    { q: "Urano tem qual cor predominante?", choices: ["Vermelho", "Azul-esverdeado", "Amarelo", "Preto"], answer: 1 },
    { q: "Urano gira de um jeito incomum porque está:", choices: ["Em pé", "Deitado de lado", "Parado", "Ao contrário"], answer: 1 },
    { q: "Urano é classificado como:", choices: ["Gigante rochoso", "Gigante gelado", "Estrela anã", "Asteroide"], answer: 1 },
    { q: "Quem descobriu Urano em 1781?", choices: ["Galileu", "William Herschel", "Newton", "Einstein"], answer: 1 },
    { q: "Urano fica antes ou depois de Netuno?", choices: ["Antes", "Depois", "No mesmo lugar", "Dentro de Netuno"], answer: 0 },
    { q: "Urano também tem anéis?", choices: ["Sim, mas pouco visíveis", "Não tem nenhum", "Tem só 1 grande", "Tem mais que Saturno"], answer: 0 },
  ],
  netuno: [
    { q: "Netuno é conhecido pela cor:", choices: ["Vermelha", "Azul intensa", "Amarela", "Branca"], answer: 1 },
    { q: "Netuno é o planeta mais distante do Sol?", choices: ["Sim", "Não, Plutão é", "Não, Marte é", "Não, Mercúrio é"], answer: 0 },
    { q: "Netuno recebeu nome do deus romano de:", choices: ["Guerra", "Mar", "Sol", "Amor"], answer: 1 },
    { q: "Netuno tem ventos:", choices: ["Inexistentes", "Os mais rápidos do Sistema Solar", "Quentes", "De vapor"], answer: 1 },
    { q: "Qual destas é uma lua de Netuno?", choices: ["Tritão", "Titã", "Europa", "Fobos"], answer: 0 },
    { q: "Netuno foi descoberto por cálculos matemáticos no século:", choices: ["XVII", "XVIII", "XIX", "XX"], answer: 2 },
  ],
  plutao: [
    { q: "Plutão é hoje classificado como:", choices: ["Planeta", "Lua", "Planeta anão", "Cometa"], answer: 2 },
    { q: "Em que ano Plutão perdeu o status de planeta principal?", choices: ["1995", "2006", "2015", "2020"], answer: 1 },
    { q: "Qual a maior lua de Plutão?", choices: ["Caronte", "Europa", "Titã", "Lua"], answer: 0 },
    { q: "Plutão é mais perto ou mais longe do Sol que Netuno?", choices: ["Sempre mais perto", "Em geral mais longe", "Mesma distância", "Está dentro do Sol"], answer: 1 },
    { q: "Plutão recebeu nome do deus romano do:", choices: ["Mundo dos mortos", "Trovão", "Mar", "Sol"], answer: 0 },
    { q: "Qual sonda da NASA visitou Plutão em 2015?", choices: ["Voyager 1", "New Horizons", "Cassini", "Juno"], answer: 1 },
  ],
  kepler: [
    { q: "Kepler-22b é:", choices: ["Uma lua", "Um exoplaneta", "Uma galáxia", "Um cometa"], answer: 1 },
    { q: "Kepler-22b foi descoberto por qual telescópio?", choices: ["Hubble", "Kepler", "James Webb", "Galileo"], answer: 1 },
    { q: "Exoplanetas são planetas que orbitam:", choices: ["O nosso Sol", "Outras estrelas", "A Lua", "Buracos negros apenas"], answer: 1 },
    { q: "Kepler-22b foi notícia porque pode ter:", choices: ["Vulcões ativos", "Água líquida", "Anéis", "Vida confirmada"], answer: 1 },
    { q: "O telescópio Kepler pertence a qual agência?", choices: ["NASA", "ESA", "Roscosmos", "JAXA"], answer: 0 },
    { q: "Kepler-22b está em qual zona da sua estrela?", choices: ["Zona morta", "Zona habitável", "Zona de gelo", "Dentro da estrela"], answer: 1 },
  ],
  proxima: [
    { q: "Proxima Centauri é a estrela mais ___ do Sol.", choices: ["Brilhante", "Próxima", "Distante", "Antiga"], answer: 1 },
    { q: "Proxima Centauri b orbita uma estrela do tipo:", choices: ["Anã vermelha", "Gigante azul", "Buraco negro", "Estrela de nêutrons"], answer: 0 },
    { q: "Quantos anos-luz a Proxima Centauri está da Terra (aprox.)?", choices: ["4", "100", "1.000", "1 milhão"], answer: 0 },
    { q: "Em Star Wars, qual a velocidade usada para cruzar grandes distâncias?", choices: ["Do som", "Hiperespaço (velocidade da luz)", "Do vento", "Andando"], answer: 1 },
    { q: "O sistema Alpha Centauri tem quantas estrelas principais?", choices: ["1", "2", "3", "10"], answer: 2 },
    { q: "Buraco de minhoca é um conceito de qual filme famoso?", choices: ["Titanic", "Interestelar", "Rocky", "Frozen"], answer: 1 },
  ],
  sol: [
    { q: "O Sol é classificado como:", choices: ["Planeta", "Lua", "Estrela", "Cometa"], answer: 2 },
    { q: "De que cor o Sol é representado?", choices: ["Amarelo", "Verde", "Preto", "Rosa"], answer: 0 },
    { q: "O Sol está no centro de qual sistema?", choices: ["Sistema Solar", "Andrômeda", "Buraco Negro", "Sistema da Lua"], answer: 0 },
    { q: "A energia do Sol vem de qual processo?", choices: ["Combustão", "Fusão nuclear", "Eletricidade", "Atrito"], answer: 1 },
    { q: "Quanto tempo a luz do Sol leva pra chegar à Terra?", choices: ["8 segundos", "8 minutos", "8 horas", "8 dias"], answer: 1 },
    { q: "O Sol é feito principalmente de:", choices: ["Pedra", "Hidrogênio e hélio", "Água", "Ferro"], answer: 1 },
  ],
  alpha_a: [
    { q: "Alpha Centauri A está em qual constelação?", choices: ["Centauro", "Órion", "Cruzeiro do Sul", "Pégaso"], answer: 0 },
    { q: "Alpha Centauri A é parecida com qual estrela?", choices: ["Sol", "Sirius", "Betelgeuse", "Lua"], answer: 0 },
    { q: "Alpha Centauri é visível principalmente em qual hemisfério?", choices: ["Norte", "Sul", "Nenhum", "Marte"], answer: 1 },
    { q: "Velas solares são impulsionadas por:", choices: ["Combustível líquido", "Luz das estrelas", "Vento comum", "Eletricidade"], answer: 1 },
    { q: "Sistemas estelares múltiplos têm:", choices: ["1 estrela", "Várias estrelas orbitando entre si", "Só planetas", "Só luas"], answer: 1 },
    { q: "Alpha Centauri A é a estrela mais ___ desse sistema.", choices: ["Pequena", "Brilhante", "Fria", "Antiga"], answer: 1 },
  ],
  betelgeuse: [
    { q: "Betelgeuse fica na constelação de:", choices: ["Órion", "Centauro", "Cruzeiro", "Touro"], answer: 0 },
    { q: "Betelgeuse é uma estrela:", choices: ["Anã branca", "Supergigante vermelha", "De nêutrons", "Anã amarela"], answer: 1 },
    { q: "Betelgeuse é candidata a explodir como:", choices: ["Buraco negro pequeno", "Supernova", "Cometa", "Asteroide"], answer: 1 },
    { q: "Qual filme de Tim Burton tem 'Beetlejuice' no nome?", choices: ["Edward Mãos de Tesoura", "Os Fantasmas se Divertem", "Batman", "Frankenweenie"], answer: 1 },
    { q: "Órion é famosa pelas suas:", choices: ["3 estrelas em linha (Três Marias)", "Anéis", "Luas", "Crateras"], answer: 0 },
    { q: "Betelgeuse é uma das estrelas mais ___ visíveis no céu noturno.", choices: ["Apagadas", "Brilhantes", "Escondidas", "Pequenas"], answer: 1 },
  ],
  lua: [
    { q: "Qual satélite natural orbita a Terra?", choices: ["Europa", "Lua", "Titã", "Fobos"], answer: 1 },
    { q: "Em que ano o homem pisou na Lua pela primeira vez?", choices: ["1959", "1969", "1979", "1989"], answer: 1 },
    { q: "Qual astronauta deu o primeiro passo na Lua?", choices: ["Yuri Gagarin", "Neil Armstrong", "Buzz Aldrin", "Elon Musk"], answer: 1 },
    { q: "A Lua influencia diretamente o que na Terra?", choices: ["Cor do céu", "Marés", "Vento solar", "Eclipses do Sol apenas"], answer: 1 },
    { q: "A Lua é maior ou menor que a Terra?", choices: ["Maior", "Igual", "Menor", "Tamanho do Sol"], answer: 2 },
    { q: "Qual o nome da missão que levou o homem à Lua em 1969?", choices: ["Apollo 11", "Soyuz", "Gemini", "Mercury"], answer: 0 },
  ],
  europa: [
    { q: "Europa é uma lua de qual planeta?", choices: ["Marte", "Saturno", "Júpiter", "Netuno"], answer: 2 },
    { q: "Europa interessa cientistas porque pode ter:", choices: ["Vulcões de chocolate", "Oceano de água sob o gelo", "Florestas", "Desertos"], answer: 1 },
    { q: "Quem descobriu Europa no século XVII?", choices: ["Galileu Galilei", "Einstein", "Newton", "Hubble"], answer: 0 },
    { q: "A superfície de Europa é coberta principalmente por:", choices: ["Areia", "Gelo", "Lava", "Água líquida exposta"], answer: 1 },
    { q: "Europa é uma das quatro luas chamadas:", choices: ["Galileanas", "Pequenas", "Solares", "Lunares"], answer: 0 },
    { q: "Qual missão da NASA estudará Europa nos próximos anos?", choices: ["Europa Clipper", "Voyager 5", "Mars Rover", "Apollo 20"], answer: 0 },
  ],
};

function destinationKey(destinationName: string): string | null {
  const map: Record<string, string> = {
    "Mercúrio": "mercurio", "Vênus": "venus", "Marte": "marte", "Júpiter": "jupiter",
    "Saturno": "saturno", "Urano": "urano", "Netuno": "netuno", "Plutão": "plutao",
    "Kepler-22b": "kepler", "Proxima Centauri b": "proxima", "Sol": "sol",
    "Alpha Centauri A": "alpha_a", "Betelgeuse": "betelgeuse", "Lua": "lua",
    "Europa (lua de Júpiter)": "europa",
  };
  return map[destinationName] ?? null;
}

function buildFallbackQuiz(level: number, destinationName: string): QuizQuestion[] {
  const key = destinationKey(destinationName);
  const themed = key ? DESTINATION_QUESTIONS[key] : null;
  const pool = themed && themed.length >= QUESTIONS_PER_QUIZ
    ? themed
    : Object.values(DESTINATION_QUESTIONS).flat();

  // Embaralhamento determinístico por destino+level: cada tentativa do mesmo destino
  // pode sortear um subset diferente das ~6 perguntas temáticas disponíveis.
  const seed = `${destinationName}-${level}-${Date.now() >> 16}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  const shuffled = [...pool].sort((a, b) => ((hash ^ a.q.length) >>> 0) - ((hash ^ b.q.length) >>> 0));
  return shuffled.slice(0, QUESTIONS_PER_QUIZ);
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
