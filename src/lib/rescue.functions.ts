import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const RESCUE_COST = 500;

export const rescueLostIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ identityId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: journey } = await supabaseAdmin
      .from("journeys").select("*").eq("identity_id", data.identityId).eq("user_id", userId).maybeSingle();
    if (!journey) throw new Error("Viagem não encontrada");
    if (journey.status === "active") throw new Error("Esta viagem já está ativa");

    // Charge the user (RPC enforces sufficient balance)
    const { error: payErr } = await supabaseAdmin.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: -RESCUE_COST,
      _reason: "sos_resgate_completo",
      _meta: { identityId: data.identityId, journeyId: journey.id },
    });
    if (payErr) throw new Error(payErr.message);

    // Re-activate the journey, keeping visas/selos intact in gallery
    const { error: upErr } = await supabaseAdmin
      .from("journeys")
      .update({
        status: "active",
        attempts_used: 0,
        final_destination_name: null,
        final_destination_kind: null,
        completed_at: null,
      })
      .eq("id", journey.id);
    if (upErr) throw new Error(upErr.message);

    return { ok: true };
  });
