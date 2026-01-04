import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }
    const userId = validation.user.id;

    const companyId = request.nextUrl.searchParams.get("companyId");
    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    // Get the most recent active website for this company
    const website = await db.v4Website.findFirst({
      where: {
        companyId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!website) {
      return NextResponse.json({ website: null });
    }

    return NextResponse.json({
      website: {
        id: website.id,
        data: website.websiteData,
        preferences: website.preferences,
        qualityScore: website.qualityScore,
        creativityScore: website.creativityScore,
        isActive: website.isActive,
        createdAt: website.createdAt,
      },
    });
  } catch (error) {
    console.error("[V4 Websites GET] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch website",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
