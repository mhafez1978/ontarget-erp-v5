import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import type { PayrollSummary } from "@/lib/payroll/types";

export async function GET(req: NextRequest) {
  try {
    // Validate session using the API validation helper
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const user = validation.user;

    // Only ADMIN and SUPER_ADMIN can access payroll data
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get companyId from query params
    const { searchParams } = new URL(req.url);
    const requestedCompanyId = searchParams.get("companyId");

    // Determine which company to fetch data for
    let companyId: string | null = null;

    if (user.role === "SUPER_ADMIN") {
      // SUPER_ADMIN can specify which company
      if (requestedCompanyId) {
        companyId = requestedCompanyId;
      } else {
        const ownedCompany = await db.company.findFirst({
          where: { ownerId: user.id },
          select: { id: true },
        });

        if (ownedCompany) {
          companyId = ownedCompany.id;
        } else {
          // Get first company they have access to
          const membership = await db.companyMember.findFirst({
            where: { userId: user.id },
            select: { companyId: true },
          });
          companyId = membership?.companyId || null;
        }
      }
    } else {
      // ADMIN can only access their own company
      const staffRecord = await db.companyStaff.findFirst({
        where: {
          userId: user.id,
          role: "ADMIN",
        },
        select: { companyId: true },
      });
      companyId = staffRecord?.companyId || null;
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "No company found for user" },
        { status: 404 }
      );
    }

    // Get ledger for company
    const ledger = await db.ledger.findUnique({
      where: { companyId },
    });

    if (!ledger) {
      return NextResponse.json({ entries: [], summary: null }, { status: 200 });
    }

    // Fetch payroll entries for this ledger
    const payrollEntries = await db.payrollEntry.findMany({
      where: { ledgerId: ledger.id },
      include: {
        staff: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        jurisdiction: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const uniqueStaff = new Set(payrollEntries.map((e) => e.staffId));

    const currencyTotals = new Map<
      string,
      { gross: number; net: number; taxes: number; entries: number }
    >();

    payrollEntries.forEach((entry) => {
      const currency = entry.currency || "USD";
      const existing = currencyTotals.get(currency) || {
        gross: 0,
        net: 0,
        taxes: 0,
        entries: 0,
      };

      existing.gross += parseFloat(entry.grossAmount.toString());
      existing.net += parseFloat(entry.netAmount.toString());
      const breakdown = entry.taxBreakdown as {
        totals?: { totalTaxes?: number };
      };
      existing.taxes += parseFloat(
        (breakdown?.totals?.totalTaxes || 0).toString()
      );
      existing.entries += 1;

      currencyTotals.set(currency, existing);
    });

    const totalsByCurrency = Array.from(currencyTotals.entries())
      .map(([currency, totals]) => ({
        currency,
        gross: totals.gross.toFixed(2),
        net: totals.net.toFixed(2),
        taxes: totals.taxes.toFixed(2),
        entries: totals.entries,
      }))
      .sort(
        (a, b) =>
          parseFloat(b.gross) - parseFloat(a.gross) ||
          parseFloat(b.net) - parseFloat(a.net)
      );

    const primaryCurrency = totalsByCurrency[0]?.currency;
    const singleCurrencyTotals =
      totalsByCurrency.length === 1 ? totalsByCurrency[0] : undefined;

    const summary: PayrollSummary = {
      primaryCurrency,
      totalGrossPay: singleCurrencyTotals?.gross,
      totalNetPay: singleCurrencyTotals?.net,
      totalTaxes: singleCurrencyTotals?.taxes,
      totalEntries: payrollEntries.length,
      staffCount: uniqueStaff.size,
      totalsByCurrency,
    };

    // Format entries for response
    const formattedEntries = payrollEntries.map((entry) => ({
      id: entry.id,
      staffId: entry.staffId,
      periodStart: entry.periodStart.toISOString(),
      periodEnd: entry.periodEnd.toISOString(),
      payDate: entry.payDate.toISOString(),
      currency: entry.currency,
      hoursWorked: entry.hoursWorked?.toString() || "0",
      overtimeHours: entry.overtimeHours?.toString() || "0",
      grossAmount: entry.grossAmount.toString(),
      netAmount: entry.netAmount.toString(),
      status: entry.status,
      createdAt: entry.createdAt.toISOString(),
      taxBreakdown: entry.taxBreakdown,
      staff: {
        user: entry.staff.user,
        employmentClassification: entry.staff.employmentClassification,
        payRate: entry.staff.payRate?.toString(),
      },
      jurisdiction: entry.jurisdiction,
    }));

    return NextResponse.json({
      entries: formattedEntries,
      summary,
    });
  } catch (error) {
    console.error("Error fetching payroll entries:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
