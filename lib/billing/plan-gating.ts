import { SubscriptionPlan } from "@prisma/client";

export const PLAN_AI_STOREFRONT_ENABLED: SubscriptionPlan[] = [
  "GROWTH",
  "ENTERPRISE",
];

export function canUseAiStorefront(
  plan: SubscriptionPlan | null | undefined
): boolean {
  if (!plan) return false;
  return PLAN_AI_STOREFRONT_ENABLED.includes(plan);
}

