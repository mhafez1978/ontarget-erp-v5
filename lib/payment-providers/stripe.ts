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
    super(config, PaymentProviderName.STRIPE);

    this.stripe = new Stripe(config.secretKey, {
      apiVersion: "2025-10-29.clover",
      typescript: true,
    });

    logger.info("Stripe provider initialized", {
      mode: config.mode,
      companyId: config.companyId,
    });
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to retrieve account details to verify connection
      const account = await this.stripe.accounts.retrieve();
      logger.info("Stripe connection test successful", {
        accountId: account.id,
        accountEmail: account.email,
      });
      return {
        success: true,
        message: `Connected to Stripe account: ${account.email || account.id}`,
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Stripe connection test failed", { error: err.message });
      return {
        success: false,
        message: err.message || "Failed to connect to Stripe",
      };
    }
  }

  async processPayment(intent: PaymentIntent): Promise<PaymentResult> {
    try {
      logger.info("Processing Stripe payment", {
        amount: intent.amount,
        currency: intent.currency,
        description: intent.description,
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(intent.amount * CENTS_PER_DOLLAR), // Convert to cents
        currency: intent.currency.toLowerCase(),
        description: intent.description,
        metadata: intent.metadata || {},
        receipt_email: intent.customerEmail,
      });

      logger.info("Stripe payment processed", {
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / CENTS_PER_DOLLAR,
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
      logger.error("Stripe payment failed", {
        error: err.message,
        amount: intent.amount,
        currency: intent.currency,
      });
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
      logger.info("Processing Stripe refund", {
        transactionId: refund.transactionId,
        amount: refund.amount,
        reason: refund.reason,
      });

      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: refund.transactionId,
        amount: refund.amount
          ? Math.round(refund.amount * CENTS_PER_DOLLAR)
          : undefined,
        reason: refund.reason as Stripe.RefundCreateParams.Reason,
      });

      logger.info("Stripe refund processed", {
        refundId: stripeRefund.id,
        status: stripeRefund.status,
        amount: stripeRefund.amount
          ? stripeRefund.amount / CENTS_PER_DOLLAR
          : undefined,
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
      logger.error("Stripe refund failed", {
        error: err.message,
        transactionId: refund.transactionId,
      });
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
      logger.warn(
        "Stripe webhook verification failed: webhook secret not configured"
      );
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

      logger.info("Stripe webhook verified", {
        eventType: event.type,
        eventId: event.id,
      });

      return {
        isValid: true,
        event,
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Stripe webhook verification failed", {
        error: err.message,
      });
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
      logger.info("Creating Stripe payment intent", {
        amount: intent.amount,
        currency: intent.currency,
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(intent.amount * CENTS_PER_DOLLAR),
        currency: intent.currency.toLowerCase(),
        description: intent.description,
        metadata: intent.metadata || {},
        receipt_email: intent.customerEmail,
        automatic_payment_methods: { enabled: true },
      });

      logger.info("Stripe payment intent created", {
        intentId: paymentIntent.id,
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to create Stripe payment intent", {
        error: err.message,
      });
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
      logger.info("Creating Stripe customer", { email, name });

      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      logger.info("Stripe customer created", { customerId: customer.id });

      return { success: true, customerId: customer.id };
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to create Stripe customer", {
        error: err.message,
        email,
      });
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
      logger.info("Creating Stripe subscription", {
        customerId: options.customerId,
        priceId: options.priceId,
        trialDays: options.trialDays,
      });

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

      logger.info("Stripe subscription created", {
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to create Stripe subscription", {
        error: err.message,
        customerId: options.customerId,
      });
      return {
        success: false,
        error: err.message || "Failed to create subscription",
      };
    }
  }

  // Retrieve a subscription by id
  async retrieveSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription | null> {
    try {
      const resp = await this.stripe.subscriptions.retrieve(subscriptionId);
      return resp as unknown as Stripe.Subscription;
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to retrieve Stripe subscription", {
        subscriptionId,
        error: err.message,
      });
      return null;
    }
  }
}
