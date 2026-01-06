import Stripe from "stripe";
import { db } from "@/lib/db";
import { calculatePlatformFee } from "@/lib/platform-fees";
import { getGatewayForCompany, getRootGateway } from "@/lib/payments/service";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-10-29.clover",
  });
}

export interface CheckoutPaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  usesConnectedAccount: boolean;
  platformFee?: {
    percent: number;
    amountCents: number;
  };
}

/**
 * Create a payment intent for storefront checkout
 * Automatically handles Stripe Connect or fallback gateway with platform fees
 */
export async function createStorefrontPaymentIntent(params: {
  companyId: string;
  amountCents: number;
  currency?: string;
  orderId?: string;
  orderNumber?: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
}): Promise<CheckoutPaymentIntent> {
  const {
    companyId,
    amountCents,
    currency = "usd",
    orderId,
    orderNumber,
    customerEmail,
    customerName,
    metadata = {},
  } = params;

  // Get company with Stripe Connect info
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      stripeConnectedAccountId: true,
      stripeAccountStatus: true,
    },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // Check if company has active Stripe Connect account
  const hasConnectedAccount =
    company.stripeConnectedAccountId &&
    company.stripeAccountStatus === "active";

  if (hasConnectedAccount) {
    // Use Stripe Connect - payment goes directly to company
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          ...metadata,
          companyId,
          orderId: orderId || "",
          orderNumber: orderNumber || "",
          isConnectedAccount: "true",
        },
        receipt_email: customerEmail,
        description: `Order ${orderNumber || ""} from ${company.name}`,
      },
      {
        stripeAccount: company.stripeConnectedAccountId || undefined,
      }
    );

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amountCents,
      usesConnectedAccount: true,
    };
  } else {
    // No connected account - use root gateway with platform fees
    console.log(
      `Company ${company.name} using fallback gateway - platform fees will apply`
    );

    // Calculate platform fee
    const platformFee = await calculatePlatformFee(companyId, amountCents);

    // Create payment intent on ROOT account
    // The full amount goes to root, we'll handle payout separately
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...metadata,
        companyId,
        orderId: orderId || "",
        orderNumber: orderNumber || "",
        isConnectedAccount: "false",
        platformFeePercent: platformFee.feePercent.toString(),
        platformFeeAmountCents: platformFee.feeAmountCents.toString(),
        companyNetAmountCents: platformFee.netAmountCents.toString(),
        planName: platformFee.planName,
      },
      receipt_email: customerEmail,
      description: `Order ${orderNumber || ""} from ${
        company.name
      } (Marketplace)`,
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      amountCents,
      usesConnectedAccount: false,
      platformFee: {
        percent: platformFee.feePercent,
        amountCents: platformFee.feeAmountCents,
      },
    };
  }
}

/**
 * Verify payment status and update order
 * Call this after customer completes payment on frontend
 */
export async function verifyAndCompletePayment(params: {
  paymentIntentId: string;
  orderId: string;
  companyId: string;
}): Promise<{
  success: boolean;
  paymentStatus: "PAID" | "FAILED" | "PENDING";
  transactionId?: string;
  platformFee?: {
    percent: number;
    amountCents: number;
  };
}> {
  const { paymentIntentId, orderId, companyId } = params;

  // Get company to know if it was connected account or not
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      stripeConnectedAccountId: true,
      stripeAccountStatus: true,
    },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  const isConnectedAccount =
    company.stripeConnectedAccountId &&
    company.stripeAccountStatus === "active";

  // Retrieve payment intent to verify status
  const stripe = getStripeClient();
  let paymentIntent: Stripe.PaymentIntent;
  if (isConnectedAccount) {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      stripeAccount: company.stripeConnectedAccountId || undefined,
    });
  } else {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  if (paymentIntent.status !== "succeeded") {
    return {
      success: false,
      paymentStatus:
        paymentIntent.status === "processing" ? "PENDING" : "FAILED",
    };
  }

  // Extract platform fee info from metadata (if using fallback gateway)
  let platformFee: { percent: number; amountCents: number } | undefined;
  if (!isConnectedAccount && paymentIntent.metadata.platformFeeAmountCents) {
    platformFee = {
      percent: parseFloat(paymentIntent.metadata.platformFeePercent || "0"),
      amountCents: parseInt(paymentIntent.metadata.platformFeeAmountCents, 10),
    };
  }

  // Update order status
  await db.storefrontOrder.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
    },
  });

  // Create payment record
  await db.payment.create({
    data: {
      companyId,
      amount: paymentIntent.amount / 100, // Convert cents to dollars
      currency: paymentIntent.currency.toUpperCase(),
      status: "SUCCEEDED",
      gatewayReference: paymentIntent.id,
      orderId,
      metadata: {
        usedConnectedAccount: isConnectedAccount,
        platformFee: platformFee || null,
      },
    },
  });

  return {
    success: true,
    paymentStatus: "PAID",
    transactionId: paymentIntent.id,
    platformFee,
  };
}
