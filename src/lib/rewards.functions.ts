import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const MAX_PER_WINDOW = 7;
const WINDOW_HOURS = 3;

export const getVideoAdStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString();
    const { data, error } = await context.supabase
      .from("video_ad_claims")
      .select("created_at")
      .eq("user_id", context.userId)
      .gt("created_at", since)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const claims = data ?? [];
    const remaining = Math.max(0, MAX_PER_WINDOW - claims.length);
    let nextAvailableAt: string | null = null;
    if (remaining === 0 && claims[0]) {
      nextAvailableAt = new Date(new Date(claims[0].created_at).getTime() + WINDOW_HOURS * 3600 * 1000).toISOString();
    }
    return { remaining, used: claims.length, max: MAX_PER_WINDOW, nextAvailableAt, rewardFichas: 5 };
  });

export const claimVideoAdReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_video_ad_reward" as never);
    if (error) throw new Error(error.message);
    return data as { balance: number; claims_in_window: number; remaining: number };
  });

export const getSubscribersList = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase
    .from("public_subscribers" as never)
    .select("user_id, display_name, avatar_url, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const { data: countData } = await supabase.rpc("subscribers_count" as never);
  return {
    total: (countData as number | null) ?? (data?.length ?? 0),
    subscribers: (data ?? []) as Array<{ user_id: string; display_name: string; avatar_url: string | null; created_at: string }>,
  };
});
