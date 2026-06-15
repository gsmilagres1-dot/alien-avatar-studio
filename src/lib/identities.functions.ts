import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildAvatarPrompt, buildShipPrompt, generateAlienIdentity, getRace, raceFromBirthdate, RACES, SHIPS } from "@/lib/alien";
import shipEsportiva from "@/assets/ship-esportiva.jpg";
import shipOffroad from "@/assets/ship-offroad.jpg";
import shipCorrida from "@/assets/ship-corrida.jpg";

const GATEWAY_IMG = "https://ai.gateway.lovable.dev/v1/images/generations";

const FALLBACK_SHIP_IMAGES = {
  esportiva: shipEsportiva,
  offroad: shipOffroad,
  corrida: shipCorrida,
} satisfies Record<"esportiva" | "offroad" | "corrida", string>;

function isAiImageUnavailable(message: string) {
  return (
    message === "Créditos de IA esgotados" ||
    message === "Muitos pedidos à IA — espere um momento" ||
    message === "IA não retornou imagem" ||
    message.startsWith("Falha na IA (")
  );
}

async function generateImage(prompt: string, refImageDataUrl?: string): Promise<Buffer> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");

  const content: unknown[] = [{ type: "text", text: prompt }];
  if (refImageDataUrl) {
    content.push({ type: "image_url", image_url: { url: refImageDataUrl } });
  }

  const res = await fetch(GATEWAY_IMG, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("Muitos pedidos à IA — espere um momento");
    if (res.status === 402) throw new Error("Créditos de IA esgotados");
    throw new Error(`Falha na IA (${res.status}): ${text.slice(0, 200)}`);
  }
  const j = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = j.data?.[0]?.b64_json;
  if (!b64) throw new Error("IA não retornou imagem");
  return Buffer.from(b64, "base64");
}

async function uploadImage(userId: string, kind: string, bytes: Buffer): Promise<string> {
  const path = `${userId}/${kind}-${crypto.randomUUID()}.png`;
  const { error } = await supabaseAdmin.storage
    .from("alien-avatars")
    .upload(path, bytes, { contentType: "image/png", upsert: false });
  if (error) throw new Error(`Upload falhou: ${error.message}`);
  const { data } = supabaseAdmin.storage.from("alien-avatars").getPublicUrl(path);
  return data.publicUrl;
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
    if ((count ?? 0) >= 3) throw new Error("Limite de 3 avatares por pagamento atingido");

    const variant = count ?? 0;

    // Modo grátis: tenta IA; se falhar (créditos/limite), usa a própria foto como avatar.
    let bytes: Buffer;
    let kind = "avatar";
    let fallbackReason: string | null = null;
    try {
      const race = getRace(data.planetId);
      const prompt = buildAvatarPrompt({ race, gender: data.gender, variant });
      bytes = await generateImage(prompt, data.photoDataUrl);
    } catch (err) {
      fallbackReason = (err as Error).message;
      console.warn("AI avatar falhou, usando selfie original:", fallbackReason);
      const match = data.photoDataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
      if (!match) throw err;
      bytes = Buffer.from(match[1], "base64");
      kind = "selfie";
    }
    const url = await uploadImage(userId, kind, bytes);

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
    const { data, error } = await supabaseAdmin
      .from("identities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { identities: data ?? [] };
  });

export const deleteIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
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

    // Modo grátis: se não existir sessão recente utilizável, cria automaticamente
    if (!data || (data.credits_remaining < 1 && drafts.length === 0)) {
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

export const restartIdentityFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

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
