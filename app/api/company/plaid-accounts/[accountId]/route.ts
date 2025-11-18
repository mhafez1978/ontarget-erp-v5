import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the account
    const account = await db.plaidAccount.findUnique({
      where: { id: accountId },
      include: { company: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Verify user has access
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

    const hasAccess =
      user.role === "SUPER_ADMIN" ||
      user.ownedCompanies.some((c) => c.id === account.companyId) ||
      user.companyMemberships.some(
        (m) =>
          m.companyId === account.companyId &&
          ["ADMIN", "MANAGER"].includes(m.role as string)
      );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the account
    await db.plaidAccount.delete({
      where: { id: accountId },
    });

    return NextResponse.json({
      message: "Bank account disconnected successfully",
    });
  } catch (error) {
    console.error("Error disconnecting Plaid account:", error);
    return NextResponse.json(
      { error: "Failed to disconnect bank account" },
      { status: 500 }
    );
  }
}
