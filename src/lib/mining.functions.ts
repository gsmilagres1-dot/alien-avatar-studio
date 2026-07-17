import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MATERIAL_KEYS = [
  "ouro",
  "cadmio",
  "niquel",
  "monumento",
  "ferramenta",
  "alien",
] as const;

export type MaterialKey = (typeof MATERIAL_KEYS)[number];

export const getMiningState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: state }, { data: progress }] = await Promise.all([
      supabase.from("mining_state").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("mining_progress").select("*").eq("user_id", userId),
    ]);

    return {
      level: state?.level ?? 1,
      landedCount: state?.landed_count ?? 0,
      crashedCount: state?.crashed_count ?? 0,
      progress: Object.fromEntries(
        MATERIAL_KEYS.map((key) => [
          key,
          progress?.find((p) => p.material_key === key)?.total_collected ?? 0,
        ])
      ) as Record<MaterialKey, number>,
    };
  });

export const submitMiningResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        materialKey: z.enum(MATERIAL_KEYS),
        success: z.boolean(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("submit_mining_result", {
      _caller_id: context.userId,
      _material_key: data.materialKey,
      _success: data.success,
    });
    if (error) throw new Error(error.message);return result as {
      level: number;
      landedCount: number;
      crashedCount: number;
      materialTotal: number | null;
      upgradeKey: string | null;
      upgradeLevel: number | null;
    };
  });
    
