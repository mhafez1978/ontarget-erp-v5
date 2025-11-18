/**
 * Base payment provider interface
 * All payment providers (Stripe, PayPal, Square, etc.) implement this interface
 */

export interface PaymentProviderConfig {
  publicKey?: string;
  secretKey: string;
  webhookSecret?: string;
  merchantId?: string;
  isTestMode: boolean;
  [key: string]: string | boolean | undefined; // Additional provider-specific config
}

export interface PaymentIntent {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string | number | null>;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  status: "succeeded" | "pending" | "failed" | "canceled";
  amount?: number;
  currency?: string;
  errorMessage?: string;
  providerResponse?: unknown;
}

export interface RefundIntent {
  transactionId: string;
  amount?: number; // If not provided, full refund;
  currency?: string;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  errorMessage?: string;
  providerResponse?: unknown;
}

export interface WebhookVerification {
  isValid: boolean;
  event?: unknown;
  errorMessage?: string;
}

/**
 * Abstract base class for payment providers
 */
export abstract class PaymentProvider {
  protected config: PaymentProviderConfig;
  protected providerName: string;

  constructor(config: PaymentProviderConfig, providerName: string) {
    this.config = config;
    this.providerName = providerName;
  }

  /**
   * Test the connection to the payment provider
   */
  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  /**
   * Process a payment
   */
  abstract processPayment(intent: PaymentIntent): Promise<PaymentResult>;

  /**
   * Process a refund
   */
  abstract processRefund(refund: RefundIntent): Promise<RefundResult>;

  /**
   * Verify a webhook signature
   */
  abstract verifyWebhook(
    payload: string,
    signature: string
  ): Promise<WebhookVerification>;

  /**
   * Get payment status from provider
   */
  abstract getPaymentStatus(transactionId: string): Promise<PaymentResult>;

  /**
   * Get the provider name
   */
  getProviderName(): string {
    return this.providerName;
  }
}
