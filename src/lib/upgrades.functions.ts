import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyUpgrades = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: ups }, { data: wallet }] = await Promise.all([
      supabase.from("nave_upgrades").select("*").eq("user_id", userId),
      supabase.from("wallets").select("fichas").eq("user_id", userId).maybeSingle(),
    ]);
    return { upgrades: ups ?? [], fichas: wallet?.fichas ?? 0 };
  });

export const purchaseUpgradeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    upgradeKey: z.enum(["speed", "shield", "radar", "energy", "cargo"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: newLevel, error } = await supabaseAdmin.rpc("purchase_upgrade", {
      _caller_id: context.userId,
      _upgrade_key: data.upgradeKey,
    });
    if (error) throw new Error(error.message);
    return { newLevel: newLevel as number };
  });
