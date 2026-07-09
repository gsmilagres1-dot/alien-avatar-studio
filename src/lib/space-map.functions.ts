import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SPACE_OBJECTS } from "@/lib/space-objects";
import { SPACE_MAP_PRIZES } from "@/lib/space-map-prizes";
import { tierFromScore } from "@/lib/intergalactic";

/** Retorna o total de selos (visas) do usuário para desbloquear o Mapa Espacial. */
export const getMyVisaCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("visas")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    return { count: count ?? 0 };
  });

export const getSpaceMapState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: visaCount }, { data: seals }, { data: prizes }] = await Promise.all([
      supabaseAdmin
        .from("visas")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
      supabaseAdmin
        .from("space_map_seals")
        .select("id, object_id, object_name, object_kind, score, total, difficulty, tier, fichas_earned, issued_at")
        .eq("user_id", context.userId)
        .order("issued_at", { ascending: false }),
      supabaseAdmin
        .from("space_map_prizes")
        .select("id, prize_id, title, threshold, seals_count, image_url, claimed_at")
        .eq("user_id", context.userId)
        .order("claimed_at", { ascending: false }),
    ]);

    return { visaCount: visaCount ?? 0, seals: seals ?? [], prizes: prizes ?? [] };
  });

export const claimSpaceMapSeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      objectId: z.string().min(1).max(80),
      score: z.number().int().min(0).max(9),
      total: z.number().int().min(1).max(9).default(9),
      difficulty: z.number().int().min(0).max(3),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const object = SPACE_OBJECTS.find((item) => item.id === data.objectId);
    if (!object) throw new Error("Objeto espacial inválido");
    if (data.score / data.total < 0.7) throw new Error("É preciso acertar pelo menos 70% para receber o selo");

    const { data: existing } = await supabaseAdmin
      .from("space_map_seals")
      .select("id")
      .eq("user_id", context.userId)
      .eq("object_id", object.id)
      .maybeSingle();

    const { data: latestIdentity } = await supabaseAdmin
      .from("identities")
      .select("id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const tier = tierFromScore(data.score, data.total);
    const reward = tier === "gold" ? 25 : tier === "silver" ? 10 : 5;
    let fichasEarned = 0;

    if (!existing) {
      const { error } = await supabaseAdmin.from("space_map_seals").insert({
        user_id: context.userId,
        identity_id: latestIdentity?.id ?? null,
        object_id: object.id,
        object_name: object.name,
        object_kind: object.kind,
        score: data.score,
        total: data.total,
        difficulty: data.difficulty,
        tier,
        fichas_earned: reward,
      });
      if (error) throw new Error(error.message);
      try {
        await supabaseAdmin.rpc("adjust_fichas", {
          _user_id: context.userId,
          _delta: reward,
          _reason: `space_quiz_${tier}`,
          _meta: { objectId: object.id, score: data.score },
        });
        fichasEarned = reward;
      } catch { /* wallet may not exist yet */ }
    }

    const { data: seals } = await supabaseAdmin
      .from("space_map_seals")
      .select("id, object_id, object_name, object_kind, score, total, difficulty, tier, fichas_earned, issued_at")
      .eq("user_id", context.userId)
      .order("issued_at", { ascending: false });

    const sealCount = seals?.length ?? 0;
    const { data: currentPrizes } = await supabaseAdmin
      .from("space_map_prizes")
      .select("prize_id")
      .eq("user_id", context.userId);
    const claimed = new Set((currentPrizes ?? []).map((p) => p.prize_id));
    const newlyUnlocked = SPACE_MAP_PRIZES.filter((p) => sealCount >= p.threshold && !claimed.has(p.id));

    if (newlyUnlocked.length > 0) {
      const { error } = await supabaseAdmin.from("space_map_prizes").insert(
        newlyUnlocked.map((prize) => ({
          user_id: context.userId,
          identity_id: latestIdentity?.id ?? null,
          prize_id: prize.id,
          title: prize.title,
          threshold: prize.threshold,
          seals_count: sealCount,
          image_url: prize.image,
        })),
      );
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    }

    const { data: prizes } = await supabaseAdmin
      .from("space_map_prizes")
      .select("id, prize_id, title, threshold, seals_count, image_url, claimed_at")
      .eq("user_id", context.userId)
      .order("claimed_at", { ascending: false });

    return {
      ok: true,
      alreadyHadSeal: Boolean(existing),
      tier,
      fichasEarned,
      seals: seals ?? [],
      prizes: prizes ?? [],
      newPrizeIds: newlyUnlocked.map((p) => p.id),
    };
  });
