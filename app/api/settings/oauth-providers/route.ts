import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;

    // SUPER_ADMIN sees global settings
    if (user.role === "SUPER_ADMIN") {
      const providers = await db.oAuthProviderSetting.findMany({
        select: {
          id: true,
          provider: true,
          enabled: true,
          clientId: true,
          clientSecret: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Decrypt clientSecret for display (show that it exists but don't expose the actual value)
      const providersWithDecryption = providers.map((p) => ({
        ...p,
        clientSecret: p.clientSecret ? "••••••••" : null, // Mask the secret, don't send actual value
        hasClientSecret: !!p.clientSecret, // Flag to indicate if secret exists
      }));

      return NextResponse.json({
        providers: providersWithDecryption,
        scope: "GLOBAL",
      });
    }

    // Other users see ONLY company-specific settings (never global settings)
    // Get user's company
    const userWithCompany = await db.user.findUnique({
      where: { id: user.id },
      select: {
        plan: true,
        ownedCompanies: {
          select: { id: true },
          take: 1,
        },
        companyMemberships: {
          select: { companyId: true },
          where: { role: { in: ["ADMIN_OWNER", "ADMIN_NONOWNER"] } },
          take: 1,
        },
      },
    });

    const companyId =
      userWithCompany?.ownedCompanies[0]?.id ||
      userWithCompany?.companyMemberships[0]?.companyId;

    if (!companyId) {
      // No company, return empty array - DO NOT return global settings
      return NextResponse.json({
        providers: [],
        scope: "COMPANY",
        plan: userWithCompany?.plan || "ESSENTIAL",
        canCustomize: false,
      });
    }

    // Get company-specific OAuth settings ONLY
    const companyProviders = await db.companyOAuthSetting.findMany({
      where: { companyId },
      select: {
        id: true,
        provider: true,
        enabled: true,
        clientId: true,
        clientSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Mask clientSecret for company providers too
    const maskedCompanyProviders = companyProviders.map((p) => ({
      ...p,
      clientSecret: p.clientSecret ? "••••••••" : null,
      hasClientSecret: !!p.clientSecret,
    }));

    // Check if user's plan allows OAuth customization (GROWTH and ENTERPRISE only)
    // SUPER_ADMIN always has access regardless of plan
    const userPlan = userWithCompany?.plan || "ESSENTIAL";
    const canCustomize =
      user.role === "SUPER_ADMIN" ||
      ["GROWTH", "ENTERPRISE", "SUPER_ADMIN"].includes(userPlan);

    return NextResponse.json({
      providers: maskedCompanyProviders,
      scope: "COMPANY",
      companyId,
      plan: userPlan,
      canCustomize,
    });
  } catch (error) {
    console.error("Error fetching OAuth providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch OAuth providers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const body = await request.json();
    const { provider, enabled, clientId, clientSecret } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // SUPER_ADMIN manages global settings
    if (user.role === "SUPER_ADMIN") {
      const existingProvider = await db.oAuthProviderSetting.findUnique({
        where: { provider },
      });

      // Encrypt clientSecret if provided
      const encryptedSecret = clientSecret ? encrypt(clientSecret) : undefined;

      let providerSettings;
      if (existingProvider) {
        providerSettings = await db.oAuthProviderSetting.update({
          where: { provider },
          data: {
            enabled,
            ...(clientId !== undefined && { clientId }),
            ...(encryptedSecret !== undefined && {
              clientSecret: encryptedSecret,
            }),
          },
          select: {
            id: true,
            provider: true,
            enabled: true,
            clientId: true,
            updatedAt: true,
          },
        });
      } else {
        providerSettings = await db.oAuthProviderSetting.create({
          data: {
            provider,
            enabled,
            clientId,
            clientSecret: encryptedSecret,
          },
          select: {
            id: true,
            provider: true,
            enabled: true,
            clientId: true,
            updatedAt: true,
          },
        });
      }

      return NextResponse.json({ success: true, provider: providerSettings });
    }

    // Non-SUPER_ADMIN users manage company-specific settings
    // Get user's company
    const userWithCompany = await db.user.findUnique({
      where: { id: user.id },
      select: {
        plan: true,
        ownedCompanies: {
          select: { id: true },
          take: 1,
        },
        companyMemberships: {
          select: { companyId: true },
          where: { role: { in: ["ADMIN_OWNER", "ADMIN_NONOWNER"] } },
          take: 1,
        },
      },
    });

    const companyId =
      userWithCompany?.ownedCompanies[0]?.id ||
      userWithCompany?.companyMemberships[0]?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "No company found. Create a company first." },
        { status: 403 }
      );
    }

    // Check plan permissions for OAuth override
    const plan = userWithCompany?.plan || "ESSENTIAL";
    if (
      plan === "ESSENTIAL" ||
      plan === "TRIAL" ||
      plan === "COMPANY_CUSTOMER"
    ) {
      return NextResponse.json(
        {
          error: "PLAN_UPGRADE_REQUIRED",
          message:
            "OAuth provider customization requires GROWTH or ENTERPRISE plan",
          requiredPlan: "GROWTH",
        },
        { status: 403 }
      );
    }

    // GROWTH and ENTERPRISE plans can override
    const existingProvider = await db.companyOAuthSetting.findFirst({
      where: { companyId, provider },
    });

    // Encrypt clientSecret if provided
    const encryptedSecret = clientSecret ? encrypt(clientSecret) : undefined;

    let providerSettings;
    if (existingProvider) {
      providerSettings = await db.companyOAuthSetting.update({
        where: { id: existingProvider.id },
        data: {
          enabled,
          ...(clientId !== undefined && { clientId }),
          ...(encryptedSecret !== undefined && {
            clientSecret: encryptedSecret,
          }),
        },
        select: {
          id: true,
          provider: true,
          enabled: true,
          clientId: true,
          updatedAt: true,
        },
      });
    } else {
      providerSettings = await db.companyOAuthSetting.create({
        data: {
          companyId,
          provider,
          enabled,
          clientId,
          clientSecret: encryptedSecret,
        },
        select: {
          id: true,
          provider: true,
          enabled: true,
          clientId: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      provider: providerSettings,
      scope: "COMPANY",
    });
  } catch (error) {
    console.error("Error updating OAuth provider:", error);
    return NextResponse.json(
      { error: "Failed to update OAuth provider" },
      { status: 500 }
    );
  }
}
