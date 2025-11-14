import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ipAddress = searchParams.get("ip");

    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 }
      );
    }

    // Check if IP is in blacklist
    const blacklistEntry = await db.ipBlacklist.findUnique({
      where: { ipAddress },
    });

    if (!blacklistEntry) {
      return NextResponse.json({
        blocked: false,
        ipAddress,
      });
    }

    // Check if permanent block
    if (blacklistEntry.isPermanent) {
      return NextResponse.json({
        blocked: true,
        ipAddress,
        reason: blacklistEntry.reason,
        isPermanent: true,
        blockedAt: blacklistEntry.blockedAt,
      });
    }

    // Check if temporary block has expired
    const now = new Date();
    if (blacklistEntry.blockedUntil < now) {
      // Block has expired, remove from blacklist
      await db.ipBlacklist.delete({
        where: { id: blacklistEntry.id },
      });

      return NextResponse.json({
        blocked: false,
        ipAddress,
        wasBlocked: true,
        expiredAt: blacklistEntry.blockedUntil,
      });
    }

    // IP is currently blocked
    return NextResponse.json({
      blocked: true,
      ipAddress,
      reason: blacklistEntry.reason,
      blockedAt: blacklistEntry.blockedAt,
      blockedUntil: blacklistEntry.blockedUntil,
      failedAttempts: blacklistEntry.failedAttempts,
      isAutoBlocked: blacklistEntry.isAutoBlocked,
    });
  } catch (error) {
    console.error("Error checking IP blacklist:", error);
    return NextResponse.json(
      { error: "Failed to check IP status" },
      { status: 500 }
    );
  }
}
