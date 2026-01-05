/**
 * Server-side plan price validation
 * These are the canonical prices that must match what's charged
 */

export const PLAN_PRICES = {
  ESSENTIAL: {
    MONTHLY: 29.99,
    ANNUAL: 299.99, // ~$25/month
  },
  GROWTH: {
    MONTHLY: 79.99,
    ANNUAL: 799.99, // ~$66.67/month
  },
  ENTERPRISE: {
    MONTHLY: 199.99,
    ANNUAL: 1999.99, // ~$166.67/month
  },
} as const;

export type PlanName = keyof typeof PLAN_PRICES;
export type BillingCycle = "MONTHLY" | "ANNUAL";

/**
 * Get the price for a plan and billing cycle
 * @param plan - Plan name
 * @param billingCycle - MONTHLY or ANNUAL
 * @returns Price in dollars
 * @throws Error if plan or cycle is invalid
 */
export function getPlanPrice(plan: string, billingCycle: string): number {
  const upperPlan = plan.toUpperCase() as PlanName;
  const upperCycle = billingCycle.toUpperCase() as BillingCycle;

  if (!(upperPlan in PLAN_PRICES)) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  if (!(upperCycle in PLAN_PRICES[upperPlan])) {
    throw new Error(`Invalid billing cycle: ${billingCycle}`);
  }

  return PLAN_PRICES[upperPlan][upperCycle];
}

/**
 * Validate a price matches the expected value for a plan
 * @param plan - Plan name
 * @param billingCycle - MONTHLY or ANNUAL
 * @param amount - Amount to validate (in dollars)
 * @returns True if valid, false otherwise
 */
export function validatePlanPrice(
  plan: string,
  billingCycle: string,
  amount: number
): boolean {
  try {
    const expectedPrice = getPlanPrice(plan, billingCycle);
    // Allow 1 cent tolerance for floating point
    return Math.abs(amount - expectedPrice) < 0.01;
  } catch {
    return false;
  }
}
