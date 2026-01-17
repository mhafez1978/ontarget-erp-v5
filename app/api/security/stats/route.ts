import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET - Security statistics (Admin and Super Admin)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;

    // Check if user is Admin or Super Admin
    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ADMIN_OWNER" &&
      user.role !== "ADMIN_NONOWNER"
    ) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get company user IDs if ADMIN_OWNER (to scope security data)
    let companyUserIds: string[] = [];
    if (user.role === "ADMIN_OWNER" || user.role === "ADMIN_NONOWNER") {
      const userWithCompany = await db.user.findUnique({
        where: { id: user.id },
        select: {
          ownedCompanies: {
            select: {
              staff: {
                select: { userId: true },
              },
            },
          },
          companyMemberships: {
            select: {
              company: {
                select: {
                  staff: {
                    select: { userId: true },
                  },
                },
              },
            },
            where: { role: { in: ["ADMIN_OWNER", "ADMIN_NONOWNER"] } },
          },
        },
      });

      // Collect all user IDs from owned companies and managed companies
      const ownedUserIds =
        userWithCompany?.ownedCompanies.flatMap((c) =>
          c.staff.map((s) => s.userId)
        ) || [];
      const managedUserIds =
        userWithCompany?.companyMemberships.flatMap((m) =>
          m.company.staff.map((s) => s.userId)
        ) || [];
      companyUserIds = [
        ...new Set([...ownedUserIds, ...managedUserIds, user.id]),
      ];
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Build where clause for company scoping
    const baseWhere =
      user.role === "ADMIN_OWNER" && companyUserIds.length > 0
        ? { userId: { in: companyUserIds } }
        : {};

    // Get failed attempts counts
    const [
      attemptsLastHour,
      attemptsLast24Hours,
      attemptsLast7Days,
      totalAttempts,
    ] = await Promise.all([
      db.failedLoginAttempt.count({
        where: { ...baseWhere, attemptedAt: { gte: oneHourAgo } },
      }),
      db.failedLoginAttempt.count({
        where: { ...baseWhere, attemptedAt: { gte: oneDayAgo } },
      }),
      db.failedLoginAttempt.count({
        where: { ...baseWhere, attemptedAt: { gte: sevenDaysAgo } },
      }),
      db.failedLoginAttempt.count({ where: baseWhere }),
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
        ...baseWhere,
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
        ...baseWhere,
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
