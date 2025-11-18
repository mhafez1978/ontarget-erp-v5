/**
 * Stripe payment provider implementation
 */

import Stripe from "stripe";
import {
  PaymentProvider,
  PaymentProviderConfig,
  PaymentIntent,
  PaymentResult,
  RefundIntent,
  RefundResult,
  WebhookVerification,
} from "./base";

export class StripeProvider extends PaymentProvider {
  private stripe: Stripe;

  constructor(config: PaymentProviderConfig) {
    super(config, "stripe");

    this.stripe = new Stripe(config.secretKey, {
      apiVersion: "2025-10-29.clover",
      typescript: true,
    });
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to retrieve account details to verify connection
      const account = await this.stripe.accounts.retrieve();
      return {
        success: true,
        message: `Connected to Stripe account: ${account.email || account.id}`,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: err.message || "Failed to connect to Stripe",
      };
    }
  }

  async processPayment(intent: PaymentIntent): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(intent.amount * 100), // Convert to cents
        currency: intent.currency.toLowerCase(),
        description: intent.description,
        metadata: intent.metadata || {},
        receipt_email: intent.customerEmail,
      });

      return {
        success: paymentIntent.status === "succeeded",
        transactionId: paymentIntent.id,
        status:
          paymentIntent.status === "succeeded"
            ? "succeeded"
            : paymentIntent.status === "canceled"
            ? "canceled"
            : paymentIntent.status === "processing"
            ? "pending"
            : "failed",
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        providerResponse: paymentIntent,
      };
    } catch (error) {
      const err = error as Error & { raw?: unknown };
      return {
        success: false,
        status: "failed",
        errorMessage: err.message || "Payment processing failed",
        providerResponse: err.raw || error,
      };
    }
  }

  async processRefund(refund: RefundIntent): Promise<RefundResult> {
    try {
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: refund.transactionId,
        amount: refund.amount ? Math.round(refund.amount * 100) : undefined,
        reason: refund.reason as Stripe.RefundCreateParams.Reason | undefined,
      });

      return {
        success: stripeRefund.status === "succeeded",
        refundId: stripeRefund.id,
        amount: stripeRefund.amount ? stripeRefund.amount / 100 : undefined,
        providerResponse: stripeRefund,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        errorMessage: err.message || "Refund processing failed",
        providerResponse: error,
      };
    }
  }

  async verifyWebhook(
    payload: string,
    signature: string
  ): Promise<WebhookVerification> {
    if (!this.config.webhookSecret) {
      return {
        isValid: false,
        errorMessage: "Webhook secret not configured",
      };
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      );

      return {
        isValid: true,
        event,
      };
    } catch (error) {
      const err = error as Error;
      return {
        isValid: false,
        errorMessage: err.message || "Webhook verification failed",
      };
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        transactionId
      );

      return {
        success: paymentIntent.status === "succeeded",
        transactionId: paymentIntent.id,
        status:
          paymentIntent.status === "succeeded"
            ? "succeeded"
            : paymentIntent.status === "canceled"
            ? "canceled"
            : paymentIntent.status === "processing"
            ? "pending"
            : "failed",
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        providerResponse: paymentIntent,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        status: "failed",
        errorMessage: err.message || "Failed to retrieve payment status",
        providerResponse: error,
      };
    }
  }

  /**
   * Create a payment intent for client-side payment collection
   */
  async createPaymentIntent(
    intent: PaymentIntent
  ): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(intent.amount * 100),
        currency: intent.currency.toLowerCase(),
        description: intent.description,
        metadata: intent.metadata || {},
        receipt_email: intent.customerEmail,
        automatic_payment_methods: { enabled: true },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || "Failed to create payment intent",
      };
    }
  }
}
