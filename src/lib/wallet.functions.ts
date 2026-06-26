import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    let { data } = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle();
    if (!data) {
      const ins = await supabase.from("wallets").insert({ user_id: userId }).select("*").single();
      data = ins.data;
    }
    return data;
  });

export const spendFichas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      amount: z.number().int().positive().max(10000),
      reason: z.enum([
        "sos_voltar_pergunta_quiz",
        "sos_voltar_pergunta_viagem",
        "sos_resgate_vacuo",
        "sos_resgate_completo",
        "upgrade_motor",
        "aposta_equipe",
      ]),
      meta: z.record(z.any()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: balance, error } = await supabase.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: -data.amount,
      _reason: data.reason,
      _meta: data.meta ?? null,
    });
    if (error) throw new Error(error.message);
    return { balance: balance as number };
  });

export const earnFichas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      amount: z.number().int().positive().max(500),
      reason: z.enum(["video_assistido", "vitoria_equipe"]),
      meta: z.record(z.any()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: balance, error } = await supabase.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: data.amount,
      _reason: data.reason,
      _meta: data.meta ?? null,
    });
    if (error) throw new Error(error.message);
    return { balance: balance as number };
  });
