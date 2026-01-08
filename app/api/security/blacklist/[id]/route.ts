import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";

// DELETE - Unblock an IP (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const user = validation.user;

    // Check if user is Super Admin
    if (user.role !== "SUPER_ADMIN") {
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
