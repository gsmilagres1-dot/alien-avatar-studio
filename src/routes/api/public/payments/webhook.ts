import { createFileRoute } from "@tanstack/react-router";
import { createStripeClient, getWebhookSecret, type StripeEnv } from "@/lib/stripe.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env: StripeEnv = url.searchParams.get("env") === "live" ? "live" : "sandbox";

        const signature = request.headers.get("stripe-signature");
        const body = await request.text();
        if (!signature) return new Response("missing signature", { status: 400 });

        let event;
        try {
          const stripe = createStripeClient(env);
          event = await stripe.webhooks.constructEventAsync(body, signature, getWebhookSecret(env));
        } catch (e) {
          return new Response(`Bad signature: ${(e as Error).message}`, { status: 400 });
        }

        try {
          if (
            event.type === "checkout.session.completed" ||
            event.type === "checkout.session.async_payment_succeeded"
          ) {
            const session = event.data.object as {
              id: string;
              payment_intent?: string | { id: string };
              amount_total?: number | null;
              currency?: string | null;
              metadata?: Record<string, string>;
            };
            const sessionId = session.id;
            const paymentIntentId = typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null;

            const kind = (session.metadata?.kind as string) || "identity";
            const journeyMetaId = session.metadata?.journeyId || null;
            const userIdMeta = session.metadata?.userId;

            // Mark pending row completed (or insert if missing) and capture id
            let payRowId: string | null = null;
            const { data: existing } = await supabaseAdmin
              .from("payment_transactions")
              .select("id")
              .eq("stripe_session_id", sessionId)
              .maybeSingle();

            if (existing) {
              await supabaseAdmin
                .from("payment_transactions")
                .update({
                  status: "completed",
                  stripe_payment_intent: paymentIntentId,
                  credits_remaining: 1,
                })
                .eq("id", existing.id);
              payRowId = existing.id;
            } else if (userIdMeta) {
              const { data: inserted } = await supabaseAdmin.from("payment_transactions").insert({
                user_id: userIdMeta,
                stripe_session_id: sessionId,
                stripe_payment_intent: paymentIntentId,
                amount_cents: session.amount_total ?? 299,
                currency: session.currency ?? "brl",
                status: "completed",
                credits_granted: 1,
                credits_remaining: 1,
                env,
                kind,
              }).select("id").single();
              payRowId = inserted?.id ?? null;
            }

            // Credit fichas on completed fichas pack purchase
            if (kind === "fichas" && payRowId && userIdMeta) {
              const fichasStr = session.metadata?.fichas ?? "";
              const fichas = Number.parseInt(fichasStr, 10);
              if (Number.isFinite(fichas) && fichas > 0) {
                // Idempotency: only credit if the row is still pending crediting
                const { data: row } = await supabaseAdmin
                  .from("payment_transactions")
                  .select("credits_remaining")
                  .eq("id", payRowId)
                  .maybeSingle();
                if (row && (row.credits_remaining ?? 0) > 0) {
                  await supabaseAdmin.rpc("adjust_fichas", {
                    _user_id: userIdMeta,
                    _delta: fichas,
                    _reason: "fichas_pack_purchase",
                    _meta: { pack: session.metadata?.pack ?? null, payment_id: payRowId },
                  });
                  await supabaseAdmin
                    .from("payment_transactions")
                    .update({ credits_remaining: 0 })
                    .eq("id", payRowId);
                }
              }
            }

            // Auto-issue passport on completed passport payment
            if (kind === "passport" && payRowId && userIdMeta) {
              const { data: existingP } = await supabaseAdmin
                .from("passports").select("id").eq("user_id", userIdMeta).maybeSingle();
              if (!existingP) {
                const num = "AP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
                await supabaseAdmin.from("passports").insert({
                  user_id: userIdMeta, passport_number: num, origin_planet: "Terra", payment_id: payRowId,
                });
              }
              await supabaseAdmin.from("payment_transactions").update({ credits_remaining: 0 }).eq("id", payRowId);
            }

            // Auto-issue visa for the journey's current level
            if (kind === "visa" && payRowId && userIdMeta && journeyMetaId) {
              const { data: journey } = await supabaseAdmin
                .from("journeys").select("*").eq("id", journeyMetaId).eq("user_id", userIdMeta).maybeSingle();
              if (journey && journey.status === "active") {
                const { DESTINATIONS, destinationForLevel } = await import("@/lib/intergalactic");
                const dest = destinationForLevel(journey.current_level);
                await supabaseAdmin.from("visas").insert({
                  user_id: userIdMeta, journey_id: journey.id, destination_id: dest.id,
                  destination_name: dest.name, transport: dest.transport, payment_id: payRowId, kind: "normal",
                }).then(() => {}, () => {});
                if (journey.current_level >= DESTINATIONS.length) {
                  await supabaseAdmin.from("journeys").update({
                    status: "completed",
                    final_destination_name: dest.name,
                    final_destination_kind: "normal",
                    completed_at: new Date().toISOString(),
                  }).eq("id", journey.id);
                } else {
                  await supabaseAdmin.from("journeys").update({
                    current_level: journey.current_level + 1, attempts_used: 0,
                  }).eq("id", journey.id);
                }
                await supabaseAdmin.from("payment_transactions").update({ credits_remaining: 0 }).eq("id", payRowId);
              }
            }
          }

          if (event.type === "checkout.session.async_payment_failed") {
            const session = event.data.object as { id: string };
            await supabaseAdmin
              .from("payment_transactions")
              .update({ status: "failed" })
              .eq("stripe_session_id", session.id);
          }
        } catch (e) {
          console.error("[webhook] handler error:", e);
          return new Response("handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
