import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * GET /api/companies/blockchain-status
 * Get all companies owned by the current user with their blockchain status
 * Available to SUPER_ADMIN and ADMIN_OWNER roles
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    // Only SUPER_ADMIN and ADMIN_OWNER can access this
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN_OWNER") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all companies owned by this user
    const companies = await db.company.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Check if Hedera is globally configured
    const globalHederaSetting = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL" },
      select: {
        isActive: true,
        hederaAccount: true,
        hederaHexKey: true,
        hederaDerKey: true,
        topicId: true,
      },
    });

    const isGloballyConfigured =
      globalHederaSetting?.isActive &&
      globalHederaSetting?.hederaAccount &&
      (globalHederaSetting?.hederaHexKey ||
        globalHederaSetting?.hederaDerKey) &&
      globalHederaSetting?.topicId;

    // Get blockchain status for each company
    const companiesWithStatus = await Promise.all(
      companies.map(async (company) => {
        const hederaSetting = await db.companyHederaSetting.findUnique({
          where: { companyId: company.id },
          select: {
            enabled: true,
            historicalAnchored: true,
            enabledAt: true,
            transactionCount: true,
          },
        });

        return {
          id: company.id,
          name: company.name,
          enabled: hederaSetting?.enabled || false,
          historicalAnchored: hederaSetting?.historicalAnchored || false,
          enabledAt: hederaSetting?.enabledAt || null,
          transactionCount: hederaSetting?.transactionCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      companies: companiesWithStatus,
      isGloballyConfigured: !!isGloballyConfigured,
    });
  } catch (error) {
    console.error("Failed to fetch company blockchain status:", error);
    return NextResponse.json(
      { error: "Failed to retrieve company status" },
      { status: 500 }
    );
  }
}
