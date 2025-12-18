/**
 * Payment Provider Factory
 * Creates and manages payment provider instances
 */

import { PaymentProvider, PaymentProviderConfig } from "./base";
import { StripeProvider } from "./stripe";
import { PayPalProvider } from "./paypal";
import { PaymentProviderName } from "./constants";

export type SupportedProvider = string;

/**
 * Create a payment provider instance based on the provider name
 * @param provider - The payment provider name
 * @param config - The provider configuration
 * @returns A configured payment provider instance
 * @throws Error if provider is not supported or not implemented
 */
export function createPaymentProvider(
  provider: string,
  config: PaymentProviderConfig
): PaymentProvider {
  switch (provider.toLowerCase()) {
    case PaymentProviderName.STRIPE:
      return new StripeProvider(config);

    case PaymentProviderName.PAYPAL:
      return new PayPalProvider(config);

    case PaymentProviderName.SQUARE:
      throw new Error(
        `Failed to create provider: ${PaymentProviderName.SQUARE} not yet implemented`
      );

    case PaymentProviderName.AUTHORIZE_NET:
      throw new Error(
        `Failed to create provider: ${PaymentProviderName.AUTHORIZE_NET} not yet implemented`
      );

    default:
      throw new Error(
        `Failed to create provider: Unsupported provider '${provider}'`
      );
  }
}

/**
 * Get list of supported payment providers with implementation status
 * @returns Array of provider metadata including ID, name, description, and implementation status
 */
export function getSupportedProviders(): Array<{
  id: SupportedProvider;
  name: string;
  description: string;
  isImplemented: boolean;
}> {
  return [
    {
      id: PaymentProviderName.STRIPE,
      name: "Stripe",
      description: "Credit/debit cards, Apple Pay, Google Pay, and more",
      isImplemented: true,
    },
    {
      id: PaymentProviderName.PAYPAL,
      name: "PayPal",
      description: "PayPal payments and PayPal Credit",
      isImplemented: true,
    },
    {
      id: PaymentProviderName.SQUARE,
      name: "Square",
      description: "Square payments for in-person and online",
      isImplemented: false,
    },
    {
      id: PaymentProviderName.AUTHORIZE_NET,
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
