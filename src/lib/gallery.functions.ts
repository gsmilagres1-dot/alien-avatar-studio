import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listIdentitiesWithJourneys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabase } = context;
    const { data: identities, error: identitiesError } = await supabase
      .from("identities").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (identitiesError) throw new Error(identitiesError.message);
    const { data: journeys, error: journeysError } = await supabase
      .from("journeys").select("*").eq("user_id", userId);
    if (journeysError) throw new Error(journeysError.message);
    const { data: visas, error: visasError } = await supabase
      .from("visas").select("*").eq("user_id", userId).order("issued_at");
    if (visasError) throw new Error(visasError.message);
    const { data: drafts, error: draftsError } = await supabase
      .from("avatar_drafts")
      .select("id, avatar_url, variant_index, prompt_seed, payment_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (draftsError) throw new Error(draftsError.message);
    const { data: spaceSeals, error: spaceSealsError } = await supabase
      .from("space_map_seals")
      .select("id, object_id, object_name, object_kind, score, total, difficulty, tier, fichas_earned, issued_at")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false });
    if (spaceSealsError) throw new Error(spaceSealsError.message);
    const { data: spacePrizes, error: spacePrizesError } = await supabase
      .from("space_map_prizes")
      .select("id, prize_id, title, threshold, seals_count, image_url, claimed_at")
      .eq("user_id", userId)
      .order("claimed_at", { ascending: false });
    if (spacePrizesError) throw new Error(spacePrizesError.message);
    const usedAvatarUrls = new Set((identities ?? []).map((identity) => identity.avatar_url));
    const byIdent = new Map((journeys ?? []).map((j) => [j.identity_id, j]));
    type Visa = NonNullable<typeof visas>[number];
    const visasByJourney = new Map<string, Visa[]>();
    for (const v of visas ?? []) {
      if (!v.journey_id) continue;
      const arr = visasByJourney.get(v.journey_id) ?? [];
      arr.push(v);
      visasByJourney.set(v.journey_id, arr);
    }
    return {
      items: (identities ?? []).map((i) => {
        const journey = byIdent.get(i.id) ?? null;
        const vs = journey ? (visasByJourney.get(journey.id) ?? []) : [];
        return { identity: i, journey, visas: vs };
      }),
      drafts: (drafts ?? []).filter((draft) => !usedAvatarUrls.has(draft.avatar_url)),
      spaceSeals: spaceSeals ?? [],
      spacePrizes: spacePrizes ?? [],
    };
  });
