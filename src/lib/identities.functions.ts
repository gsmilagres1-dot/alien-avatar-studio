import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateAlienIdentity } from "@/lib/alien";
import {
  FALLBACK_RACE_IMAGES as serverFallbackRaceImages,
  FALLBACK_SHIP_IMAGES as serverFallbackShipImages,
  buildAvatarPromptForRace,
  buildShipPromptForRace,
  generateImage as serverGenerateImage,
  getAdmin,
  isAiImageUnavailable as serverIsAiImageUnavailable,
  storagePathFromPublicUrl as serverStoragePathFromPublicUrl,
  uploadImage as serverUploadImage,
} from "@/lib/identities.server";

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
    const { supabase } = context;

    // Verify payment belongs to user and has credits
    const { data: pay, error: payErr } = await supabase
      .from("payment_transactions")
      .select("id, user_id, status, credits_remaining")
      .eq("id", data.paymentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (payErr || !pay) throw new Error("Pagamento não encontrado");
    if (pay.status !== "completed") throw new Error("Pagamento ainda não confirmado");

    // Sem limite de avatares por pagamento (Dev e App Web).
    const { count } = await supabase
      .from("avatar_drafts")
      .select("id", { count: "exact", head: true })
      .eq("payment_id", data.paymentId);

    const variant = count ?? 0;


    // Tenta IA; se falhar, usa a imagem padrão da raça em vez de manter a selfie.
    let url: string;
    let fallbackReason: string | null = null;
    try {
      const prompt = buildAvatarPromptForRace(data.planetId, data.gender, variant);
      const bytes = await serverGenerateImage(prompt, data.photoDataUrl);
      url = await serverUploadImage(supabase, userId, "avatar", bytes);
    } catch (err) {
      fallbackReason = (err as Error).message;
      console.warn("AI avatar falhou, usando imagem padrão da raça:", fallbackReason);
      const raceImg = serverFallbackRaceImages[data.planetId];
      if (!raceImg) throw err;
      url = raceImg;
    }

    const { data: draft, error: insErr } = await supabase
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
    const { supabase } = context;
    const { data: pay } = await supabase
      .from("payment_transactions")
      .select("id, user_id, credits_remaining, status")
      .eq("id", data.paymentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!pay || pay.status !== "completed") throw new Error("Pagamento inválido");

    const { data: draft } = await supabase
      .from("avatar_drafts")
      .select("id, avatar_url, user_id, payment_id, prompt_seed")
      .eq("id", data.draftId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!draft || draft.payment_id !== data.paymentId) throw new Error("Avatar inválido");

    const { data: alreadyCreated } = await supabase
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

    const { data: ident, error: insErr } = await supabase
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
    const { supabase } = context;
    const { data: ident } = await supabase
      .from("identities")
      .select("id, user_id, planet_id")
      .eq("id", data.identityId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!ident) throw new Error("Identidade não encontrada");

    const prompt = buildShipPromptForRace(data.category, ident.planet_id);
    
    let bytes: Buffer;
    let fallbackReason: string | null = null;
    try {
      bytes = await serverGenerateImage(prompt);
    } catch (err) {
      fallbackReason = (err as Error).message;
      if (!serverIsAiImageUnavailable(fallbackReason)) throw err;
      console.warn("AI ship falhou, usando versão padrão:", fallbackReason);
      const url = serverFallbackShipImages[data.category];

      await supabase
        .from("identities")
        .update({ ship_category: data.category, ship_image_url: url })
        .eq("id", data.identityId);

      return { shipImageUrl: url, category: data.category, fallback: fallbackReason };
    }
    
    const url = await serverUploadImage(supabase, userId, "ship", bytes);

    await supabase
      .from("identities")
      .update({ ship_category: data.category, ship_image_url: url })
      .eq("id", data.identityId);

    return { shipImageUrl: url, category: data.category, fallback: fallbackReason };
});

export const listMyIdentities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabase } = context;
    const { data, error } = await supabase
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
    const { supabase } = context;
    const { data: source } = await supabase
      .from("identities")
      .select("id, user_id, avatar_url")
      .eq("id", data.sourceIdentityId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!source?.avatar_url) throw new Error("Avatar de origem não encontrado");

    const { error } = await supabase
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
    const { supabase } = context;
    const { data: identity, error: readErr } = await supabase
      .from("identities")
      .select("id, avatar_url, ship_image_url")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!identity) throw new Error("Identidade não encontrada");

    const { error } = await supabase.from("identities").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);

    const paths = [identity.avatar_url, identity.ship_image_url]
      .filter((value): value is string => Boolean(value))
      .map(serverStoragePathFromPublicUrl)
      .filter((value): value is string => Boolean(value));

    if (paths.length > 0) {
      await supabase.storage.from("alien-avatars").remove(paths);
    }

    return { ok: true };
  });

export const getActivePayment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabase } = context;
    let { data } = await supabase
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
      const { data: draftRows } = await supabase
        .from("avatar_drafts")
        .select("id, avatar_url, variant_index, created_at, prompt_seed")
        .eq("payment_id", data.id)
        .eq("user_id", userId)
        .order("variant_index", { ascending: true });
      drafts = draftRows ?? [];
    }

    // Modo grátis ilimitado: cria uma nova sessão sempre que não houver uma ativa.
    if (!data || (data.credits_remaining < 1 && drafts.length === 0)) {
      const supabaseAdmin = await getAdmin();
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

    const { data: usedIdentities } = await supabase
      .from("identities")
      .select("avatar_url")
      .eq("payment_id", data.id)
      .eq("user_id", userId);

    return { payment: data, drafts, usedAvatarUrls: (usedIdentities ?? []).map((row) => row.avatar_url) };
  });

const FREE_SESSION_COOLDOWN_MS = 0; // sem cooldown
const FREE_SESSION_LIFETIME_MAX = Number.POSITIVE_INFINITY; // ilimitado

export const restartIdentityFlow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const supabaseAdmin = await getAdmin();
    // Sem limite vitalício e sem cooldown: qualquer usuário pode reiniciar o fluxo livremente.




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

