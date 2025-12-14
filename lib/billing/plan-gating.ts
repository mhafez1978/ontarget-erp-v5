import { SubscriptionPlan } from "@prisma/client";

// Plans that are allowed to use AI Storefront V1 features.
// V1 is available for Essential, Growth, Enterprise, and SUPER_USER
export const PLAN_AI_STOREFRONT_V1_ENABLED: SubscriptionPlan[] = [
  "SUPER_USER",
  "ESSENTIAL",
  "GROWTH",
  "ENTERPRISE",
];

// Plans that are allowed to use AI Storefront V2 features.
// V2 is only available for Growth, Enterprise, and SUPER_USER
export const PLAN_AI_STOREFRONT_V2_ENABLED: SubscriptionPlan[] = [
  "SUPER_USER",
  "GROWTH",
  "ENTERPRISE",
];

// Legacy function - now points to V2 (more restrictive)
export function canUseAiStorefront(
  plan: SubscriptionPlan | null | undefined
): boolean {
  if (!plan) return false;
  return PLAN_AI_STOREFRONT_V2_ENABLED.includes(plan);
}

export function canUseAiStorefrontV1(
  plan: SubscriptionPlan | null | undefined
): boolean {
  if (!plan) return false;
  return PLAN_AI_STOREFRONT_V1_ENABLED.includes(plan);
}

export function canUseAiStorefrontV2(
  plan: SubscriptionPlan | null | undefined
): boolean {
  if (!plan) return false;
  return PLAN_AI_STOREFRONT_V2_ENABLED.includes(plan);
}
