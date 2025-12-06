// Shared type for SubscriptionPlan enum values (keeps build safe across environments)
// Values are kept in sync with prisma/schema.prisma enum SubscriptionPlan
export type SubscriptionPlan =
  | "SUPER_USER"
  | "GUEST"
  | "COMPANY_CUSTOMER"
  | "ESSENTIAL"
  | "GROWTH"
  | "ENTERPRISE";
