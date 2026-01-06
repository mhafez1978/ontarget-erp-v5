import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * Get platform fee statistics (Super Admin only)
 * GET /api/admin/platform-fees/stats?days=30
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    // Check if user is super admin
    const user = await db.user.findUnique({
      where: { id: validation.user.id },
      select: { role: true },
    });

    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all payments from the specified time range
    // Note: We filter for platform fees in JavaScript since JSON querying varies by database
    const allPayments = await db.payment.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "SUCCEEDED",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            subscriberSubscriptions: {
              where: { status: "ACTIVE" },
              select: {
                plan: true,
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter for payments with platform fees
    const payments = allPayments.filter((payment) => {
      const metadata = payment.metadata as any;
      return metadata && metadata.platformFee;
    });

    // Calculate totals
    let totalFeesCollected = 0;
    const feesByPlan: Record<
      string,
      { feesCollected: number; transactions: number; feePercents: number[] }
    > = {};
    const feesByCompany: Record<
      string,
      {
        companyName: string;
        planName: string;
        feesCollected: number;
        transactions: number;
        feePercent: number;
      }
    > = {};

    for (const payment of payments) {
      const platformFee = payment.metadata as any;
      if (!platformFee?.platformFee) continue;

      const feeAmount = platformFee.platformFee.amountCents || 0;
      const feePercent = platformFee.platformFee.percent || 0;
      const planName =
        payment.company.subscriberSubscriptions[0]?.plan || "Unknown";

      totalFeesCollected += feeAmount;

      // By plan
      if (!feesByPlan[planName]) {
        feesByPlan[planName] = {
          feesCollected: 0,
          transactions: 0,
          feePercents: [],
        };
      }
      feesByPlan[planName].feesCollected += feeAmount;
      feesByPlan[planName].transactions += 1;
      feesByPlan[planName].feePercents.push(feePercent);

      // By company
      if (!feesByCompany[payment.companyId]) {
        feesByCompany[payment.companyId] = {
          companyName: payment.company.name,
          planName,
          feesCollected: 0,
          transactions: 0,
          feePercent,
        };
      }
      feesByCompany[payment.companyId].feesCollected += feeAmount;
      feesByCompany[payment.companyId].transactions += 1;
    }

    // Format by plan
    const byPlan = Object.entries(feesByPlan).map(([planName, data]) => ({
      planName,
      feesCollected: data.feesCollected,
      transactions: data.transactions,
      averageFeePercent:
        data.feePercents.reduce((a, b) => a + b, 0) / data.feePercents.length,
    }));

    // Format by company and sort by fees collected
    const byCompany = Object.entries(feesByCompany)
      .map(([companyId, data]) => ({
        companyId,
        ...data,
      }))
      .sort((a, b) => b.feesCollected - a.feesCollected);

    // Recent transactions (last 20)
    const recentTransactions = payments.slice(0, 20).map((payment) => {
      const platformFee = payment.metadata as any;
      return {
        id: payment.id,
        companyName: payment.company.name,
        amount: Math.round(Number(payment.amount) * 100), // Convert to cents
        feeAmount: platformFee?.platformFee?.amountCents || 0,
        feePercent: platformFee?.platformFee?.percent || 0,
        createdAt: payment.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      totalFeesCollected,
      totalTransactions: payments.length,
      byPlan,
      byCompany,
      recentTransactions,
    });
  } catch (error) {
    console.error("Error fetching platform fee stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform fee statistics" },
      { status: 500 }
    );
  }
}
