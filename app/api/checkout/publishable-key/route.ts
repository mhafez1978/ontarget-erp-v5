import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getGatewayForCompany, getRootGateway } from "@/lib/payments/service";
import { decrypt } from "@/lib/encryption";

/**
 * GET /api/checkout/publishable-key?companyId=xxx
 * Get Stripe publishable key for checkout (TEMPORARY: fallback enabled for testing)
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // TEMPORARY: Get payment gateway with fallback for testing
    let paymentGateway = await getGatewayForCompany(companyId);

    if (!paymentGateway) {
      paymentGateway = await getRootGateway();
    }

    if (!paymentGateway || !paymentGateway.isEnabled) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 400 }
      );
    }

    // Return publishable key
    const publishableKey = paymentGateway.publicKey
      ? decrypt(paymentGateway.publicKey)
      : null;

    if (!publishableKey) {
      return NextResponse.json(
        { error: "Publishable key not configured" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      publishableKey,
      provider: paymentGateway.provider,
      testMode: paymentGateway.isTestMode,
    });
  } catch (error) {
    console.error("Error fetching publishable key:", error);
    return NextResponse.json(
      { error: "Failed to fetch publishable key" },
      { status: 500 }
    );
  }
}
