import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { decrypt } from "@/lib/encryption";
import { PaymentProviderName } from "@/lib/payment-providers/constants";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import { getGeoLocation, extractClientIp } from "@/lib/geo-location";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get("companyId") || undefined;

    const gateway = companyId
      ? await paymentsService.getGatewayForCompany(companyId)
      : await paymentsService.getRootGateway();
    if (!gateway || !gateway.isEnabled) {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_GATEWAY_PUBLISHABLE_KEY_FAILED,
        companyId: companyId ?? gateway?.companyId ?? null,
        description: "Payment provider not configured",
        metadata: { companyId: companyId ?? null, provider: gateway?.provider },
      });
      return NextResponse.json(
        { error: "Payment provider not configured" },
        { status: 404 }
      );
    }

    if (gateway.provider !== PaymentProviderName.STRIPE) {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_GATEWAY_PUBLISHABLE_KEY_FAILED,
        companyId: gateway.companyId,
        description: "Provider is not Stripe",
        metadata: { provider: gateway.provider },
      });
      return NextResponse.json(
        { error: "Stripe provider is not configured for checkout" },
        { status: 400 }
      );
    }

    const publishableKey = gateway.publicKey
      ? decrypt(gateway.publicKey)
      : null;
    if (!publishableKey) {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYMENT_GATEWAY_PUBLISHABLE_KEY_FAILED,
        companyId: gateway.companyId,
        description: "Publishable key missing",
        metadata: { provider: gateway.provider },
      });
      return NextResponse.json(
        { error: "Publishable key missing for payment provider" },
        { status: 400 }
      );
    }

    const response = {
      publishableKey,
      provider: gateway.provider,
      isTestMode: gateway.isTestMode,
    };

    // Attempt to enrich audit log with geo information from client IP
    const clientIp = extractClientIp(request.headers);
    const geoData = await getGeoLocation(clientIp);

    await createAuditLog({
      action: AUDIT_ACTIONS.PAYMENT_GATEWAY_PUBLISHABLE_KEY_FETCHED,
      companyId: gateway.companyId,
      description: "Publishable key fetched",
      metadata: { provider: gateway.provider, isTestMode: gateway.isTestMode },
      ipAddress: geoData?.ip || null,
      ipv4: geoData?.ipv4 || null,
      ipv6: geoData?.ipv6 || null,
      city: geoData?.city || null,
      state: geoData?.region || null,
      country: geoData?.country_name || null,
      countryFlag: geoData?.flag || null,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/payments/public-key error", error);
    await createAuditLog({
      action: AUDIT_ACTIONS.PAYMENT_GATEWAY_PUBLISHABLE_KEY_FAILED,
      description: "Unhandled error fetching publishable key",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return NextResponse.json(
      { error: "Failed to load payment provider" },
      { status: 500 }
    );
  }
}
