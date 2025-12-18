import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { createPaymentProvider } from "@/lib/payment-providers";
import { PaymentProviderName } from "@/lib/payment-providers/constants";
import type { PaymentGateway } from "@prisma/client";

/**
 * Payments service helpers for root-company checkout
 */

interface PriceConfig {
  priceId: string;
  [key: string]: unknown;
}

interface GatewayConfig {
  prices?: Record<string, PriceConfig>;
  [key: string]: unknown;
}

/**
 * Get the payment gateway for the root company
 * @returns The root company's enabled payment gateway, or null if not found
 */
export async function getRootGateway() {
  const root = await db.company.findFirst({ where: { isRoot: true } });
  if (!root) return null;

  const gateway = await db.paymentGateway.findFirst({
    where: { companyId: root.id, isEnabled: true },
  });
  return gateway || null;
}

/**
 * Get the payment gateway for a specific company
 * @param companyId - The company ID to look up
 * @returns The company's enabled payment gateway, or null if not found
 */
export async function getGatewayForCompany(companyId: string) {
  if (!companyId) return null;
  const gateway = await db.paymentGateway.findFirst({
    where: { companyId, isEnabled: true },
  });
  return gateway || null;
}

/**
 * Instantiate a Stripe provider from a payment gateway record
 * @param gateway - The payment gateway database record
 * @returns A configured Stripe payment provider instance
 * @throws Error if gateway is invalid or not configured for Stripe
 */
export function instantiateStripeProviderFromGateway(gateway: PaymentGateway) {
  if (!gateway)
    throw new Error(
      "Failed to instantiate provider: No payment gateway configured"
    );
  if (gateway.provider !== PaymentProviderName.STRIPE) {
    throw new Error(
      `Failed to instantiate provider: Expected ${PaymentProviderName.STRIPE}, got ${gateway.provider}`
    );
  }

  const secretKey = gateway.secretKey ? decrypt(gateway.secretKey) : undefined;
  if (!secretKey)
    throw new Error(
      "Failed to instantiate provider: No secret key configured for gateway"
    );

  return createPaymentProvider(PaymentProviderName.STRIPE, {
    secretKey,
    isTestMode: gateway.isTestMode,
  });
}

/**
 * Get the Stripe price ID for a subscription plan from gateway config
 * @param gateway - The payment gateway database record
 * @param plan - The plan name (e.g., "basic", "professional")
 * @returns The Stripe price ID, or null if not found
 */
export function getPriceIdForPlan(
  gateway: PaymentGateway,
  plan: string
): string | null {
  try {
    const cfg = (gateway.config as GatewayConfig) || {};
    const prices = cfg.prices || {};
    return prices[plan]?.priceId || null;
  } catch (error) {
    console.error("Error getting price ID for plan:", error);
    return null;
  }
}

/**
 * Get the plan name from a Stripe price ID
 * @param gateway - The payment gateway database record
 * @param priceId - The Stripe price ID
 * @returns The plan name, or null if not found
 */
export function getPlanFromPriceId(
  gateway: PaymentGateway,
  priceId: string
): string | null {
  try {
    const cfg = (gateway.config as GatewayConfig) || {};
    const prices = cfg.prices || {};
    for (const [plan, entry] of Object.entries(prices)) {
      if (entry?.priceId === priceId) return plan;
    }
    return null;
  } catch (error) {
    console.log("Error getting plan from price ID:", error);
    return null;
  }
}

/**
 * Get the Stripe price ID for a plan from the root company gateway
 * @param plan - The plan name
 * @returns The Stripe price ID, or null if not found
 */
export async function getRootPriceId(plan: string) {
  const gateway = await getRootGateway();
  if (!gateway) return null;
  return getPriceIdForPlan(gateway, plan);
}

const paymentsService = {
  getRootGateway,
  getGatewayForCompany,
  instantiateStripeProviderFromGateway,
  getPriceIdForPlan,
  getPlanFromPriceId,
  getRootPriceId,
};

export default paymentsService;
