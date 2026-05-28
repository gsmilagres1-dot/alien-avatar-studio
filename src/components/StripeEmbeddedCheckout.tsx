import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useServerFn } from "@tanstack/react-start";
import { createCheckoutSession } from "@/lib/payments.functions";

interface Props {
  returnUrl: string;
  kind?: "identity" | "passport" | "visa";
  journeyId?: string;
}

export function StripeEmbeddedCheckout({ returnUrl, kind = "identity", journeyId }: Props) {
  const create = useServerFn(createCheckoutSession);

  const fetchClientSecret = async (): Promise<string> => {
    const result = await create({ data: { environment: getStripeEnvironment(), returnUrl, kind, journeyId } });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Sem client secret");
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="bg-white rounded-xl overflow-hidden">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
