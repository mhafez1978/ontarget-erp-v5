import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Optional filter: lastHours (e.g., ?lastHours=24). If not provided, return all-time visitors.
    const lastHoursParam = searchParams.get("lastHours");
    const where: any = {};

    if (lastHoursParam) {
      const lastHours = parseInt(lastHoursParam, 10);
      if (!Number.isNaN(lastHours) && lastHours > 0) {
        const since = new Date();
        since.setHours(since.getHours() - lastHours);
        where.visitedAt = { gte: since };
      }
    }

    // Total count for the given filter (all-time if no lastHours)
    const totalCount = await db.visitorTracking.count({ where });

    const visitors = await db.visitorTracking.findMany({
      where,
      orderBy: {
        visitedAt: "desc",
      },
      take: limit + 1, // Fetch one extra to determine if there are more
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = visitors.length > limit;
    const items = hasMore ? visitors.slice(0, -1) : visitors;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      visitors: items,
      nextCursor,
      hasMore,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitors" },
      { status: 500 }
    );
  }
}
