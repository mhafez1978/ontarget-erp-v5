import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { createPaymentProvider } from "@/lib/payment-providers";

/**
 * Payments service helpers for root-company checkout
 */

export async function getRootGateway() {
  const root = await db.company.findFirst({ where: { isRoot: true } });
  if (!root) return null;

  const gateway = await db.paymentGateway.findFirst({
    where: { companyId: root.id, isEnabled: true },
  });
  return gateway || null;
}

export function instantiateStripeProviderFromGateway(gateway: any) {
  if (!gateway) throw new Error("No payment gateway configured");
  if (gateway.provider !== "stripe") throw new Error("Unsupported provider");

  const secretKey = gateway.secretKey ? decrypt(gateway.secretKey) : undefined;
  if (!secretKey) throw new Error("No secret key configured for gateway");

  return createPaymentProvider("stripe", {
    secretKey,
    isTestMode: gateway.isTestMode,
  });
}

export function getPriceIdForPlan(gateway: any, plan: string) {
  try {
    const cfg = gateway.config || {};
    const prices = cfg.prices || {};
    return prices[plan]?.priceId || null;
  } catch (error) {
    return null;
  }
}

export async function getRootPriceId(plan: string) {
  const gateway = await getRootGateway();
  if (!gateway) return null;
  return getPriceIdForPlan(gateway, plan);
}

export default {
  getRootGateway,
  instantiateStripeProviderFromGateway,
  getPriceIdForPlan,
  getRootPriceId,
};
