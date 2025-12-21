import type { SubscriptionPlan } from "@prisma/client";

export type AiMonthlyLimit = number | "unlimited";

// Simple monthly AI storefront generation limits per plan.
// SUPER_USER and ENTERPRISE get effectively unlimited usage.
export const AI_STOREFRONT_MONTHLY_LIMITS: Record<
  SubscriptionPlan,
  AiMonthlyLimit
> = {
  SUPER_USER: "unlimited",
  GUEST: 0,
  COMPANY_CUSTOMER: 0,
  ESSENTIAL: 0,
  GROWTH: 10,
  ENTERPRISE: 20,
};

export function getAiStorefrontMonthlyLimit(
  plan: SubscriptionPlan | null | undefined
): AiMonthlyLimit {
  if (!plan) return 0;
  return AI_STOREFRONT_MONTHLY_LIMITS[plan] ?? 0;
}
