/**
 * PayPal payment provider implementation
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
  PAYPAL_BASE_URL_SANDBOX,
  PAYPAL_BASE_URL_LIVE,
} from "./constants";
import { fetchWithTimeout } from "@/lib/payments/fetch-with-timeout";
import { logger } from "@/lib/payments/logger";

export class PayPalProvider extends PaymentProvider {
  private baseUrl: string;

  constructor(config: PaymentProviderConfig) {
    super(config, PaymentProviderName.PAYPAL);

    // Use environment variable if set, otherwise fallback to sandbox/live based on test mode
    this.baseUrl =
      process.env.PAYPAL_BASE_URL ||
      (config.isTestMode ? PAYPAL_BASE_URL_SANDBOX : PAYPAL_BASE_URL_LIVE);
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.config.publicKey}:${this.config.secretKey}`
    ).toString("base64");

    const response = await fetchWithTimeout(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      logger.error("Failed to get PayPal access token", {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error("Failed to get PayPal access token");
    }

    const data = await response.json();
    return data.access_token;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getAccessToken();
      return {
        success: true,
        message: "Successfully connected to PayPal",
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return {
        success: false,
        message: err.message || "Failed to connect to PayPal",
      };
    }
  }

  async processPayment(intent: PaymentIntent): Promise<PaymentResult> {
    // Validate required fields
    if (!intent.amount || intent.amount <= 0) {
      return {
        success: false,
        status: "failed",
        errorMessage: "Invalid payment amount: must be positive",
      };
    }
    if (!intent.currency || intent.currency.length !== 3) {
      return {
        success: false,
        status: "failed",
        errorMessage: "Invalid currency code: must be 3-letter ISO code",
      };
    }

    try {
      const accessToken = await this.getAccessToken();

      // Create order
      const orderResponse = await fetchWithTimeout(
        `${this.baseUrl}/v2/checkout/orders`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code: intent.currency.toUpperCase(),
                  value: intent.amount.toFixed(2),
                },
                description: intent.description,
              },
            ],
          }),
        }
      );

      if (!orderResponse.ok) {
        logger.error("Failed to create PayPal order", {
          status: orderResponse.status,
          statusText: orderResponse.statusText,
        });
        throw new Error("Failed to create PayPal order");
      }

      const order = await orderResponse.json();

      return {
        success: order.status === "APPROVED" || order.status === "COMPLETED",
        transactionId: order.id,
        status:
          order.status === "COMPLETED"
            ? "succeeded"
            : order.status === "VOIDED"
            ? "canceled"
            : order.status === "CREATED" || order.status === "APPROVED"
            ? "pending"
            : "failed",
        amount: intent.amount,
        currency: intent.currency,
        providerResponse: order,
      };
    } catch (error) {
      const err = error as Error;
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
      const accessToken = await this.getAccessToken();

      const refundResponse = await fetchWithTimeout(
        `${this.baseUrl}/v2/payments/captures/${refund.transactionId}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: refund.amount
              ? {
                  value: refund.amount.toFixed(2),
                  currency_code: (refund.currency || "USD").toUpperCase(),
                }
              : undefined,
            note_to_payer: refund.reason,
          }),
        }
      );

      if (!refundResponse.ok) {
        logger.error("Failed to process PayPal refund", {
          status: refundResponse.status,
          statusText: refundResponse.statusText,
        });
        throw new Error("Failed to process PayPal refund");
      }

      const refundData = await refundResponse.json();

      return {
        success: refundData.status === "COMPLETED",
        refundId: refundData.id,
        amount: refundData.amount
          ? parseFloat(refundData.amount.value)
          : undefined,
        providerResponse: refundData,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
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
      const accessToken = await this.getAccessToken();

      // Parse the webhook payload with error handling
      let event: any;
      try {
        event = JSON.parse(payload);
      } catch (parseError) {
        return {
          isValid: false,
          errorMessage: "Invalid JSON payload",
        };
      }

      // Verify webhook signature with PayPal
      // Note: In production, signature should be extracted from webhook headers:
      // PAYPAL-TRANSMISSION-ID, PAYPAL-TRANSMISSION-TIME, PAYPAL-TRANSMISSION-SIG, PAYPAL-CERT-URL
      const verifyResponse = await fetchWithTimeout(
        `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_algo: "SHA256withRSA",
            cert_url: signature, // TODO: Extract from PAYPAL-CERT-URL header
            transmission_id: event.id, // TODO: Extract from PAYPAL-TRANSMISSION-ID header
            transmission_sig: signature, // TODO: Extract from PAYPAL-TRANSMISSION-SIG header
            transmission_time: event.create_time, // TODO: Extract from PAYPAL-TRANSMISSION-TIME header
            webhook_id: this.config.webhookSecret,
            webhook_event: event,
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      return {
        isValid: verifyData.verification_status === "SUCCESS",
        event,
        errorMessage:
          verifyData.verification_status !== "SUCCESS"
            ? "Webhook verification failed"
            : undefined,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return {
        isValid: false,
        errorMessage: err.message || "Webhook verification failed",
      };
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetchWithTimeout(
        `${this.baseUrl}/v2/checkout/orders/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        logger.error("Failed to retrieve PayPal order", {
          transactionId,
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error("Failed to retrieve PayPal order");
      }

      const order = await response.json();

      const firstUnit = order.purchase_units?.[0];
      const amountValue = firstUnit?.amount?.value;

      return {
        success: order.status === "COMPLETED",
        transactionId: order.id,
        status:
          order.status === "COMPLETED"
            ? "succeeded"
            : order.status === "VOIDED"
            ? "canceled"
            : order.status === "CREATED" || order.status === "APPROVED"
            ? "pending"
            : "failed",
        amount: amountValue ? parseFloat(amountValue) : undefined,
        currency: firstUnit?.amount?.currency_code,
        providerResponse: order,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return {
        success: false,
        status: "failed",
        errorMessage: err.message || "Failed to retrieve payment status",
        providerResponse: error,
      };
    }
  }
}
