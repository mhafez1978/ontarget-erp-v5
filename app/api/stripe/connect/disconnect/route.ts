import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";

/**
 * Disconnect Stripe Connected Account
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
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
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const previousAccountId = company.stripeConnectedAccountId;

    // Update company to disconnect
    await db.company.update({
      where: { id: company.id },
      data: {
        stripeConnectedAccountId: null,
        stripeAccountStatus: "not_connected",
        stripeOnboardedAt: null,
      },
    });

    // Create audit log
    await createAuditLog({
      companyId: company.id,
      userId: validation.user.id,
      action: "STRIPE_CONNECT_DISCONNECTED",
      metadata: {
        previousAccountId,
      },
      ipAddress: null,
    });

    return NextResponse.json({
      success: true,
      message: "Stripe account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Stripe account:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Stripe account" },
      { status: 500 }
    );
  }
}
