/**
 * Payment Provider Factory
 * Creates and manages payment provider instances
 */

import { PaymentProvider, PaymentProviderConfig } from "./base";
import { StripeProvider } from "./stripe";
import { PayPalProvider } from "./paypal";

export type SupportedProvider =
  | "stripe"
  | "paypal"
  | "square"
  | "authorize_net";

/**
 * Create a payment provider instance based on the provider name
 */
export function createPaymentProvider(
  provider: string,
  config: PaymentProviderConfig
): PaymentProvider {
  switch (provider.toLowerCase()) {
    case "stripe":
      return new StripeProvider(config);

    case "paypal":
      return new PayPalProvider(config);

    case "square":
      // TODO: Implement Square provider
      throw new Error("Square provider not yet implemented");

    case "authorize_net":
      // TODO: Implement Authorize.net provider
      throw new Error("Authorize.net provider not yet implemented");

    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}

/**
 * Get list of supported payment providers
 */
export function getSupportedProviders(): Array<{
  id: SupportedProvider;
  name: string;
  description: string;
  isImplemented: boolean;
}> {
  return [
    {
      id: "stripe",
      name: "Stripe",
      description: "Credit/debit cards, Apple Pay, Google Pay, and more",
      isImplemented: true,
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "PayPal payments and PayPal Credit",
      isImplemented: true,
    },
    {
      id: "square",
      name: "Square",
      description: "Square payments for in-person and online",
      isImplemented: false,
    },
    {
      id: "authorize_net",
      name: "Authorize.Net",
      description: "Accept credit cards and e-checks",
      isImplemented: false,
    },
  ];
}

// Re-export types
export type { PaymentProvider, PaymentProviderConfig } from "./base";
export type {
  PaymentIntent,
  PaymentResult,
  RefundIntent,
  RefundResult,
  WebhookVerification,
} from "./base";
