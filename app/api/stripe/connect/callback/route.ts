import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import Stripe from "stripe";

function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-10-29.clover",
  });
}

/**
 * Stripe Connect OAuth Callback
 * Handles the redirect from Stripe after company authorizes connection
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle OAuth errors
    if (error) {
      console.error("Stripe Connect OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_BASE_URL
        }/dashboard/settings/payment?error=${encodeURIComponent(
          errorDescription || error
        )}`
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/payment?error=Invalid callback parameters`
      );
    }

    // Verify state parameter
    let state: { companyId: string; userId: string; timestamp: number };
    try {
      state = JSON.parse(Buffer.from(stateParam, "base64").toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/payment?error=Invalid state parameter`
      );
    }

    // Check timestamp (prevent replay attacks)
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - state.timestamp > fifteenMinutes) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/payment?error=Authorization expired, please try again`
      );
    }

    // Exchange authorization code for access token
    const stripe = getStripeClient();
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const connectedAccountId = response.stripe_user_id;

    if (!connectedAccountId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/payment?error=Failed to get connected account ID`
      );
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(connectedAccountId);

    // Determine account status
    let accountStatus = "pending";
    if (account.charges_enabled && account.payouts_enabled) {
      accountStatus = "active";
    } else if (account.requirements?.disabled_reason) {
      accountStatus = "restricted";
    }

    // Update company with connected account info
    const company = await db.company.update({
      where: { id: state.companyId },
      data: {
        stripeConnectedAccountId: connectedAccountId,
        stripeAccountStatus: accountStatus,
        stripeOnboardedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      companyId: state.companyId,
      userId: state.userId,
      action: "STRIPE_CONNECT_LINKED",
      metadata: {
        connectedAccountId,
        accountStatus,
        businessName: account.business_profile?.name,
        country: account.country,
      },
      ipAddress: null,
    });

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/payment?success=Stripe account connected successfully`
    );
  } catch (error) {
    console.error("Stripe Connect callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/settings/payment?error=Failed to connect Stripe account`
    );
  }
}
