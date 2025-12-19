import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import { getGeoLocation, extractClientIp } from "@/lib/geo-location";

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
    let provider;
    try {
      provider = paymentsService.instantiateStripeProviderFromGateway(gateway);
    } catch (providerError) {
      console.error("Failed to instantiate Stripe provider:", providerError);
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_FAILED,
        companyId: gateway.companyId,
        description: "Failed to instantiate payment provider",
        metadata: {
          error:
            providerError instanceof Error
              ? providerError.message
              : String(providerError),
          provider: gateway.provider,
        },
      });
      return NextResponse.json(
        {
          error:
            providerError instanceof Error
              ? providerError.message
              : "Failed to initialize payment provider",
        },
        { status: 500 }
      );
    }

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

    // Try to obtain client geo info for audit logging
    const clientIp = extractClientIp(request.headers);
    const geoData = await getGeoLocation(clientIp);

    // Create customer with proper typing
    const customerResult = (await provider.createCustomer(email, name)) as {
      success: boolean;
      customerId?: string;
      error?: string;
    };
    if (!customerResult.success || !customerResult.customerId) {
      console.error("Failed to create Stripe customer:", customerResult.error);
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_FAILED,
        companyId: gateway.companyId,
        description: customerResult.error || "Failed to create customer",
        metadata: { email, name },
        ipAddress: geoData?.ip || null,
        ipv4: geoData?.ipv4 || null,
        ipv6: geoData?.ipv6 || null,
        city: geoData?.city || null,
        state: geoData?.region || null,
        country: geoData?.country_name || null,
        countryFlag: geoData?.flag || null,
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
      console.error("Failed to create setup intent:", setupIntentResult.error);
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_SETUP_INTENT_FAILED,
        companyId: gateway.companyId,
        description: setupIntentResult.error || "Failed to create setup intent",
        metadata: { email, name, customerId: customerResult.customerId },
        ipAddress: geoData?.ip || null,
        ipv4: geoData?.ipv4 || null,
        ipv6: geoData?.ipv6 || null,
        city: geoData?.city || null,
        state: geoData?.region || null,
        country: geoData?.country_name || null,
        countryFlag: geoData?.flag || null,
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
      ipAddress: geoData?.ip || null,
      ipv4: geoData?.ipv4 || null,
      ipv6: geoData?.ipv6 || null,
      city: geoData?.city || null,
      state: geoData?.region || null,
      country: geoData?.country_name || null,
      countryFlag: geoData?.flag || null,
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
