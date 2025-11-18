import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit-log";

// GET - List failed login attempts (Super Admin only)
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const email = searchParams.get("email");
    const ipAddress = searchParams.get("ipAddress");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (email) {
      where.email = { contains: email };
    }
    if (ipAddress) {
      where.ipAddress = { contains: ipAddress };
    }
    if (startDate || endDate) {
      where.attemptedAt = {};
      if (startDate) {
        where.attemptedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.attemptedAt.lte = new Date(endDate);
      }
    }

    // Fetch attempts with pagination
    const [attempts, total] = await Promise.all([
      db.failedLoginAttempt.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { attemptedAt: "desc" },
        skip,
        take: limit,
      }),
      db.failedLoginAttempt.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      attempts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching failed attempts:", error);
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}

// POST - Log a failed login attempt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, ipAddress, geoData, userAgent } = body;

    if (!email || !ipAddress) {
      return NextResponse.json(
        { error: "Email and IP address are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Log the failed attempt
    const attempt = await db.failedLoginAttempt.create({
      data: {
        email,
        ipAddress,
        ipv4: geoData?.ipv4 || null,
        ipv6: geoData?.ipv6 || null,
        city: geoData?.city || null,
        state: geoData?.region || null,
        country: geoData?.country_name || null,
        countryCode: geoData?.country_code || null,
        countryFlag: geoData?.flag || null,
        latitude: geoData?.latitude || null,
        longitude: geoData?.longitude || null,
        timezone: geoData?.timezone || null,
        userAgent: userAgent || null,
        userId: user?.id || null,
      },
    });

    // Check how many failed attempts from this IP in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAttempts = await db.failedLoginAttempt.count({
      where: {
        ipAddress,
        attemptedAt: {
          gte: oneHourAgo,
        },
      },
    });

    // If 6 or more attempts, block the IP
    let blocked = false;
    if (recentAttempts >= 6) {
      // Check if already blacklisted
      const existing = await db.ipBlacklist.findUnique({
        where: { ipAddress },
      });

      if (!existing) {
        // Create blacklist entry (1 hour block)
        const blockedUntil = new Date(Date.now() + 60 * 60 * 1000);
        await db.ipBlacklist.create({
          data: {
            ipAddress,
            ipv4: geoData?.ipv4 || null,
            ipv6: geoData?.ipv6 || null,
            city: geoData?.city || null,
            state: geoData?.region || null,
            country: geoData?.country_name || null,
            countryCode: geoData?.country_code || null,
            countryFlag: geoData?.flag || null,
            latitude: geoData?.latitude || null,
            longitude: geoData?.longitude || null,
            reason: "Brute force attack - 6+ failed login attempts",
            failedAttempts: recentAttempts,
            blockedUntil,
            isAutoBlocked: true,
          },
        });

        blocked = true;

        // Log audit event
        await createAuditLog({
          userId: user?.id || null,
          action: "IP_AUTO_BLOCKED",
          description: `IP ${ipAddress} automatically blocked after ${recentAttempts} failed login attempts`,
          ipAddress,
          city: geoData?.city || null,
          state: geoData?.region || null,
          country: geoData?.country_name || null,
          countryFlag: geoData?.flag || null,
          metadata: {
            email,
            attempts: recentAttempts,
            location: geoData
              ? `${geoData.city}, ${geoData.region}, ${geoData.country_name}`
              : "Unknown",
          },
        });
      }
    }

    // Log the failed attempt to audit
    await createAuditLog({
      userId: user?.id || null,
      action: "FAILED_LOGIN_ATTEMPT",
      description: `Failed login attempt for ${email} from ${ipAddress}`,
      ipAddress,
      city: geoData?.city || null,
      state: geoData?.region || null,
      country: geoData?.country_name || null,
      countryFlag: geoData?.flag || null,
      metadata: {
        email,
        attempts: recentAttempts,
        location: geoData
          ? `${geoData.city}, ${geoData.region}, ${geoData.country_name}`
          : "Unknown",
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      recentAttempts,
      blocked,
      message: blocked
        ? `IP blocked after ${recentAttempts} failed attempts`
        : "Failed attempt logged",
    });
  } catch (error) {
    console.error("Error logging failed attempt:", error);
    return NextResponse.json(
      { error: "Failed to log attempt" },
      { status: 500 }
    );
  }
}
