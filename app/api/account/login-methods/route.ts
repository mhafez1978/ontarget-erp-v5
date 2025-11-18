import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserLoginMethods, getUserLoginStats } from "@/lib/account-tracking";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = validation.user.id;

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
