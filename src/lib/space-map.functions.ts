import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
