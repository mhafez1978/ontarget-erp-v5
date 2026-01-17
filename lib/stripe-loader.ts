/**
 * Lazy loader for Stripe to avoid blocking initial page load
 * Only load Stripe when actually needed (on payment pages)
 */

import type { Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export const loadStripe = async (): Promise<Stripe | null> => {
  if (stripePromise) {
    return stripePromise;
  }

  stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
    loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  );

  return stripePromise;
};
