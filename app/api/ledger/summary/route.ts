import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get companyId from query params (for SUPER_ADMIN with multiple companies)
    const { searchParams } = new URL(req.url);
    const requestedCompanyId = searchParams.get("companyId");

    // Fetch user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // LEDGER ACCESS CONTROL: Only ADMIN and SUPER_ADMIN allowed
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error:
            "Access Denied: Ledger is only accessible to company administrators",
        },
        { status: 403 }
      );
    }

    // Get user's company
    let companyId: string | null = null;

    if (user.role === "SUPER_ADMIN") {
      // If companyId provided in query, verify ownership
      if (requestedCompanyId) {
        const company = await db.company.findFirst({
          where: {
            id: requestedCompanyId,
            ownerId: user.id,
          },
          select: { id: true },
        });

        if (!company) {
          return NextResponse.json(
            { error: "Access Denied: You don't own this company" },
            { status: 403 }
          );
        }

        companyId = company.id;
      } else {
        // No companyId provided - get first owned company
        const company = await db.company.findFirst({
          where: { ownerId: user.id },
          select: { id: true },
        });
        companyId = company?.id || null;
      }
    } else if (user.role === "ADMIN") {
      // For ADMIN, get company they own or are admin of
      const company = await db.company.findFirst({
        where: {
          OR: [
            { ownerId: user.id },
            {
              members: {
                some: {
                  userId: user.id,
                  role: "ADMIN",
                },
              },
            },
          ],
        },
        select: { id: true },
      });
      companyId = company?.id || null;
    } else {
      // For other roles, get company through membership or staff
      const membership = await db.companyMember.findFirst({
        where: { userId: user.id },
        select: { companyId: true },
      });

      const staffRecord = await db.companyStaff.findFirst({
        where: { userId: user.id },
        select: { companyId: true },
      });

      companyId = membership?.companyId || staffRecord?.companyId || null;
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "No company found for user" },
        { status: 404 }
      );
    }

    // Get or create ledger for company
    let ledger = await db.ledger.findUnique({
      where: { companyId },
    });

    if (!ledger) {
      // Create ledger if it doesn't exist
      ledger = await db.ledger.create({
        data: {
          companyId,
          totalRevenue: 0,
          totalExpenses: 0,
          totalPayroll: 0,
          currentBalance: 0,
        },
      });
    }

    // Return ledger summary
    return NextResponse.json({
      totalRevenue: ledger.totalRevenue.toString(),
      totalExpenses: ledger.totalExpenses.toString(),
      totalPayroll: ledger.totalPayroll.toString(),
      currentBalance: ledger.currentBalance.toString(),
      bankConnected: !!ledger.plaidAccessToken,
      stripeConnected: !!ledger.stripeAccountId,
    });
  } catch (error) {
    console.error("Error fetching ledger summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger summary" },
      { status: 500 }
    );
  }
}
