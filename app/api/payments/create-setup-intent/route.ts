import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    // Get root company's payment gateway
    const gateway = await paymentsService.getRootGateway();
    if (!gateway) {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_FAILED,
        description: "Payment gateway not configured",
        metadata: { email, name },
      });
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 400 }
      );
    }

    // Instantiate Stripe provider
    const provider =
      paymentsService.instantiateStripeProviderFromGateway(gateway);

    // Type guard to ensure provider has required methods
    if (
      !("createCustomer" in provider) ||
      typeof provider.createCustomer !== "function" ||
      !("createSetupIntent" in provider) ||
      typeof provider.createSetupIntent !== "function"
    ) {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_FAILED,
        companyId: gateway.companyId,
        description: "Provider missing required methods",
        metadata: { provider: gateway.provider },
      });
      return NextResponse.json(
        { error: "Provider does not support required methods" },
        { status: 400 }
      );
    }

    // Create customer with proper typing
    const customerResult = (await provider.createCustomer(email, name)) as {
      success: boolean;
      customerId?: string;
      error?: string;
    };
    if (!customerResult.success || !customerResult.customerId) {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_FAILED,
        companyId: gateway.companyId,
        description: customerResult.error || "Failed to create customer",
        metadata: { email, name },
      });
      return NextResponse.json(
        { error: customerResult.error || "Failed to create customer" },
        { status: 500 }
      );
    }

    // Create setup intent with proper typing
    const setupIntentResult = (await provider.createSetupIntent(
      customerResult.customerId
    )) as { success: boolean; clientSecret?: string; error?: string };
    if (!setupIntentResult.success || !setupIntentResult.clientSecret) {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_FAILED,
        companyId: gateway.companyId,
        description: setupIntentResult.error || "Failed to create setup intent",
        metadata: { email, name, customerId: customerResult.customerId },
      });
      return NextResponse.json(
        { error: setupIntentResult.error || "Failed to create setup intent" },
        { status: 500 }
      );
    }

    await createAuditLog({
      action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_CREATED,
      companyId: gateway.companyId,
      description: "Setup intent created",
      metadata: {
        email,
        name,
        customerId: customerResult.customerId,
        clientSecret: !!setupIntentResult.clientSecret,
      },
    });

    return NextResponse.json({
      clientSecret: setupIntentResult.clientSecret,
      customerId: customerResult.customerId,
    });
  } catch (error) {
    console.error("Setup intent creation error:", error);
    await createAuditLog({
      action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_FAILED,
      description: "Unhandled error creating setup intent",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return NextResponse.json(
      { error: "Failed to create setup intent" },
      { status: 500 }
    );
  }
}
