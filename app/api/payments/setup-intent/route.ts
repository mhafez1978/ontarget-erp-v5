import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, email, name } = body;
    if (!plan) {
      return NextResponse.json({ error: "plan is required" }, { status: 400 });
    }

    const gateway = await paymentsService.getRootGateway();
    if (!gateway) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 400 }
      );
    }

    // Get price mapping
    const priceId = paymentsService.getPriceIdForPlan(gateway, plan);
    if (!priceId) {
      return NextResponse.json(
        { error: "Price mapping not configured for plan" },
        { status: 400 }
      );
    }

    // Instantiate provider and create customer + setup intent
    const provider: any =
      paymentsService.instantiateStripeProviderFromGateway(gateway);

    // Type guard to ensure provider has required methods
    if (!("createCustomer" in provider) || !("createSetupIntent" in provider)) {
      return NextResponse.json(
        { error: "Provider does not support required methods" },
        { status: 400 }
      );
    }

    const custRes = await provider.createCustomer(email, name);
    if (!custRes.success || !custRes.customerId) {
      return NextResponse.json(
        { error: custRes.error || "Failed to create customer" },
        { status: 500 }
      );
    }

    const siRes = await provider.createSetupIntent(custRes.customerId);
    if (!siRes.success || !siRes.clientSecret) {
      return NextResponse.json(
        { error: siRes.error || "Failed to create setup intent" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: siRes.clientSecret,
      customerId: custRes.customerId,
      priceId,
    });
  } catch (error) {
    console.error("/api/payments/setup-intent error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
