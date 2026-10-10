import type { TaskChallenge } from "@/api/types";

type PaymentIntent = { status?: string };

type StripeClient = {
  retrievePaymentIntent(clientSecret: string): Promise<{ paymentIntent?: PaymentIntent | null }>;
  handleNextAction(opts: { clientSecret: string }): Promise<unknown>;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeClient;
  }
}

let loading: Promise<void> | null = null;

function loadStripeJs(): Promise<void> {
  if (window.Stripe) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loading = null;
        reject(new Error("stripe.js"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

export async function completeStripeChallenge(challenge: TaskChallenge): Promise<"done" | "incomplete"> {
  await loadStripeJs();
  if (!window.Stripe) throw new Error("stripe.js");
  const stripe = window.Stripe(challenge.publishable_key);
  let payment = (await stripe.retrievePaymentIntent(challenge.client_secret)).paymentIntent;
  if (payment?.status === "requires_action") {
    try {
      await stripe.handleNextAction({ clientSecret: challenge.client_secret });
    } catch {
      return "incomplete";
    }
    payment = (await stripe.retrievePaymentIntent(challenge.client_secret)).paymentIntent;
  }
  if (!payment || payment.status === "requires_action") return "incomplete";
  return "done";
}
