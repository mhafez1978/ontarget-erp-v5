import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * Stripe Connect OAuth Authorization
 * Redirects company to Stripe to create/link their connected account
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    // Get user with company memberships and owned companies
    const user = await db.user.findUnique({
      where: { id: validation.user.id },
      include: {
        ownedCompanies: true,
        companyMemberships: {
          include: {
            company: true,
          },
        },
      },
    });

    // Get the first company (either owned or member of)
    const company =
      user?.ownedCompanies[0] || user?.companyMemberships[0]?.company;

    if (!company) {
      return NextResponse.json(
        { error: "No company found. Please create a company first." },
        { status: 400 }
      );
    }

    // Check if already connected
    if (company.stripeConnectedAccountId) {
      return NextResponse.json(
        {
          error: "Stripe account already connected",
          accountId: company.stripeConnectedAccountId,
        },
        { status: 400 }
      );
    }

    // Get Stripe Connect Client ID from root company's payment gateway config
    const rootCompany = await db.company.findFirst({ where: { isRoot: true } });
    if (!rootCompany) {
      return NextResponse.json(
        { error: "Root company not found" },
        { status: 500 }
      );
    }

    const stripeGateway = await db.paymentGateway.findFirst({
      where: {
        companyId: rootCompany.id,
        provider: "stripe",
      },
    });

    const stripeClientId =
      stripeGateway?.stripeConnectClientId ||
      process.env.STRIPE_CONNECT_CLIENT_ID;

    if (!stripeClientId) {
      console.error(
        "Stripe Connect Client ID not configured in payment gateway settings"
      );
      return NextResponse.json(
        {
          error:
            "Stripe Connect not configured. Please configure Stripe Connect Client ID in Payment Settings.",
        },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/stripe/connect/callback`;

    // State parameter for security (verify on callback)
    const state = Buffer.from(
      JSON.stringify({
        companyId: company.id,
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString("base64");

    const authUrl =
      `https://connect.stripe.com/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${stripeClientId}&` +
      `scope=read_write&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `stripe_user[email]=${encodeURIComponent(user.email || "")}&` +
      `stripe_user[business_name]=${encodeURIComponent(company.name)}`;

    // Redirect to Stripe OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Stripe Connect authorization error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Stripe Connect" },
      { status: 500 }
    );
  }
}
