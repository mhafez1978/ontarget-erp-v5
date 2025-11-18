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

export class PayPalProvider extends PaymentProvider {
  private baseUrl: string;

  constructor(config: PaymentProviderConfig) {
    super(config, "paypal");

    // Use sandbox for test mode, live for production
    this.baseUrl = config.isTestMode
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.config.publicKey}:${this.config.secretKey}`
    ).toString("base64");

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
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
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        message: err.message || "Failed to connect to PayPal",
      };
    }
  }

  async processPayment(intent: PaymentIntent): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken();

      // Create order
      const orderResponse = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
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
      });

      if (!orderResponse.ok) {
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

      const refundResponse = await fetch(
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
                  currency_code: "USD",
                }
              : undefined,
            note_to_payer: refund.reason,
          }),
        }
      );

      if (!refundResponse.ok) {
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
      const accessToken = await this.getAccessToken();

      // Parse the webhook payload
      const event = JSON.parse(payload);

      // Verify webhook signature with PayPal
      const verifyResponse = await fetch(
        `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_algo: "SHA256withRSA",
            cert_url: signature, // This should come from webhook headers
            transmission_id: event.id,
            transmission_sig: signature,
            transmission_time: event.create_time,
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
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v2/checkout/orders/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to retrieve PayPal order");
      }

      const order = await response.json();

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
        amount: order.purchase_units?.[0]?.amount?.value
          ? parseFloat(order.purchase_units[0].amount.value)
          : undefined,
        currency: order.purchase_units?.[0]?.amount?.currency_code,
        providerResponse: order,
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
}
