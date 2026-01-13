import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * GET /api/company/hedera/status
 * Get Hedera blockchain status for a company
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
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    // Get company Hedera settings
    const settings = await db.companyHederaSetting.findUnique({
      where: { companyId },
    });

    if (!settings) {
      return NextResponse.json({
        enabled: false,
        historicalAnchored: false,
        enabledAt: null,
        transactionCount: 0,
      });
    }

    return NextResponse.json({
      enabled: settings.enabled,
      historicalAnchored: settings.historicalAnchored,
      enabledAt: settings.enabledAt,
      transactionCount: settings.transactionCount,
    });
  } catch (error) {
    console.error("Failed to get Hedera status:", error);
    return NextResponse.json(
      { error: "Failed to retrieve status" },
      { status: 500 }
    );
  }
}
