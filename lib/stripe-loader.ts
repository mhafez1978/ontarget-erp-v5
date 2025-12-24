/**
 * Lazy loader for Stripe to avoid blocking initial page load
 * Only load Stripe when actually needed (on payment pages)
 */

let stripePromise: Promise<any> | null = null;

export const loadStripe = async () => {
  if (stripePromise) {
    return stripePromise;
  }

  stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
    loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  );

  return stripePromise;
};
