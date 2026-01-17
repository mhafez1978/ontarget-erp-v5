import { NextRequest, NextResponse } from "next/server";
import { resetMonthlyUsage } from "@/lib/hedera/cost-manager";

/**
 * POST /api/cron/reset-hedera-budgets
 * Cron endpoint to reset monthly Hedera usage counters
 *
 * Should be called at the start of each month via:
 * - Vercel Cron Job
 * - External cron service (with auth token)
 * - Manual trigger for testing
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await resetMonthlyUsage();

    return NextResponse.json({
      success: true,
      message: "Monthly usage counters reset successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to reset monthly usage:", error);
    return NextResponse.json(
      {
        error: "Failed to reset usage counters",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing in development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  return POST(request);
}
