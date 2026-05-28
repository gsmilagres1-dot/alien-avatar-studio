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

            // Mark pending row as completed and grant credit
            const { data: existing } = await supabaseAdmin
              .from("payment_transactions")
              .select("id, credits_remaining")
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
            } else if (session.metadata?.userId) {
              await supabaseAdmin.from("payment_transactions").insert({
                user_id: session.metadata.userId,
                stripe_session_id: sessionId,
                stripe_payment_intent: paymentIntentId,
                amount_cents: session.amount_total ?? 299,
                currency: session.currency ?? "brl",
                status: "completed",
                credits_granted: 1,
                credits_remaining: 1,
                env,
              });
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
