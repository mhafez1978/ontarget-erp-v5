import type { SubscriptionPlan } from "@/generated/prisma/client";

// Re-export SubscriptionPlan type so other modules can import it through this module
export type { SubscriptionPlan } from "@/generated/prisma/client";

// Expose a local alias so other modules can import PlanType without importing Prisma directly
export type PlanType = SubscriptionPlan;

/**
 * Limits associated with each plan
 */

export interface PlanLimits {
  companies: number;
  adminAccounts: number;
  managerAccounts: number;
  staffAccounts: number;
  contractorAccounts: number;
  supplierAccounts: number;
  customers: number;
  storageGB: number; // Base storage included in plan (in GB)
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  SUPER_ADMIN: {
    companies: Infinity, // SUPER_ADMIN can create unlimited companies
    adminAccounts: Infinity,
    managerAccounts: Infinity,
    staffAccounts: Infinity,
    contractorAccounts: Infinity,
    supplierAccounts: Infinity,
    customers: Infinity,
    storageGB: Infinity, // Unlimited storage for platform admin
  },
  TRIAL: {
    companies: 0, // TRIAL users cannot create companies until they select a plan
    adminAccounts: 0,
    managerAccounts: 0,
    staffAccounts: 0,
    contractorAccounts: 0,
    supplierAccounts: 0,
    customers: 0,
    storageGB: 0, // No storage until plan selected
  },
  COMPANY_CUSTOMER: {
    companies: 0, // Company customers can't create companies
    adminAccounts: 0,
    managerAccounts: 0,
    staffAccounts: 0,
    contractorAccounts: 0,
    supplierAccounts: 0,
    customers: 0,
    storageGB: 0, // No personal storage
  },
  ERP_CUSTOMER: {
    companies: 1,
    adminAccounts: 2,
    managerAccounts: 2,
    staffAccounts: 2,
    contractorAccounts: 2,
    supplierAccounts: 2,
    customers: 100,
    storageGB: 50,
  },
  COMPANY_STAFF: {
    companies: 0,
    adminAccounts: 0,
    managerAccounts: 0,
    staffAccounts: 0,
    contractorAccounts: 0,
    supplierAccounts: 0,
    customers: 0,
    storageGB: 0,
  },
  ESSENTIAL: {
    companies: 1,
    adminAccounts: 2, // Total pool: 10 users across all roles
    managerAccounts: 2,
    staffAccounts: 2,
    contractorAccounts: 2,
    supplierAccounts: 2,
    customers: 100,
    storageGB: 50, // 50 GB base storage
  },
  GROWTH: {
    companies: 3,
    adminAccounts: 10, // Total pool: 50 users across all roles
    managerAccounts: 10,
    staffAccounts: 10,
    contractorAccounts: 10,
    supplierAccounts: 10,
    customers: 300,
    storageGB: 250, // 250 GB base storage
  },
  ENTERPRISE: {
    companies: Infinity,
    adminAccounts: Infinity,
    managerAccounts: Infinity,
    staffAccounts: Infinity,
    contractorAccounts: Infinity,
    supplierAccounts: Infinity,
    customers: Infinity,
    storageGB: 1024, // 1 TB base storage
  },
  // Administrative/role-like entries (some user roles are also represented as SubscriptionPlan values in the DB)
  ADMIN_OWNER: {
    companies: Infinity,
    adminAccounts: Infinity,
    managerAccounts: Infinity,
    staffAccounts: Infinity,
    contractorAccounts: Infinity,
    supplierAccounts: Infinity,
    customers: Infinity,
    storageGB: Infinity,
  },
  ADMIN_NONOWNER: {
    companies: Infinity,
    adminAccounts: Infinity,
    managerAccounts: Infinity,
    staffAccounts: Infinity,
    contractorAccounts: Infinity,
    supplierAccounts: Infinity,
    customers: Infinity,
    storageGB: Infinity,
  },
  COMPANY_MANAGER: {
    companies: Infinity,
    adminAccounts: Infinity,
    managerAccounts: Infinity,
    staffAccounts: Infinity,
    contractorAccounts: Infinity,
    supplierAccounts: Infinity,
    customers: Infinity,
    storageGB: Infinity,
  },
  COMPANY_CONTRACTOR: {
    companies: 0,
    adminAccounts: 0,
    managerAccounts: 0,
    staffAccounts: 0,
    contractorAccounts: 0,
    supplierAccounts: 0,
    customers: 0,
    storageGB: 0,
  },
  COMPANY_SUPPLIER: {
    companies: 0,
    adminAccounts: 0,
    managerAccounts: 0,
    staffAccounts: 0,
    contractorAccounts: 0,
    supplierAccounts: 0,
    customers: 0,
    storageGB: 0,
  },
};

/**
 * Plan pricing information
 */
export interface PlanPricing {
  name: string;
  monthlyPrice: number;
  monthlyDiscountPrice?: number;
  monthlyPromoPrice?: number; // Promotional price (shown with strikethrough on original)
  annualPrice: number;
  annualPriceMonthly?: number; // Monthly equivalent when paid annually
  annualDiscountPrice?: number;
  transactionFee: string;
  transactionFeePercent?: number;
  transactionFeeFixed?: number;
  isPopular?: boolean;
  // Storage pricing
  baseStorageGB: number; // Base storage included
  extraStoragePricePer100GB: number; // Cost per 100GB over base
  extraStoragePricePerGB: number; // Cost per 1GB over base
}

export const PLAN_PRICING: Record<string, PlanPricing> = {
  SUPER_ADMIN: {
    name: "Super User",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: Infinity,
    extraStoragePricePer100GB: 0,
    extraStoragePricePerGB: 0,
  },
  COMPANY_CUSTOMER: {
    name: "Company Customer",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: 0,
    extraStoragePricePer100GB: 0,
    extraStoragePricePerGB: 0,
  },
  ERP_CUSTOMER: {
    name: "ERP Customer",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: 50,
    extraStoragePricePer100GB: 10,
    extraStoragePricePerGB: 0.45,
  },
  COMPANY_STAFF: {
    name: "Company Staff",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: 0,
    extraStoragePricePer100GB: 0,
    extraStoragePricePerGB: 0,
  },
  // Administrative/role-like pricing defaults
  ADMIN_OWNER: {
    name: "Admin (Owner)",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: Infinity,
    extraStoragePricePer100GB: 0,
    extraStoragePricePerGB: 0,
  },
  ADMIN_NONOWNER: {
    name: "Admin (Non-owner)",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: Infinity,
    extraStoragePricePer100GB: 0,
    extraStoragePricePerGB: 0,
  },
  COMPANY_MANAGER: {
    name: "Company Manager",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: Infinity,
    extraStoragePricePer100GB: 0,
    extraStoragePricePerGB: 0,
  },
  COMPANY_CONTRACTOR: {
    name: "Company Contractor",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: 0,
    extraStoragePricePer100GB: 0,
    extraStoragePricePerGB: 0,
  },
  COMPANY_SUPPLIER: {
    name: "Company Supplier",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: 0,
    extraStoragePricePer100GB: 0,
    extraStoragePricePerGB: 0,
  },
  TRIAL: {
    name: "Trial",
    monthlyPrice: 0,
    annualPrice: 0,
    transactionFee: "N/A",
    baseStorageGB: 50,
    extraStoragePricePer100GB: 10,
    extraStoragePricePerGB: 0.45,
  },
  ESSENTIAL: {
    name: "Essential",
    monthlyPrice: 49.99, // Original price (shown with strikethrough)
    monthlyPromoPrice: 45.99, // Promo price
    annualPrice: 509.88, // 42.49 * 12
    annualPriceMonthly: 42.49, // Monthly equivalent when paid annually
    transactionFee: "3.9% + $0.99",
    transactionFeePercent: 3.9,
    transactionFeeFixed: 0.99,
    baseStorageGB: 50,
    extraStoragePricePer100GB: 10, // $10 per 100GB
    extraStoragePricePerGB: 0.45, // $0.45 per GB
  },
  GROWTH: {
    name: "Growth",
    monthlyPrice: 299.99,
    annualPrice: 3479.88, // 289.99 * 12
    annualPriceMonthly: 289.99, // Monthly equivalent when paid annually
    transactionFee: "3.2% + $0.49",
    transactionFeePercent: 3.2,
    transactionFeeFixed: 0.49,
    isPopular: true,
    baseStorageGB: 250,
    extraStoragePricePer100GB: 35, // $35 per 500GB = $35 per 500GB
    extraStoragePricePerGB: 0.32, // $0.32 per GB (but bulk is better deal)
  },
  ENTERPRISE: {
    name: "Enterprise",
    monthlyPrice: 999.99,
    annualPrice: 11639.88, // 969.99 * 12
    annualPriceMonthly: 969.99, // Monthly equivalent when paid annually
    transactionFee: "2.9% + $0.20",
    transactionFeePercent: 2.9,
    transactionFeeFixed: 0.2,
    baseStorageGB: 1024, // 1 TB
    extraStoragePricePer100GB: 60, // $60 per 1TB = ~$0.06/GB but we charge per 100GB
    extraStoragePricePerGB: 0.1, // $0.10 per GB
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

/**
 * Calculate extra storage cost
 * Returns monthly cost for storage exceeding the plan's base limit
 */
export function calculateExtraStorageCost(
  usedStorageGB: number,
  plan: PlanType
): { overageGB: number; monthlyCost: number } {
  const pricing = PLAN_PRICING[plan];
  const baseStorage = pricing.baseStorageGB;

  if (baseStorage === Infinity || usedStorageGB <= baseStorage) {
    return { overageGB: 0, monthlyCost: 0 };
  }

  const overageGB = usedStorageGB - baseStorage;
  const monthlyCost = overageGB * pricing.extraStoragePricePerGB;

  return { overageGB, monthlyCost };
}

/**
 * Check if storage limit has been exceeded
 */
export function hasExceededStorageLimit(
  usedStorageGB: number,
  plan: PlanType,
  allowOverage: boolean = true
): boolean {
  const baseStorage = PLAN_LIMITS[plan].storageGB;

  if (baseStorage === Infinity) return false;
  if (allowOverage) return false; // Allow going over if they can purchase extra

  return usedStorageGB > baseStorage;
}

/**
 * Format storage size for display
 */
export function formatStorageSize(sizeGB: number): string {
  if (sizeGB >= 1024) {
    return `${(sizeGB / 1024).toFixed(2)} TB`;
  }
  return `${sizeGB.toFixed(2)} GB`;
}

/**
 * Get storage usage percentage
 */
export function getStorageUsagePercentage(
  usedStorageGB: number,
  plan: PlanType
): number {
  const baseStorage = PLAN_LIMITS[plan].storageGB;

  if (baseStorage === Infinity) return 0;

  return Math.min(100, (usedStorageGB / baseStorage) * 100);
}

/**
 * User limits by plan (consolidated view for total users across all roles)
 */
export function getTotalUserLimit(plan: PlanType): number {
  const limits = PLAN_LIMITS[plan];
  const total =
    limits.adminAccounts +
    limits.managerAccounts +
    limits.staffAccounts +
    limits.contractorAccounts +
    limits.supplierAccounts;

  return total === Infinity ? Infinity : total;
}
