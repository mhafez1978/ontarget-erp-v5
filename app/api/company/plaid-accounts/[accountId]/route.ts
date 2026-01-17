import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

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

    // Owner-only for bank account disconnection
    const company = account.company;
    if (
      !company ||
      (company.ownerId !== userId && user.role !== "SUPER_ADMIN")
    ) {
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
