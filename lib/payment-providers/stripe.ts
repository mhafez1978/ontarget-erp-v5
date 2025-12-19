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
import { CENTS_PER_DOLLAR, PaymentProviderName } from "./constants";
import { logger } from "@/lib/payments/logger";

export class StripeProvider extends PaymentProvider {
  private stripe: Stripe;

  constructor(config: PaymentProviderConfig) {
    super(config, "stripe");

    this.stripe = new Stripe(config.secretKey, {
      apiVersion: "2024-11-20.acacia",
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
        amount: Math.round(intent.amount * CENTS_PER_DOLLAR), // Convert to cents
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
        amount: paymentIntent.amount / CENTS_PER_DOLLAR,
        currency: paymentIntent.currency.toUpperCase(),
        providerResponse: paymentIntent,
      };
    } catch (error) {
      const err = error as Error & { raw?: unknown };
      return {
        success: false,
        status: "failed",
        errorMessage: err.message || "Failed to process payment",
        providerResponse: err.raw || error,
      };
    }
  }

  async processRefund(refund: RefundIntent): Promise<RefundResult> {
    try {
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: refund.transactionId,
        amount: refund.amount
          ? Math.round(refund.amount * CENTS_PER_DOLLAR)
          : undefined,
        reason: refund.reason as Stripe.RefundCreateParams.Reason,
      });

      return {
        success: stripeRefund.status === "succeeded",
        refundId: stripeRefund.id,
        amount: stripeRefund.amount
          ? stripeRefund.amount / CENTS_PER_DOLLAR
          : undefined,
        providerResponse: stripeRefund,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        errorMessage: err.message || "Failed to process refund",
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
        amount: paymentIntent.amount / CENTS_PER_DOLLAR,
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
        amount: Math.round(intent.amount * CENTS_PER_DOLLAR),
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

  // Create a Stripe Customer
  async createCustomer(
    email?: string,
    name?: string
  ): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      return { success: true, customerId: customer.id };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || "Failed to create customer",
      };
    }
  }

  // Create a SetupIntent to collect and attach a payment method for future payments
  async createSetupIntent(
    customerId: string
  ): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
    try {
      const si = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
        usage: "off_session",
      });

      return { success: true, clientSecret: si.client_secret || undefined };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || "Failed to create setup intent",
      };
    }
  }

  // Create a Subscription with optional trial days and default payment method
  async createSubscription(options: {
    customerId: string;
    priceId: string;
    trialDays?: number;
    defaultPaymentMethod?: string;
  }): Promise<{
    success: boolean;
    subscriptionId?: string;
    status?: string;
    error?: string;
  }> {
    try {
      const params: Stripe.SubscriptionCreateParams = {
        customer: options.customerId,
        items: [{ price: options.priceId }],
        expand: ["latest_invoice.payment_intent"],
      };

      if (options.trialDays && options.trialDays > 0) {
        params.trial_period_days = options.trialDays;
      }

      if (options.defaultPaymentMethod) {
        params.default_payment_method = options.defaultPaymentMethod;
      }

      const subscription = await this.stripe.subscriptions.create(params);

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || "Failed to create subscription",
      };
    }
  }
}
