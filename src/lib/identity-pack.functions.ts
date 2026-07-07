import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const EXTRA_PACK_COST = 250;
export const EXTRA_PACK_SLOTS = 1;
export const FREE_IDENTITIES_LIMIT = Number.POSITIVE_INFINITY;

/**
 * Spend fichas to unlock another batch of 3 alien identity slots
 * (after the user has used all of their free ones).
 */
export const purchaseExtraIdentityPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Close any still-open identity payment so the new one becomes the active session.
    const { data: openPayments } = await supabaseAdmin
      .from("payment_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .eq("kind", "identity")
      .gt("credits_remaining", 0);
    const ids = openPayments?.map((p) => p.id) ?? [];
    if (ids.length > 0) {
      await supabaseAdmin
        .from("payment_transactions")
        .update({ credits_remaining: 0 })
        .in("id", ids);
    }

    // Charge the user (RPC enforces sufficient balance)
    const { error: payErr } = await supabaseAdmin.rpc("adjust_fichas", {
      _user_id: userId,
      _delta: -EXTRA_PACK_COST,
      _reason: "extra_identity_pack",
      _meta: { slots: EXTRA_PACK_SLOTS },
    });
    if (payErr) throw new Error(payErr.message);

    // Issue a new identity session. amount_cents = EXTRA_PACK_COST and
    // currency = "fichas" so this is excluded from the free-session count.
    const { data: payment, error } = await supabaseAdmin
      .from("payment_transactions")
      .insert({
        user_id: userId,
        amount_cents: EXTRA_PACK_COST,
        currency: "fichas",
        status: "completed",
        credits_granted: EXTRA_PACK_SLOTS,
        credits_remaining: EXTRA_PACK_SLOTS,
        env: "sandbox",
        kind: "identity",
      })
      .select("id, status, credits_remaining, created_at")
      .single();

    if (error || !payment) throw new Error(error?.message ?? "Falha ao criar pacote extra");

    return { payment };
  });
