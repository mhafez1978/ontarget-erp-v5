import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    // Get companyId from query params (for SUPER_ADMIN with multiple companies)
    const { searchParams } = new URL(req.url);
    const requestedCompanyId = searchParams.get("companyId");

    // Fetch user with role
    const user = validation.user;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // LEDGER ACCESS CONTROL: allow ADMIN_OWNER, ADMIN_NONOWNER, SUPER_ADMIN, COMPANY_MANAGER, and COMPANY_STAFF (read-only for non-admins)
    const allowedRoles = [
      "ADMIN_OWNER",
      "ADMIN_NONOWNER",
      "SUPER_ADMIN",
      "COMPANY_MANAGER",
      "COMPANY_STAFF",
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error:
            "Access Denied: Ledger is only accessible to company administrators or members",
        },
        { status: 403 }
      );
    }

    // Get user's company (policy enforced per role)
    let companyId: string | null = null;

    if (user.role === "SUPER_ADMIN") {
      // Super admin may only view companies they OWN
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
        const company = await db.company.findFirst({
          where: { ownerId: user.id },
          select: { id: true },
        });
        companyId = company?.id || null;
      }
    } else if (user.role === "ADMIN_OWNER" || user.role === "ADMIN_NONOWNER") {
      // Admins can view companies they own or are admins of (for ADMIN_NONOWNER this will only match member companies)
      if (requestedCompanyId) {
        const company = await db.company.findFirst({
          where: {
            id: requestedCompanyId,
            OR: [
              { ownerId: user.id },
              {
                members: {
                  some: { userId: user.id, role: "ADMIN_NONOWNER" },
                },
              },
            ],
          },
          select: { id: true },
        });

        if (!company) {
          return NextResponse.json(
            { error: "Access Denied: You don't have access to this company" },
            { status: 403 }
          );
        }

        companyId = company.id;
      } else {
        // Prefer owned company if any, otherwise company where they're a member/admin
        const company = await db.company.findFirst({
          where: {
            OR: [
              { ownerId: user.id },
              {
                members: { some: { userId: user.id, role: "ADMIN_NONOWNER" } },
              },
            ],
          },
          select: { id: true },
        });
        companyId = company?.id || null;
      }
    } else {
      // COMPANY_MANAGER / COMPANY_STAFF: only allowed to view company where they are a member or staff
      if (requestedCompanyId) {
        const membership = await db.companyMember.findFirst({
          where: { userId: user.id, companyId: requestedCompanyId },
          select: { companyId: true },
        });

        const staffRecord = await db.companyStaff.findFirst({
          where: { userId: user.id, companyId: requestedCompanyId },
          select: { companyId: true },
        });

        if (!membership && !staffRecord) {
          return NextResponse.json(
            { error: "Access Denied: You don't have access to this company" },
            { status: 403 }
          );
        }

        companyId = requestedCompanyId;
      } else {
        // Pick company from membership or staff record
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
