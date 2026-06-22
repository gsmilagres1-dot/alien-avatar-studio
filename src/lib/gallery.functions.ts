import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listIdentitiesWithJourneys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: identities } = await supabaseAdmin
      .from("identities").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    const { data: journeys } = await supabaseAdmin
      .from("journeys").select("*").eq("user_id", userId);
    const { data: visas } = await supabaseAdmin
      .from("visas").select("*").eq("user_id", userId).order("issued_at");
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
    };
  });
