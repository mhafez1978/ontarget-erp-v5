declare module "@prisma/client" {
  // Minimal shims to satisfy TypeScript while Prisma client generation is handled separately
  export const Prisma: any;
  export const PrismaClient: any;
  export type Company = any;
  export type HederaSetting = any;
  export type SubscriptionPlan = any;
  export type AuditLog = any;
  export type User = any;
  export type CompanyStaff = any;
  export type CompanyHederaSetting = any;
  export type HederaTransaction = any;
  export type HederaCostAlert = any;
  export namespace Prisma {
    export type InputJsonValue = any;
  }

  export default {} as any;
}
