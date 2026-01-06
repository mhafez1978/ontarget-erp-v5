import { db } from "./db";

/**
 * Platform fee percentages by plan
 */
const PLATFORM_FEE_BY_PLAN: Record<string, number> = {
  Essential: 3.9,
  Growth: 3.5,
  Enterprise: 3.2,
};

/**
 * Calculate platform fee for a storefront transaction
 * @param companyId - Company making the sale
 * @param amountInCents - Transaction amount in cents
 * @returns Object with fee percentage, fee amount in cents, and net amount
 */
export async function calculatePlatformFee(
  companyId: string,
  amountInCents: number
): Promise<{
  feePercent: number;
  feeAmountCents: number;
  netAmountCents: number;
  planName: string;
}> {
  // Get company with subscription and plan
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      subscriberSubscriptions: {
        where: { status: "ACTIVE" },
        select: {
          plan: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // Check for custom platform fee override
  if (company.customPlatformFeePercent !== null) {
    const feePercent = Number(company.customPlatformFeePercent);
    const feeAmountCents = Math.round(amountInCents * (feePercent / 100));
    return {
      feePercent,
      feeAmountCents,
      netAmountCents: amountInCents - feeAmountCents,
      planName: "Custom",
    };
  }

  // Get active subscription
  const subscription = company.subscriberSubscriptions[0];
  if (!subscription) {
    throw new Error(`No active subscription found for company: ${companyId}`);
  }

  // Get platform fee based on plan name (plan is an enum field)
  const planName = subscription.plan;
  const feePercent = PLATFORM_FEE_BY_PLAN[planName] || 0;

  if (feePercent === 0) {
    console.warn(`No platform fee configured for plan: ${planName}`);
  }

  const feeAmountCents = Math.round(amountInCents * (feePercent / 100));

  return {
    feePercent,
    feeAmountCents,
    netAmountCents: amountInCents - feeAmountCents,
    planName,
  };
}

/**
 * Check if company should use platform fees
 * (i.e., they're using the fallback root gateway instead of their own connected account)
 * @param companyId - Company ID
 * @returns boolean - true if platform fees should apply
 */
export async function shouldChargePlatformFee(
  companyId: string
): Promise<boolean> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      stripeConnectedAccountId: true,
      stripeAccountStatus: true,
    },
  });

  if (!company) {
    return false;
  }

  // Only charge platform fees if they DON'T have an active connected account
  // (i.e., they're using the root/fallback gateway)
  return !(
    company.stripeConnectedAccountId && company.stripeAccountStatus === "active"
  );
}

/**
 * Get platform fee info for display purposes
 * @param companyId - Company ID
 * @returns Platform fee information
 */
export async function getPlatformFeeInfo(companyId: string): Promise<{
  hasConnectedAccount: boolean;
  accountStatus: string | null;
  willChargeFee: boolean;
  feePercent: number;
  planName: string;
}> {
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      subscriberSubscriptions: {
        where: { status: "ACTIVE" },
        select: {
          plan: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const hasConnectedAccount =
    !!company.stripeConnectedAccountId &&
    company.stripeAccountStatus === "active";

  const willChargeFee = !hasConnectedAccount;

  let feePercent = 0;
  let planName = "Unknown";

  if (company.customPlatformFeePercent !== null) {
    feePercent = Number(company.customPlatformFeePercent);
    planName = "Custom";
  } else if (company.subscriberSubscriptions[0]) {
    planName = company.subscriberSubscriptions[0].plan;
    feePercent = PLATFORM_FEE_BY_PLAN[planName] || 0;
  }

  return {
    hasConnectedAccount,
    accountStatus: company.stripeAccountStatus,
    willChargeFee,
    feePercent,
    planName,
  };
}
