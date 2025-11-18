import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit-log";
import { validateSession } from "@/lib/session-manager";

// DELETE - Unblock an IP (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    // Check if user is Super Admin
    if (validation.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Find blacklist entry
    const blacklistEntry = await db.ipBlacklist.findUnique({
      where: { id },
    });

    if (!blacklistEntry) {
      return NextResponse.json(
        { error: "Blacklist entry not found" },
        { status: 404 }
      );
    }

    // Delete the blacklist entry
    await db.ipBlacklist.delete({
      where: { id },
    });

    // Log audit event
    await createAuditLog({
      userId,
      action: "IP_UNBLOCKED",
      description: `IP ${blacklistEntry.ipAddress} unblocked by ${user.name}`,
      ipAddress: blacklistEntry.ipAddress,
      city: blacklistEntry.city,
      state: blacklistEntry.state,
      country: blacklistEntry.country,
      countryFlag: blacklistEntry.countryFlag,
      metadata: {
        unblockedBy: user.name,
        wasAutoBlocked: blacklistEntry.isAutoBlocked,
        wasPermanent: blacklistEntry.isPermanent,
        originalReason: blacklistEntry.reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `IP ${blacklistEntry.ipAddress} has been unblocked`,
    });
  } catch (error) {
    console.error("Error unblocking IP:", error);
    return NextResponse.json(
      { error: "Failed to unblock IP" },
      { status: 500 }
    );
  }
}
