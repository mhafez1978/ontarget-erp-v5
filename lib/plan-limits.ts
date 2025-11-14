/**
 * Subscription Plan Limits
 * All limits for COMPANY_CUSTOMER, ESSENTIAL, GROWTH, and ENTERPRISE plans
 */

export type PlanType =
  | "COMPANY_CUSTOMER"
  | "ESSENTIAL"
  | "GROWTH"
  | "ENTERPRISE";

export interface PlanLimits {
  companies: number;
  adminAccounts: number;
  managerAccounts: number;
  staffAccounts: number;
  contractorAccounts: number;
  supplierAccounts: number;
  customers: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  COMPANY_CUSTOMER: {
    companies: 0, // Company customers can't create companies
    adminAccounts: 0,
    managerAccounts: 0,
    staffAccounts: 0,
    contractorAccounts: 0,
    supplierAccounts: 0,
    customers: 0,
  },
  ESSENTIAL: {
    companies: 1,
    adminAccounts: 5,
    managerAccounts: 5,
    staffAccounts: 5,
    contractorAccounts: 5,
    supplierAccounts: 5,
    customers: 100,
  },
  GROWTH: {
    companies: 3,
    adminAccounts: 20,
    managerAccounts: 20,
    staffAccounts: 20,
    contractorAccounts: 20,
    supplierAccounts: 20,
    customers: 300,
  },
  ENTERPRISE: {
    companies: Infinity,
    adminAccounts: Infinity,
    managerAccounts: Infinity,
    staffAccounts: Infinity,
    contractorAccounts: Infinity,
    supplierAccounts: Infinity,
    customers: Infinity,
  },
};

/**
 * Plan pricing information
 */
export interface PlanPricing {
  name: string;
  monthlyPrice: number;
  monthlyDiscountPrice?: number;
  annualPrice: number;
  transactionFee: string;
  isPopular?: boolean;
}

export const PLAN_PRICING: Record<PlanType, PlanPricing> = {
  COMPANY_CUSTOMER: {
    name: "Company Customer",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
  },
  ESSENTIAL: {
    name: "Essential",
    monthlyPrice: 39.99,
    monthlyDiscountPrice: 24.99,
    annualPrice: 19.99,
    transactionFee: "3.9% + $0.99",
  },
  GROWTH: {
    name: "Growth",
    monthlyPrice: 199.99,
    annualPrice: 190.99,
    transactionFee: "3.2% + $0.49",
    isPopular: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyPrice: 499.99,
    annualPrice: 492.99,
    transactionFee: "2.9% + $0.20",
  },
};

/**
 * Trial period in days
 */
export const TRIAL_PERIOD_DAYS = 30;

/**
 * Check if a limit has been reached
 */
export function hasReachedLimit(
  currentCount: number,
  plan: PlanType,
  limitType: keyof PlanLimits
): boolean {
  const limit = PLAN_LIMITS[plan][limitType];
  return limit !== Infinity && currentCount >= limit;
}

/**
 * Get remaining count for a limit
 */
export function getRemainingCount(
  currentCount: number,
  plan: PlanType,
  limitType: keyof PlanLimits
): number | "unlimited" {
  const limit = PLAN_LIMITS[plan][limitType];
  if (limit === Infinity) return "unlimited";
  return Math.max(0, limit - currentCount);
}
