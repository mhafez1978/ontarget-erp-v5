import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Get visitors from the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const where = {
      visitedAt: {
        gte: twentyFourHoursAgo,
      },
    };

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
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitors" },
      { status: 500 }
    );
  }
}
