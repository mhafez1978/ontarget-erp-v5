import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get visitors from the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const visitors = await db.visitorTracking.findMany({
      where: {
        visitedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        visitedAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({ visitors });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitors" },
      { status: 500 }
    );
  }
}
