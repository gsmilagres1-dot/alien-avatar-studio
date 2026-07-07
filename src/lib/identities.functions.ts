import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAvatarPrompt, buildShipPrompt, generateAlienIdentity, getRace, raceFromBirthdate, RACES, SHIPS } from "@/lib/alien";
import shipEsportiva from "@/assets/ship-esportiva.jpg";
import shipOffroad from "@/assets/ship-offroad.jpg";
import shipCorrida from "@/assets/ship-corrida.jpg";
import raceStarseed from "@/assets/race-starseed.jpg";
import raceNordico from "@/assets/race-nordico.jpg";
import raceGrey from "@/assets/race-grey.jpg";
import raceReptiliano from "@/assets/race-reptiliano.jpg";
import raceDraconiano from "@/assets/race-draconiano.jpg";
import raceInsectoide from "@/assets/race-insectoide.jpg";
import raceAviario from "@/assets/race-aviario.jpg";
import raceAnunnaki from "@/assets/race-anunnaki.jpg";
import raceSiriano from "@/assets/race-siriano.jpg";
import racePleiadiano from "@/assets/race-pleiadiano.jpg";
import raceLyriano from "@/assets/race-lyriano.jpg";
import raceKashyapa from "@/assets/race-kashyapa.jpg";

const GATEWAY_IMG = "https://ai.gateway.lovable.dev/v1/images/generations";

/**
 * Usuários "dev" (dono do app) — leem-se de DEV_USER_IDS (UUIDs separados
 * por vírgula). Para eles: geração ilimitada, sem cobrança e sem limites,
 * para criar avatares de propaganda para redes sociais.
 */
function isDevUser(userId: string): boolean {
  const raw = process.env.DEV_USER_IDS ?? "";
  if (!raw.trim()) return false;
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(userId.toLowerCase());
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const FALLBACK_SHIP_IMAGES = {
  esportiva: shipEsportiva,
  offroad: shipOffroad,
  corrida: shipCorrida,
} satisfies Record<"esportiva" | "offroad" | "corrida", string>;

const FALLBACK_RACE_IMAGES: Record<string, string> = {
  starseed: raceStarseed,
  nordico: raceNordico,
  grey: raceGrey,
  reptiliano: raceReptiliano,
  draconiano: raceDraconiano,
  insectoide: raceInsectoide,
  aviario: raceAviario,
  anunnaki: raceAnunnaki,
  siriano: raceSiriano,
  pleiadiano: racePleiadiano,
  lyriano: raceLyriano,
  kashyapa: raceKashyapa,
};

function isAiImageUnavailable(message: string) {
  return (
    message === "Créditos de IA esgotados" ||
    message === "Muitos pedidos à IA — espere um momento" ||
    message === "IA não retornou imagem" ||
    message.startsWith("Falha na IA (")
  );
}

function bufferFromImageDataUrl(dataUrl: string): { bytes: Buffer; contentType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("Imagem inválida");
  return { bytes: Buffer.from(match[2], "base64"), contentType: match[1] };
}

function bufferFromImageValue(value: string): Buffer | null {
  if (value.startsWith("data:image/")) return bufferFromImageDataUrl(value).bytes;
  if (/^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 200) return Buffer.from(value.replace(/\s/g, ""), "base64");
  return null;
}

function findImageValue(value: unknown, depth = 0): string | null {
  if (depth > 6 || value == null) return null;
  if (typeof value === "string") {
    if (value.startsWith("data:image/")) return value;
    const match = value.match(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/);
    return match?.[0] ?? null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageValue(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["b64_json", "url", "image_url", "images", "content", "message", "choices", "data", "output"]) {
      const found = findImageValue(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function extractGeneratedImage(response: unknown): Buffer {
  const dataUrl = findImageValue(response);
  if (dataUrl) {
    const bytes = bufferFromImageValue(dataUrl);
    if (bytes) return bytes;
  }
  const data = (response as { data?: { b64_json?: string; url?: string }[] })?.data;
  const value = data?.[0]?.b64_json ?? data?.[0]?.url;
  if (value) {
    const bytes = bufferFromImageValue(value);
    if (bytes) return bytes;
  }
  throw new Error("IA não retornou imagem");
}

async function generateImage(prompt: string, refImageDataUrl?: string): Promise<Buffer> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");

  // Nano Banana 2 Lite usa o body do Vertex generateContent (contents+parts),
  // não o shape de chat completions. inlineData é base64 puro (sem prefixo).
  const parts: unknown[] = [{ text: prompt }];
  if (refImageDataUrl) {
    const m = refImageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
  }

  const res = await fetch(GATEWAY_IMG, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-lite-image",
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Muitos pedidos à IA — espere um momento");
    if (res.status === 402) throw new Error("Créditos de IA esgotados");
    throw new Error(`Falha na IA (${res.status}): ${text.slice(0, 200)}`);
  }
  const j = await res.json();
  return extractGeneratedImage(j);
}

async function uploadImage(userId: string, kind: string, bytes: Buffer, contentType = "image/png"): Promise<string> {
  const supabaseAdmin = await getAdmin();
  const path = `${userId}/${kind}-${crypto.randomUUID()}.png`;
  const { error } = await supabaseAdmin.storage
    .from("alien-avatars")
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw new Error(`Upload falhou: ${error.message}`);
  const { data } = supabaseAdmin.storage.from("alien-avatars").getPublicUrl(path);
  return data.publicUrl;
}

async function uploadOriginalSelfie(userId: string, photoDataUrl: string): Promise<string> {
  const { bytes, contentType } = bufferFromImageDataUrl(photoDataUrl);
  return uploadImage(userId, "avatar-selfie", bytes, contentType);
}

function storagePathFromPublicUrl(publicUrl: string) {
  const marker = "/storage/v1/object/public/alien-avatars/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

const draftInput = z.object({
  photoDataUrl: z.string().startsWith("data:image/").max(15_000_000),
  planetId: z.string().min(1).max(32),
  gender: z.enum(["male", "female", "undefined"]),
  paymentId: z.string().uuid(),
});

export const createAvatarDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();

    // Verify payment belongs to user and has credits
    const { data: pay, error: payErr } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, user_id, status, credits_remaining")
      .eq("id", data.paymentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (payErr || !pay) throw new Error("Pagamento não encontrado");
    if (pay.status !== "completed") throw new Error("Pagamento ainda não confirmado");

    // Count existing drafts for this payment (max 3)
    const { count } = await supabaseAdmin
      .from("avatar_drafts")
      .select("id", { count: "exact", head: true })
      .eq("payment_id", data.paymentId);
    // Sem limite para o dono (DEV_USER_IDS) para criar avatares de propaganda.
    if (!isDevUser(userId) && (count ?? 0) >= 3) {
      throw new Error("Limite de 3 avatares por pagamento atingido");
    }

    const variant = count ?? 0;

    // Tenta IA; se o gateway estiver sem crédito/limite, salva a selfie enviada
    // como rascunho para o fluxo não perder dados nem bloquear a galeria.
    let url: string;
    let fallbackReason: string | null = null;
    try {
      const race = getRace(data.planetId);
      const prompt = buildAvatarPrompt({ race, gender: data.gender, variant });
      const bytes = await generateImage(prompt, data.photoDataUrl);
      url = await uploadImage(userId, "avatar", bytes);
    } catch (err) {
      fallbackReason = (err as Error).message;
      console.warn("AI avatar falhou, salvando selfie original:", fallbackReason);
      try {
        url = await uploadOriginalSelfie(userId, data.photoDataUrl);
      } catch {
        const raceImg = FALLBACK_RACE_IMAGES[data.planetId];
        if (!raceImg) throw err;
        url = raceImg;
      }
    }

    const { data: draft, error: insErr } = await supabaseAdmin
      .from("avatar_drafts")
      .insert({
        user_id: userId,
        payment_id: data.paymentId,
        avatar_url: url,
        prompt_seed: data.planetId,
        variant_index: variant + 1,
      })
      .select("id, avatar_url, variant_index, prompt_seed")
      .single();
    if (insErr) throw new Error(insErr.message);

    return { draft, fallback: fallbackReason };
  });


const saveInput = z.object({
  paymentId: z.string().uuid(),
  draftId: z.string().uuid(),
  humanName: z.string().min(1).max(80),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["male", "female", "undefined"]),
  planetId: z.string().min(1).max(32),
});

export const saveIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data: pay } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, user_id, credits_remaining, status")
      .eq("id", data.paymentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!pay || pay.status !== "completed") throw new Error("Pagamento inválido");

    const { data: draft } = await supabaseAdmin
      .from("avatar_drafts")
      .select("id, avatar_url, user_id, payment_id, prompt_seed")
      .eq("id", data.draftId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!draft || draft.payment_id !== data.paymentId) throw new Error("Avatar inválido");

    const { data: alreadyCreated } = await supabaseAdmin
      .from("identities")
      .select("id")
      .eq("user_id", userId)
      .eq("payment_id", data.paymentId)
      .eq("avatar_url", draft.avatar_url)
      .maybeSingle();
    if (alreadyCreated) throw new Error("Esse avatar já virou uma identidade");

    const id = generateAlienIdentity({
      name: data.humanName,
      birthdate: data.birthdate,
      planetId: (draft.prompt_seed || data.planetId) as never,
      gender: data.gender,
    });

    const { data: ident, error: insErr } = await supabaseAdmin
      .from("identities")
      .insert({
        user_id: userId,
        payment_id: data.paymentId,
        human_name: data.humanName,
        birthdate: data.birthdate,
        gender: data.gender,
        planet_id: draft.prompt_seed || data.planetId,
        alien_name: id.alienName,
        species: id.species,
        id_number: id.idNumber,
        rank: id.rank,
        license_class: id.licenseClass,
        galactic_birth: id.galacticBirth,
        avatar_url: draft.avatar_url,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    return { identity: ident };
  });

const shipInput = z.object({
  identityId: z.string().uuid(),
  category: z.enum(["esportiva", "offroad", "corrida"]),
});

export const generateShipImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => shipInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data: ident } = await supabaseAdmin
      .from("identities")
      .select("id, user_id, planet_id")
      .eq("id", data.identityId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!ident) throw new Error("Identidade não encontrada");

    const race = getRace(ident.planet_id);
    const prompt = buildShipPrompt(data.category, race.origin);
    
    let bytes: Buffer;
    let fallbackReason: string | null = null;
    try {
      bytes = await generateImage(prompt);
    } catch (err) {
      fallbackReason = (err as Error).message;
      if (!isAiImageUnavailable(fallbackReason)) throw err;
      console.warn("AI ship falhou, usando versão padrão:", fallbackReason);
      const url = FALLBACK_SHIP_IMAGES[data.category];

      await supabaseAdmin
        .from("identities")
        .update({ ship_category: data.category, ship_image_url: url })
        .eq("id", data.identityId);

      return { shipImageUrl: url, category: data.category, fallback: fallbackReason };
    }
    
    const url = await uploadImage(userId, "ship", bytes);

    await supabaseAdmin
      .from("identities")
      .update({ ship_category: data.category, ship_image_url: url })
      .eq("id", data.identityId);

    return { shipImageUrl: url, category: data.category, fallback: fallbackReason };
});

export const listMyIdentities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from("identities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { identities: data ?? [] };
  });

const setAvatarInput = z.object({
  identityId: z.string().uuid(),
  sourceIdentityId: z.string().uuid(),
});

/**
 * Troca o avatar de uma identidade do próprio usuário por outro avatar
 * já existente na galeria dele. Ambas identidades precisam pertencer ao
 * usuário autenticado.
 */
export const setIdentityAvatarFromGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => setAvatarInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data: source } = await supabaseAdmin
      .from("identities")
      .select("id, user_id, avatar_url")
      .eq("id", data.sourceIdentityId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!source?.avatar_url) throw new Error("Avatar de origem não encontrado");

    const { error } = await supabaseAdmin
      .from("identities")
      .update({ avatar_url: source.avatar_url, updated_at: new Date().toISOString() })
      .eq("id", data.identityId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true, avatarUrl: source.avatar_url };
  });

export const deleteIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const { data: identity, error: readErr } = await supabaseAdmin
      .from("identities")
      .select("id, avatar_url, ship_image_url")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!identity) throw new Error("Identidade não encontrada");

    const { error } = await supabaseAdmin.from("identities").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);

    const paths = [identity.avatar_url, identity.ship_image_url]
      .filter((value): value is string => Boolean(value))
      .map(storagePathFromPublicUrl)
      .filter((value): value is string => Boolean(value));

    if (paths.length > 0) {
      await supabaseAdmin.storage.from("alien-avatars").remove(paths);
    }

    return { ok: true };
  });

export const getActivePayment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    let { data } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, status, credits_remaining, created_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("kind", "identity")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let drafts: { id: string; avatar_url: string; variant_index: number; created_at: string; prompt_seed: string | null }[] = [];
    if (data) {
      const { data: draftRows } = await supabaseAdmin
        .from("avatar_drafts")
        .select("id, avatar_url, variant_index, created_at, prompt_seed")
        .eq("payment_id", data.id)
        .eq("user_id", userId)
        .order("variant_index", { ascending: true });
      drafts = draftRows ?? [];
    }

    // Modo grátis: cria sessão automaticamente apenas se o usuário ainda tem direito.
    // Apenas 1 sessão vitalícia gratuita. Dono do app (DEV_USER_IDS) tem sessão ilimitada.
    const dev = isDevUser(userId);
    if (!data || (data.credits_remaining < 1 && drafts.length === 0)) {
      const { count: totalFree } = await supabaseAdmin
        .from("payment_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("kind", "identity")
        .eq("amount_cents", 0);

      if (dev || (totalFree ?? 0) < 1) {
        const ins = await supabaseAdmin
          .from("payment_transactions")
          .insert({
            user_id: userId,
            amount_cents: 0,
            currency: "brl",
            status: "completed",
            credits_granted: 1,
            credits_remaining: 1,
            env: "sandbox",
            kind: "identity",
          })
          .select("id, status, credits_remaining, created_at")
          .single();
        data = ins.data;
        drafts = [];
      }
    }



    if (!data) {
      return { payment: null, drafts: [], usedAvatarUrls: [] };
    }

    const { data: usedIdentities } = await supabaseAdmin
      .from("identities")
      .select("avatar_url")
      .eq("payment_id", data.id)
      .eq("user_id", userId);

    return { payment: data, drafts, usedAvatarUrls: (usedIdentities ?? []).map((row) => row.avatar_url) };
  });

const FREE_SESSION_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const FREE_SESSION_LIFETIME_MAX = 1; // apenas 1 avatar grátis vitalício por usuário

export const restartIdentityFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    const dev = isDevUser(userId);

    if (!dev) {
      // Lifetime cap on free identity sessions to prevent abuse of free AI generation.
      const { count: totalFree } = await supabaseAdmin
        .from("payment_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("kind", "identity")
        .eq("amount_cents", 0);

      if ((totalFree ?? 0) >= FREE_SESSION_LIFETIME_MAX) {
        throw new Error("Você já usou seu avatar grátis. Compre +1 avatar por 250 fichas na galeria.");
      }

      // 24h cooldown between free sessions.
      const { data: lastFree } = await supabaseAdmin
        .from("payment_transactions")
        .select("created_at")
        .eq("user_id", userId)
        .eq("kind", "identity")
        .eq("amount_cents", 0)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastFree?.created_at) {
        const elapsed = Date.now() - new Date(lastFree.created_at).getTime();
        if (elapsed < FREE_SESSION_COOLDOWN_MS) {
          const waitHours = Math.ceil((FREE_SESSION_COOLDOWN_MS - elapsed) / (60 * 60 * 1000));
          throw new Error(`Aguarde ${waitHours}h para iniciar outra identidade gratuita.`);
        }
      }
    }


    const { data: openPayments, error: openErr } = await supabaseAdmin
      .from("payment_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("kind", "identity")
      .gt("credits_remaining", 0);

    if (openErr) throw new Error(openErr.message);

    const ids = openPayments?.map((payment) => payment.id) ?? [];
    if (ids.length > 0) {
      const { error: closeErr } = await supabaseAdmin
        .from("payment_transactions")
        .update({ credits_remaining: 0 })
        .in("id", ids);
      if (closeErr) throw new Error(closeErr.message);
    }

    const { data: payment, error } = await supabaseAdmin
      .from("payment_transactions")
      .insert({
        user_id: userId,
        amount_cents: 0,
        currency: "brl",
        status: "completed",
        credits_granted: 1,
        credits_remaining: 1,
        env: "sandbox",
        kind: "identity",
      })
      .select("id, status, credits_remaining, created_at")
      .single();

    if (error || !payment) throw new Error(error?.message ?? "Não foi possível iniciar uma nova identidade");

    return { payment, drafts: [] };
  });

