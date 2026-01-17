import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const body = await request.json();
    const { companyId, enable, historicalAnchoring, digitalSignature } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    // Check if Hedera is globally enabled
    const globalSetting = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (!globalSetting) {
      return NextResponse.json(
        {
          error:
            "Hedera is not configured globally. Please contact administrator.",
        },
        { status: 400 }
      );
    }

    // Check Company Admin or SUPER_ADMIN
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
                role: {
                  in: ["ADMIN_OWNER", "ADMIN_NONOWNER", "COMPANY_MANAGER"],
                },
              },
            },
          },
          ...(user.role === "SUPER_ADMIN" ? [{ id: companyId }] : []),
        ],
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already enabled
    const existingSetting = await db.companyHederaSetting.findUnique({
      where: { companyId },
    });

    if (existingSetting?.enabled && enable) {
      return NextResponse.json(
        { error: "Hedera is already enabled for this company" },
        { status: 400 }
      );
    }

    // Delegate enable flow (upsert, audits, and optional historical job) to helper for testability
    let update;
    try {
      const { enableCompanyHedera } = await import("@/lib/hedera/enable");
      update = await enableCompanyHedera({
        companyId,
        user: { id: user.id, email: user.email },
        enable,
        historicalAnchoring,
        digitalSignature,
        company,
        existingSetting,
      });
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "HISTORICAL_ALREADY_COMPLETED"
      ) {
        return NextResponse.json(
          { error: "Historical anchoring already completed for this company" },
          { status: 400 }
        );
      }
      if (
        err instanceof Error &&
        err.message === "HISTORICAL_ALREADY_IN_PROGRESS"
      ) {
        return NextResponse.json(
          { error: "Historical anchoring is already in progress" },
          { status: 400 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      update,
      message:
        historicalAnchoring && enable
          ? "Hedera enabled. Historical records will be anchored in background."
          : enable
          ? "Hedera enabled successfully"
          : "Hedera disabled",
    });
  } catch (error) {
    console.error("POST /api/company/hedera/enable error:", error);
    return NextResponse.json(
      { error: "Failed to update company setting" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/company/hedera/enable
 * Check if Hedera is enabled for a company
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const setting = await db.companyHederaSetting.findUnique({
      where: { companyId },
    });

    return NextResponse.json({
      enabled: setting?.enabled || false,
      historicalAnchored: setting?.historicalAnchored || false,
      historicalJobId: setting?.historicalJobId,
      enabledAt: setting?.enabledAt,
      monthlyBudget: setting?.monthlyBudgetHbar?.toString(),
      currentMonthSpent: setting?.currentMonthSpent?.toString(),
      budgetExceeded: setting?.budgetExceeded || false,
      transactionCount: setting?.transactionCount || 0,
    });
  } catch (error) {
    console.error("Failed to check Hedera status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
