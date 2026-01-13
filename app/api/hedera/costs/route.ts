import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import {
  getBalanceInfo,
  getCompanyCostStats,
  getUnacknowledgedAlerts,
  acknowledgeAlert,
} from "@/lib/hedera/cost-manager";
import { db } from "@/lib/db";

/**
 * GET /api/hedera/costs
 * Retrieve Hedera cost statistics and balance information
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    // Get global balance info
    const balanceInfo = await getBalanceInfo();

    // Get company-specific stats if requested
    let companyStats = null;
    if (companyId) {
      companyStats = await getCompanyCostStats(companyId);
    }

    // Get alerts
    const alerts = await getUnacknowledgedAlerts(companyId || undefined);

    // Get global settings
    const settings = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
      select: {
        estimatedCostPerTx: true,
        totalTransactions: true,
        totalCostHbar: true,
        lowBalanceThreshold: true,
        network: true,
      },
    });

    return NextResponse.json({
      balance: balanceInfo,
      company: companyStats,
      alerts,
      settings,
    });
  } catch (error) {
    console.error("Failed to get cost data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve cost data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hedera/costs/acknowledge
 * Acknowledge a cost alert
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const body = await request.json();
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
    }

    await acknowledgeAlert(alertId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to acknowledge alert:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 }
    );
  }
}
