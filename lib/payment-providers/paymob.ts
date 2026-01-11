/**
 * Paymob payment provider implementation
 * Popular payment gateway in Middle East & North Africa (Egypt, Saudi Arabia, UAE, etc.)
 */

import {
  PaymentProvider,
  PaymentProviderConfig,
  PaymentIntent,
  PaymentResult,
  RefundIntent,
  RefundResult,
  WebhookVerification,
} from "./base";
import {
  CENTS_PER_DOLLAR,
  PaymentProviderName,
  PAYMOB_BASE_URL,
} from "./constants";
import { fetchWithTimeout } from "@/lib/payments/fetch-with-timeout";
import { logger } from "@/lib/payments/logger";
import crypto from "crypto";

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
  amount_cents: number;
  currency: string;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

interface PaymobTransactionResponse {
  id: number;
  success: boolean;
  pending: boolean;
  amount_cents: number;
  currency: string;
  refunded_amount_cents: number;
  is_refunded: boolean;
  is_void: boolean;
}

export class PaymobProvider extends PaymentProvider {
  private baseUrl: string;

  constructor(config: PaymentProviderConfig) {
    super(config, PaymentProviderName.PAYMOB);

    this.baseUrl = process.env.PAYMOB_BASE_URL || PAYMOB_BASE_URL;

    logger.info("Paymob provider initialized", {
      mode: config.mode,
      companyId: config.companyId,
    });
  }

  /**
   * Get authentication token from Paymob
   * API Key is stored in config.secretKey
   */
  private async getAuthToken(): Promise<string> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/auth/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.config.secretKey,
        }),
      });

      if (!response.ok) {
        logger.error("Failed to get Paymob auth token", {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error("Failed to authenticate with Paymob");
      }

      const data: PaymobAuthResponse = await response.json();
      return data.token;
    } catch (error) {
      const err = error as Error;
      logger.error("Paymob authentication error", { error: err.message });
      throw err;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getAuthToken();
      logger.info("Paymob connection test successful");
      return {
        success: true,
        message: "Successfully connected to Paymob",
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Paymob connection test failed", { error: err.message });
      return {
        success: false,
        message: err.message || "Failed to connect to Paymob",
      };
    }
  }

  async processPayment(intent: PaymentIntent): Promise<PaymentResult> {
    try {
      logger.info("Processing Paymob payment", {
        amount: intent.amount,
        currency: intent.currency,
        description: intent.description,
      });

      // Step 1: Get auth token
      const authToken = await this.getAuthToken();

      // Step 2: Create order
      const orderResponse = await fetchWithTimeout(
        `${this.baseUrl}/ecommerce/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: Math.round(intent.amount * CENTS_PER_DOLLAR),
            currency: intent.currency.toUpperCase(),
            items: [],
          }),
        }
      );

      if (!orderResponse.ok) {
        logger.error("Failed to create Paymob order", {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
        });
        throw new Error("Failed to create Paymob order");
      }

      const order: PaymobOrderResponse = await orderResponse.json();

      // Step 3: Create payment key
      const paymentKeyResponse = await fetchWithTimeout(
        `${this.baseUrl}/acceptance/payment_keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_token: authToken,
            amount_cents: order.amount_cents,
            expiration: 3600, // 1 hour
            order_id: order.id,
            billing_data: {
              email: intent.customerEmail || "NA",
              first_name: intent.metadata?.customerName || "NA",
              last_name: "NA",
              phone_number: intent.metadata?.phone || "NA",
              apartment: "NA",
              floor: "NA",
              street: "NA",
              building: "NA",
              shipping_method: "NA",
              postal_code: "NA",
              city: "NA",
              country: "NA",
              state: "NA",
            },
            currency: intent.currency.toUpperCase(),
            integration_id: this.config.publicKey, // Integration ID stored in publicKey
          }),
        }
      );

      if (!paymentKeyResponse.ok) {
        logger.error("Failed to create Paymob payment key", {
          status: paymentKeyResponse.status,
          statusText: paymentKeyResponse.statusText,
        });
        throw new Error("Failed to create Paymob payment key");
      }

      const paymentKey: PaymobPaymentKeyResponse =
        await paymentKeyResponse.json();

      logger.info("Paymob payment initiated", {
        orderId: order.id,
        amountCents: order.amount_cents,
      });

      // Return payment key for client-side payment completion
      return {
        success: false, // Not completed yet - requires client-side action
        transactionId: order.id.toString(),
        status: "pending",
        amount: order.amount_cents / CENTS_PER_DOLLAR,
        currency: order.currency,
        providerResponse: {
          order,
          paymentToken: paymentKey.token,
        },
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Paymob payment failed", {
        error: err.message,
        amount: intent.amount,
        currency: intent.currency,
      });
      return {
        success: false,
        status: "failed",
        errorMessage: err.message || "Payment processing failed",
        providerResponse: error,
      };
    }
  }

  async processRefund(refund: RefundIntent): Promise<RefundResult> {
    try {
      logger.info("Processing Paymob refund", {
        transactionId: refund.transactionId,
        amount: refund.amount,
      });

      const authToken = await this.getAuthToken();

      const refundResponse = await fetchWithTimeout(
        `${this.baseUrl}/acceptance/void_refund/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_token: authToken,
            transaction_id: refund.transactionId,
            amount_cents: refund.amount
              ? Math.round(refund.amount * CENTS_PER_DOLLAR)
              : undefined,
          }),
        }
      );

      if (!refundResponse.ok) {
        logger.error("Failed to process Paymob refund", {
          status: refundResponse.status,
          statusText: refundResponse.statusText,
        });
        throw new Error("Failed to process Paymob refund");
      }

      const refundData = await refundResponse.json();

      logger.info("Paymob refund processed", {
        transactionId: refund.transactionId,
        refundData,
      });

      return {
        success: true,
        refundId: refundData.id?.toString(),
        amount: refundData.refunded_amount_cents
          ? refundData.refunded_amount_cents / CENTS_PER_DOLLAR
          : undefined,
        providerResponse: refundData,
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Paymob refund failed", {
        error: err.message,
        transactionId: refund.transactionId,
      });
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
      logger.warn(
        "Paymob webhook verification failed: webhook secret not configured"
      );
      return {
        isValid: false,
        errorMessage: "Webhook secret (HMAC) not configured",
      };
    }

    try {
      // Parse webhook payload
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(payload);
      } catch {
        return {
          isValid: false,
          errorMessage: "Invalid JSON payload",
        };
      }

      // Verify HMAC signature
      // Paymob sends HMAC in query parameter or header
      const hmac = crypto.createHmac("sha512", this.config.webhookSecret);

      // Paymob HMAC calculation: concatenate specific fields in order
      const obj = event.obj as Record<string, unknown>;
      const concatenatedString = [
        obj.amount_cents,
        obj.created_at,
        obj.currency,
        obj.error_occured,
        obj.has_parent_transaction,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure,
        obj.is_auth,
        obj.is_capture,
        obj.is_refunded,
        obj.is_standalone_payment,
        obj.is_voided,
        obj.order,
        obj.owner,
        obj.pending,
        obj.source_data_pan,
        obj.source_data_sub_type,
        obj.source_data_type,
        obj.success,
      ].join("");

      hmac.update(concatenatedString);
      const calculatedHmac = hmac.digest("hex");

      const isValid = calculatedHmac === signature;

      if (isValid) {
        logger.info("Paymob webhook verified", {
          transactionId: obj.id,
          success: obj.success,
        });
      } else {
        logger.error("Paymob webhook verification failed", {
          calculatedHmac,
          receivedSignature: signature,
        });
      }

      return {
        isValid,
        event,
        errorMessage: isValid ? undefined : "HMAC signature mismatch",
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Paymob webhook verification error", {
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
      const authToken = await this.getAuthToken();

      const response = await fetchWithTimeout(
        `${this.baseUrl}/acceptance/transactions/${transactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        logger.error("Failed to retrieve Paymob transaction", {
          transactionId,
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error("Failed to retrieve Paymob transaction");
      }

      const transaction: PaymobTransactionResponse = await response.json();

      return {
        success: transaction.success,
        transactionId: transaction.id.toString(),
        status: transaction.is_void
          ? "canceled"
          : transaction.success
          ? "succeeded"
          : transaction.pending
          ? "pending"
          : "failed",
        amount: transaction.amount_cents / CENTS_PER_DOLLAR,
        currency: transaction.currency,
        providerResponse: transaction,
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to get Paymob payment status", {
        error: err.message,
        transactionId,
      });
      return {
        success: false,
        status: "failed",
        errorMessage: err.message || "Failed to retrieve payment status",
        providerResponse: error,
      };
    }
  }

  /**
   * Create payment iframe URL for client-side payment
   */
  async createPaymentUrl(
    intent: PaymentIntent
  ): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    try {
      const result = await this.processPayment(intent);

      if (!result.success && result.status === "pending") {
        const response = result.providerResponse as {
          paymentToken: string;
        };
        const iframeId = this.config.publicKey; // Integration ID

        return {
          success: true,
          paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${response.paymentToken}`,
        };
      }

      return {
        success: false,
        error: result.errorMessage || "Failed to create payment URL",
      };
    } catch (error) {
      const err = error as Error;
      logger.error("Failed to create Paymob payment URL", {
        error: err.message,
      });
      return {
        success: false,
        error: err.message || "Failed to create payment URL",
      };
    }
  }
}
