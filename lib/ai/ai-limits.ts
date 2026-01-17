import type { SubscriptionPlan } from "@/generated/prisma/client";

export type AiMonthlyLimit = number | "unlimited";

// Simple monthly AI storefront generation limits per plan.
// SUPER_ADMIN and ENTERPRISE get effectively unlimited usage.
export const AI_STOREFRONT_MONTHLY_LIMITS: Record<
  SubscriptionPlan,
  AiMonthlyLimit
> = {
  SUPER_ADMIN: "unlimited",
  ERP_CUSTOMER: 0,
  TRIAL: 0,
  ESSENTIAL: 0,
  GROWTH: 10,
  ENTERPRISE: 20,
  ADMIN_OWNER: "unlimited",
  ADMIN_NONOWNER: 0,
  COMPANY_MANAGER: 0,
  COMPANY_STAFF: 0,
  COMPANY_CONTRACTOR: 0,
  COMPANY_SUPPLIER: 0,
  COMPANY_CUSTOMER: 0,
};

export function getAiStorefrontMonthlyLimit(
  plan: SubscriptionPlan | null | undefined
): AiMonthlyLimit {
  if (!plan) return 0;
  return AI_STOREFRONT_MONTHLY_LIMITS[plan] ?? 0;
}
