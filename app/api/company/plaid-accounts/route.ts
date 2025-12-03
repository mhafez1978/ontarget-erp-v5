import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET - Retrieve Plaid accounts for a company
export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompanies: true,
        companyMemberships: {
          include: { company: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user owns the company or is a member with appropriate role
    const hasAccess =
      user.role === "SUPER_ADMIN" ||
      user.ownedCompanies.some((c) => c.id === companyId) ||
      user.companyMemberships.some(
        (m) =>
          m.companyId === companyId &&
          ["ADMIN", "MANAGER"].includes(m.role as string)
      );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch Plaid accounts for the company
    const accounts = await db.plaidAccount.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    // Don't send access tokens back
    const safeAccounts = accounts.map((account) => ({
      id: account.id,
      accountName: account.accountName,
      accountMask: account.accountMask,
      accountType: account.accountType,
      institutionName: account.institutionName,
      isActive: account.isActive,
      lastSyncAt: account.lastSyncAt,
      createdAt: account.createdAt,
    }));

    return NextResponse.json(safeAccounts);
  } catch (error) {
    console.error("Error fetching Plaid accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch Plaid accounts" },
      { status: 500 }
    );
  }
}
