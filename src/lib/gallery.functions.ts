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
    const byIdent = new Map((journeys ?? []).map((j) => [j.identity_id, j]));
    return {
      items: (identities ?? []).map((i) => ({ identity: i, journey: byIdent.get(i.id) ?? null })),
    };
  });
