import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/auth/onboarding-info?token=xxx
// Fetches onboarding data for a given token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find the onboarding record
    const onboarding = await db.oAuthOnboarding.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!onboarding) {
      return NextResponse.json(
        { error: "Onboarding token not found" },
        { status: 404 }
      );
    }

    if (onboarding.isUsed) {
      return NextResponse.json(
        { error: "Onboarding already completed" },
        { status: 400 }
      );
    }

    if (new Date() > onboarding.expiresAt) {
      return NextResponse.json(
        { error: "Onboarding token expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      email: onboarding.user.email,
      name: onboarding.user.name || "",
      userId: onboarding.user.id,
    });
  } catch (error) {
    console.error("[Onboarding Info] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding information" },
      { status: 500 }
    );
  }
}
