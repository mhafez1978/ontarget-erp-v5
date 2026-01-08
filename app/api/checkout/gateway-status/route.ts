import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getGatewayForCompany, getRootGateway } from "@/lib/payments/service";

/**
 * GET /api/checkout/gateway-status?companyId=xxx
 * Check if company has payment gateway configured (TEMPORARY: fallback enabled for testing)
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

    // TEMPORARY: Check company gateway with fallback to root for testing
    let paymentGateway = await getGatewayForCompany(companyId);

    if (!paymentGateway) {
      paymentGateway = await getRootGateway();
    }

    if (!paymentGateway) {
      return NextResponse.json({
        configured: false,
        enabled: false,
        provider: null,
        message:
          "This company has not configured a payment gateway. Please contact the company to set up payments.",
      });
    }

    return NextResponse.json({
      configured: true,
      enabled: paymentGateway.isEnabled,
      provider: paymentGateway.provider,
      testMode: paymentGateway.isTestMode,
      message: paymentGateway.isEnabled
        ? `Payment gateway configured (${paymentGateway.provider})`
        : "Payment gateway is configured but disabled",
    });
  } catch (error) {
    console.error("Error checking gateway status:", error);
    return NextResponse.json(
      { error: "Failed to check payment gateway status" },
      { status: 500 }
    );
  }
}
