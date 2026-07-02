import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AD_REWARD_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const AD_REWARD_AMOUNT_MAX = 5;

export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    let { data } = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle();
    if (!data) {
      // First-time wallet creation goes through the SECURITY DEFINER fn (admin)
      // since direct INSERT was removed from the RLS policies.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("wallets").insert({ user_id: userId });
      const fresh = await supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle();
      data = fresh.data;
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
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: balance, error } = await supabaseAdmin.rpc("adjust_fichas", {
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
      reason: z.enum(["video_assistido"]),
      meta: z.record(z.any()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Ad-watch rewards: cap server-side and enforce a cooldown per user.
    // Battle/team-win rewards are NOT exposed here — they are credited
    // exclusively from inside finalize_battle() server-side.
    let amount = data.amount;
    if (data.reason === "video_assistido") {
      amount = Math.min(amount, AD_REWARD_AMOUNT_MAX);
      const { data: w } = await supabaseAdmin
        .from("wallets").select("last_ad_reward_at").eq("user_id", userId).maybeSingle();
      const last = w?.last_ad_reward_at ? new Date(w.last_ad_reward_at).getTime() : 0;
      const now = Date.now();
      if (last && now - last < AD_REWARD_COOLDOWN_MS) {
        const waitMs = AD_REWARD_COOLDOWN_MS - (now - last);
        const waitMin = Math.ceil(waitMs / 60000);
        throw new Error(`Aguarde ${waitMin} min para ganhar outra recompensa por vídeo`);
      }
    }

    const { data: balance, error } = await supabaseAdmin.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: amount,
      _reason: data.reason,
      _meta: data.meta ?? null,
    });
    if (error) throw new Error(error.message);

    if (data.reason === "video_assistido") {
      await supabaseAdmin.from("wallets")
        .update({ last_ad_reward_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    return { balance: balance as number };
  });

/**
 * Reivindica a recompensa de vídeo (5 fichas) usando o RPC seguro
 * `claim_video_ad_reward`, que impõe 7 reivindicações a cada 3 horas
 * por usuário. Se estiver em cooldown, a RPC lança `cooldown_active:<ISO>`.
 */
export const claimVideoAdReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("claim_video_ad_reward");
    if (error) {
      const msg = error.message ?? "";
      const m = msg.match(/cooldown_active:(.+)$/);
      if (m) {
        const nextAt = m[1].trim();
        throw new Error(`cooldown:${nextAt}`);
      }
      throw new Error(msg);
    }
    return data as { balance: number; claims_in_window: number; remaining: number };
  });

/** Retorna quantas reivindicações restam na janela atual (3h) e quando libera. */
export const getVideoAdStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("video_ad_claims")
      .select("created_at")
      .eq("user_id", userId)
      .gt("created_at", since)
      .order("created_at", { ascending: true });
    const claims = data ?? [];
    const used = claims.length;
    const remaining = Math.max(0, 7 - used);
    const nextAt =
      remaining === 0 && claims[0]
        ? new Date(new Date(claims[0].created_at).getTime() + 3 * 60 * 60 * 1000).toISOString()
        : null;
    return { used, remaining, nextAt };
  });

