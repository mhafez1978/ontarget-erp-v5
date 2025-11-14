import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Security statistics (Super Admin only)
export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is Super Admin
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get failed attempts counts
    const [
      attemptsLastHour,
      attemptsLast24Hours,
      attemptsLast7Days,
      totalAttempts,
    ] = await Promise.all([
      db.failedLoginAttempt.count({
        where: { attemptedAt: { gte: oneHourAgo } },
      }),
      db.failedLoginAttempt.count({
        where: { attemptedAt: { gte: oneDayAgo } },
      }),
      db.failedLoginAttempt.count({
        where: { attemptedAt: { gte: sevenDaysAgo } },
      }),
      db.failedLoginAttempt.count(),
    ]);

    // Get currently blocked IPs count
    const blockedIpsCount = await db.ipBlacklist.count({
      where: {
        OR: [
          { isPermanent: true },
          {
            blockedUntil: { gte: now },
            isPermanent: false,
          },
        ],
      },
    });

    // Get top attacking countries
    const topCountries = await db.failedLoginAttempt.groupBy({
      by: ["country", "countryFlag"],
      where: {
        country: { not: null },
        attemptedAt: { gte: sevenDaysAgo },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Get most targeted emails
    const topTargetedEmails = await db.failedLoginAttempt.groupBy({
      by: ["email"],
      where: {
        attemptedAt: { gte: sevenDaysAgo },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // Get recent threats (IPs with 4+ attempts in last hour)
    const recentThreats = await db.failedLoginAttempt.groupBy({
      by: ["ipAddress"],
      where: {
        attemptedAt: { gte: oneHourAgo },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gte: 4,
          },
        },
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    // Get attack timeline (last 24 hours, grouped by hour)
    const attackTimeline = await db.$queryRaw<
      { hour: string; count: bigint }[]
    >`
      SELECT 
        DATE_FORMAT(attemptedAt, '%Y-%m-%d %H:00:00') as hour,
        COUNT(*) as count
      FROM FailedLoginAttempt
      WHERE attemptedAt >= ${oneDayAgo}
      GROUP BY hour
      ORDER BY hour ASC
    `;

    return NextResponse.json({
      success: true,
      stats: {
        failedAttempts: {
          lastHour: attemptsLastHour,
          last24Hours: attemptsLast24Hours,
          last7Days: attemptsLast7Days,
          total: totalAttempts,
        },
        blockedIps: {
          active: blockedIpsCount,
        },
        topCountries: topCountries.map((c) => ({
          country: c.country,
          flag: c.countryFlag,
          attempts: c._count.id,
        })),
        topTargetedEmails: topTargetedEmails.map((e) => ({
          email: e.email,
          attempts: e._count.id,
        })),
        recentThreats: recentThreats.map((t) => ({
          ipAddress: t.ipAddress,
          attempts: t._count.id,
        })),
        attackTimeline: attackTimeline.map((t) => ({
          hour: t.hour,
          count: Number(t.count), // Convert BigInt to number
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching security stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch security statistics" },
      { status: 500 }
    );
  }
}
