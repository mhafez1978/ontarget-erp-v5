import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Get attack origin coordinates for map visualization (Super Admin only)
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

    // Get last 7 days of failed attempts with coordinates
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get unique attack origins with coordinates
    const attackOrigins = await db.failedLoginAttempt.findMany({
      where: {
        attemptedAt: { gte: sevenDaysAgo },
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        ipAddress: true,
        latitude: true,
        longitude: true,
        city: true,
        state: true,
        country: true,
        countryFlag: true,
      },
      distinct: ["ipAddress"],
    });

    // Count attempts per IP
    const ipCounts = await db.failedLoginAttempt.groupBy({
      by: ["ipAddress"],
      where: {
        attemptedAt: { gte: sevenDaysAgo },
      },
      _count: {
        id: true,
      },
    });

    // Create a map of IP to attempt count
    const countMap = new Map(
      ipCounts.map((item) => [item.ipAddress, item._count.id])
    );

    // Combine data
    const markers = attackOrigins.map((origin) => ({
      location: [origin.latitude as number, origin.longitude as number],
      size: Math.min((countMap.get(origin.ipAddress) || 1) * 0.02, 0.15), // Scale marker size based on attempts
      ipAddress: origin.ipAddress,
      city: origin.city,
      state: origin.state,
      country: origin.country,
      countryFlag: origin.countryFlag,
      attempts: countMap.get(origin.ipAddress) || 1,
    }));

    return NextResponse.json({
      success: true,
      markers,
      total: markers.length,
    });
  } catch (error) {
    console.error("Error fetching attack origins:", error);
    return NextResponse.json(
      { error: "Failed to fetch attack origins" },
      { status: 500 }
    );
  }
}
