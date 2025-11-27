import { SubscriptionPlan } from "@prisma/client";

// Plans that are allowed to use AI Storefront features.
// SUPER_USER is reserved for SUPER_ADMIN and should always have access.
export const PLAN_AI_STOREFRONT_ENABLED: SubscriptionPlan[] = [
  "SUPER_USER",
  "GROWTH",
  "ENTERPRISE",
];

export function canUseAiStorefront(
  plan: SubscriptionPlan | null | undefined
): boolean {
  if (!plan) return false;
  return PLAN_AI_STOREFRONT_ENABLED.includes(plan);
}
