import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildAvatarPrompt, buildShipPrompt, generateAlienIdentity, PLANETS, SHIPS } from "@/lib/alien";

const GATEWAY_IMG = "https://ai.gateway.lovable.dev/v1/images/generations";

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
    if (pay.credits_remaining < 1) throw new Error("Esse pagamento já foi usado");

    // Count existing drafts for this payment (max 3)
    const { count } = await supabaseAdmin
      .from("avatar_drafts")
      .select("id", { count: "exact", head: true })
      .eq("payment_id", data.paymentId);
    if ((count ?? 0) >= 3) throw new Error("Limite de 3 avatares por pagamento atingido");

    const variant = count ?? 0;
    const planet = PLANETS.find((p) => p.id === data.planetId) ?? PLANETS[2];
    const prompt = buildAvatarPrompt({
      planet: planet.name,
      species: planet.species,
      gender: data.gender,
      variant,
    });

    const bytes = await generateImage(prompt, data.photoDataUrl);
    const url = await uploadImage(userId, "avatar", bytes);

    const { data: draft, error: insErr } = await supabaseAdmin
      .from("avatar_drafts")
      .insert({
        user_id: userId,
        payment_id: data.paymentId,
        avatar_url: url,
        variant_index: variant + 1,
      })
      .select("id, avatar_url, variant_index")
      .single();
    if (insErr) throw new Error(insErr.message);

    return { draft };
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
    if (pay.credits_remaining < 1) throw new Error("Pagamento já consumido");

    const { data: draft } = await supabaseAdmin
      .from("avatar_drafts")
      .select("id, avatar_url, user_id, payment_id")
      .eq("id", data.draftId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!draft || draft.payment_id !== data.paymentId) throw new Error("Avatar inválido");

    const id = generateAlienIdentity({
      name: data.humanName,
      birthdate: data.birthdate,
      planetId: data.planetId as never,
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
        planet_id: data.planetId,
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

    await supabaseAdmin
      .from("payment_transactions")
      .update({ credits_remaining: 0 })
      .eq("id", data.paymentId);

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

    const planet = PLANETS.find((p) => p.id === ident.planet_id) ?? PLANETS[2];
    const prompt = buildShipPrompt(data.category, planet.name);
    const bytes = await generateImage(prompt);
    const url = await uploadImage(userId, "ship", bytes);

    await supabaseAdmin
      .from("identities")
      .update({ ship_category: data.category, ship_image_url: url })
      .eq("id", data.identityId);

    return { shipImageUrl: url, category: data.category };
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
    const { error } = await supabaseAdmin.from("identities").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
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
      .gt("credits_remaining", 0)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Modo grátis: auto-cria um "crédito" de identidade sem cobrança
    if (!data) {
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
    }

    if (!data) return { payment: null, drafts: [] };

    const { data: drafts } = await supabaseAdmin
      .from("avatar_drafts")
      .select("id, avatar_url, variant_index, created_at")
      .eq("payment_id", data.id)
      .eq("user_id", userId)
      .order("variant_index", { ascending: true });

    return { payment: data, drafts: drafts ?? [] };
  });
