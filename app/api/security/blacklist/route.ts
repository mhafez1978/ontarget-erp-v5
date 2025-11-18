import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { createAuditLog } from "@/lib/audit-log";
import { validateSession } from "@/lib/session-manager";

// GET - List IP blacklist (Super Admin only)
export async function GET(request: NextRequest) {
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

    // Check if user is Super Admin
    if (validation.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status"); // active, expired, permanent

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status === "active") {
      where.blockedUntil = { gte: new Date() };
      where.isPermanent = false;
    } else if (status === "expired") {
      where.blockedUntil = { lt: new Date() };
      where.isPermanent = false;
    } else if (status === "permanent") {
      where.isPermanent = true;
    }

    // Fetch blacklist with pagination
    const [blacklist, total] = await Promise.all([
      db.ipBlacklist.findMany({
        where,
        include: {
          blockedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { blockedAt: "desc" },
        skip,
        take: limit,
      }),
      db.ipBlacklist.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      blacklist,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blacklist:", error);
    return NextResponse.json(
      { error: "Failed to fetch blacklist" },
      { status: 500 }
    );
  }
}

// POST - Manually block an IP (Super Admin only)
export async function POST(request: NextRequest) {
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
    const user = validation.user;

    // Check if user is Super Admin
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ipAddress, reason, isPermanent, geoData } = body;

    if (!ipAddress || !reason) {
      return NextResponse.json(
        { error: "IP address and reason are required" },
        { status: 400 }
      );
    }

    // Check if IP is already blacklisted
    const existing = await db.ipBlacklist.findUnique({
      where: { ipAddress },
    });

    if (existing) {
      return NextResponse.json(
        { error: "IP is already blacklisted" },
        { status: 409 }
      );
    }

    // Create blacklist entry
    const blockedUntil = isPermanent
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year (permanent)
      : new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const blacklistEntry = await db.ipBlacklist.create({
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
        reason,
        failedAttempts: 0,
        blockedUntil,
        blockedById: userId,
        isAutoBlocked: false,
        isPermanent: isPermanent || false,
      },
    });

    // Log audit event
    await createAuditLog({
      userId,
      action: "IP_MANUALLY_BLOCKED",
      description: `IP ${ipAddress} manually blocked by ${user.name}. Reason: ${reason}`,
      ipAddress,
      city: geoData?.city || null,
      state: geoData?.region || null,
      country: geoData?.country_name || null,
      countryFlag: geoData?.flag || null,
      metadata: {
        reason,
        isPermanent: isPermanent || false,
        blockedBy: user.name,
      },
    });

    return NextResponse.json({
      success: true,
      blacklistEntry,
      message: `IP ${ipAddress} has been blocked`,
    });
  } catch (error) {
    console.error("Error blocking IP:", error);
    return NextResponse.json({ error: "Failed to block IP" }, { status: 500 });
  }
}
