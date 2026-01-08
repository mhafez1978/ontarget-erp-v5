import { NextRequest, NextResponse } from "next/server";
import { getUserLoginMethods, getUserLoginStats } from "@/lib/account-tracking";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;
    const userId = sessionUser.id;

    // Get user info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        authMethod: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get login methods
    const loginMethods = await getUserLoginMethods(userId);

    // Get login statistics
    const stats = await getUserLoginStats(userId);

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name,
        authMethod: user.authMethod,
      },
      loginMethods,
      stats,
    });
  } catch (error) {
    console.error("[Account Info Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch account info" },
      { status: 500 }
    );
  }
}
