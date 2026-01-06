import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import type {
  User,
  Company,
  CompanyMember,
  CompanyStaff,
} from "@prisma/client";

interface PaymentProviderSettingsBody {
  scope?: "GLOBAL" | string;
  companyId?: string;
  provider: string;
  publicKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  stripeConnectClientId?: string;
  isTestMode?: boolean;
}

interface UserWithRelations extends User {
  ownedCompanies: Company[];
  companyMemberships: CompanyMember[];
  companyStaff: CompanyStaff[];
}

/**
 * Check if user has permission to manage payment provider for a company
 */
async function hasPaymentProviderAccess(
  userId: string,
  userRole: string,
  targetCompanyId: string
): Promise<boolean> {
  if (userRole === "SUPER_ADMIN") return true;

  const userWithCompanies = (await db.user.findUnique({
    where: { id: userId },
    include: {
      ownedCompanies: true,
      companyMemberships: true,
      companyStaff: true,
    },
  })) as UserWithRelations | null;

  if (!userWithCompanies) return false;

  return (
    userWithCompanies.ownedCompanies.some((c) => c.id === targetCompanyId) ||
    userWithCompanies.companyMemberships.some(
      (m) =>
        m.companyId === targetCompanyId && ["ADMIN", "MANAGER"].includes(m.role)
    ) ||
    userWithCompanies.companyStaff.some(
      (s) =>
        s.companyId === targetCompanyId && ["ADMIN", "MANAGER"].includes(s.role)
    )
  );
}

// GET - fetch provider config (scope=GLOBAL or companyId)
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const url = new URL(request.url);
    const scope = url.searchParams.get("scope");
    const companyId = url.searchParams.get("companyId");
    const provider = url.searchParams.get("provider") || undefined;

    let targetCompanyId = companyId;
    if (scope === "GLOBAL") {
      const root = await db.company.findFirst({ where: { isRoot: true } });
      if (!root)
        return NextResponse.json({ error: "No root company" }, { status: 404 });
      targetCompanyId = root.id;
    }

    if (!targetCompanyId) return NextResponse.json({ provider: null });

    const gateway = await db.paymentGateway.findFirst({
      where: { companyId: targetCompanyId, provider: provider },
    });

    // Do not expose encrypted secrets in the response
    if (gateway) {
      const safe = {
        id: gateway.id,
        provider: gateway.provider,
        isEnabled: gateway.isEnabled,
        isTestMode: gateway.isTestMode,
        publicKey: gateway.publicKey,
        stripeConnectClientId: gateway.stripeConnectClientId,
        lastTestedAt: gateway.lastTestedAt,
        lastTestResult: gateway.lastTestResult,
      };
      return NextResponse.json({ provider: safe });
    }

    return NextResponse.json({ provider: null });
  } catch (error) {
    console.error("GET /api/settings/payment-provider error:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}

// POST - save provider config (SUPER_ADMIN required for GLOBAL)
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;
    const { user } = validation;

    const body = await request.json();
    const {
      scope,
      companyId,
      provider,
      publicKey,
      secretKey,
      webhookSecret,
      stripeConnectClientId,
      isTestMode,
    } = body as PaymentProviderSettingsBody;

    let targetCompanyId = companyId;
    if (scope === "GLOBAL") {
      if (user.role !== "SUPER_ADMIN")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const root = await db.company.findFirst({ where: { isRoot: true } });
      if (!root)
        return NextResponse.json({ error: "No root company" }, { status: 404 });
      targetCompanyId = root.id;
    }

    if (!targetCompanyId)
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    if (!provider)
      return NextResponse.json({ error: "Missing provider" }, { status: 400 });

    // Check permission for company-scoped changes: allow SUPER_ADMIN or company ADMINs
    if (scope !== "GLOBAL") {
      const hasAccess = await hasPaymentProviderAccess(
        user.id,
        user.role,
        targetCompanyId
      );
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Require all keys for Stripe provider to avoid incomplete configuration
    if (provider === "stripe" && (!publicKey || !secretKey || !webhookSecret)) {
      return NextResponse.json(
        {
          error:
            "Publishable key, secret key and webhook secret are required for Stripe",
        },
        { status: 400 }
      );
    }

    const encryptModule = await import("@/lib/encryption");
    const { encrypt } = encryptModule;

    const existing = await db.paymentGateway.findFirst({
      where: { companyId: targetCompanyId, provider },
    });
    let gateway: any;

    // Do not overwrite existing keys when empty — only set if provided
    const encryptedPublicForUpdate = publicKey ? encrypt(publicKey) : undefined;
    const encryptedPublicForCreate = publicKey ? encrypt(publicKey) : null;

    const dataToSave: any = {
      publicKey: encryptedPublicForUpdate,
      isTestMode: isTestMode ?? true,
      isEnabled: true,
      configuredBy: user.id,
    };

    if (secretKey) dataToSave.secretKey = encrypt(secretKey);
    if (webhookSecret) dataToSave.webhookSecret = encrypt(webhookSecret);
    if (stripeConnectClientId)
      dataToSave.stripeConnectClientId = stripeConnectClientId;

    if (existing) {
      // Only update publicKey if provided (else leave as-is)
      const updateData = { ...dataToSave };
      if (encryptedPublicForUpdate === undefined) delete updateData.publicKey;

      gateway = await db.paymentGateway.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      gateway = await db.paymentGateway.create({
        data: {
          companyId: targetCompanyId,
          provider,
          publicKey: encryptedPublicForCreate,
          secretKey: secretKey ? encrypt(secretKey) : null,
          webhookSecret: webhookSecret ? encrypt(webhookSecret) : null,
          stripeConnectClientId: stripeConnectClientId || null,
          isTestMode: isTestMode ?? true,
          configuredBy: user.id,
        },
      });
    }

    return NextResponse.json({ success: true, gateway });
  } catch (error) {
    console.error("POST /api/settings/payment-provider error:", error);
    return NextResponse.json(
      { error: "Failed to save provider" },
      { status: 500 }
    );
  }
}
