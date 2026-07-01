import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, getStripeErrorMessage, type StripeEnv } from "@/lib/stripe.server";

type Kind = "identity" | "passport" | "visa" | "fichas";

const PRICES: Record<Exclude<Kind, "fichas">, { lookup: string; amount: number }> = {
  identity: { lookup: "alien_identity_single", amount: 299 },
  passport: { lookup: "alien_passport_single", amount: 299 },
  visa:     { lookup: "alien_visa_single",     amount: 199 },
};

const FICHAS_PACKS: Record<string, { lookup: string; amount: number; fichas: number }> = {
  fichas_pack_100:  { lookup: "fichas_pack_100",  amount: 199,  fichas: 100 },
  fichas_pack_300:  { lookup: "fichas_pack_300",  amount: 499,  fichas: 300 },
  fichas_pack_700:  { lookup: "fichas_pack_700",  amount: 999,  fichas: 700 },
  fichas_pack_1000: { lookup: "fichas_pack_1000", amount: 1399, fichas: 1000 },
};

const input = z.object({
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url(),
  kind: z.enum(["identity", "passport", "visa", "fichas"]).default("identity"),
  journeyId: z.string().uuid().optional(),
  pack: z.string().optional(),
});

type Result = { clientSecret: string; paymentRowId: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  opts: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(opts.userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${opts.userId}'`,
    limit: 1,
  });
  if (found.data.length) return found.data[0].id;
  if (opts.email) {
    const existing = await stripe.customers.list({ email: opts.email, limit: 1 });
    if (existing.data.length) {
      const c = existing.data[0];
      if (c.metadata?.userId !== opts.userId) {
        await stripe.customers.update(c.id, { metadata: { ...c.metadata, userId: opts.userId } });
      }
      return c.id;
    }
  }
  const created = await stripe.customers.create({
    ...(opts.email && { email: opts.email }),
    metadata: { userId: opts.userId },
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }): Promise<Result> => {
    try {
      const { userId, claims } = context;
      const env: StripeEnv = data.environment;
      const kind: Kind = data.kind;
      const cfg = PRICES[kind];
      const stripe = createStripeClient(env);

      const prices = await stripe.prices.list({ lookup_keys: [cfg.lookup] });
      if (!prices.data.length) throw new Error("Preço não configurado");
      const stripePrice = prices.data[0];

      const productId = typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const email = claims.email as string | undefined;
      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        payment_intent_data: { description: product.name },
        metadata: { userId, kind, journeyId: data.journeyId ?? "" },
      });

      const { data: row, error } = await supabaseAdmin
        .from("payment_transactions")
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          amount_cents: cfg.amount,
          currency: "brl",
          status: "pending",
          credits_granted: 1,
          credits_remaining: 0,
          env,
          kind,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      return { clientSecret: session.client_secret ?? "", paymentRowId: row.id };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });
