import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    // Get session token from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;
    const userId = cookieStore.get("userId")?.value;

    console.log(
      "[/api/auth/me] Checking auth - sessionToken:",
      sessionToken ? "EXISTS" : "MISSING",
      "userId:",
      userId ? "EXISTS" : "MISSING"
    );

    if (!sessionToken) {
      console.log("[/api/auth/me] No session token found");
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    console.log(
      "[/api/auth/me] Session validation result:",
      validation.valid ? "VALID" : "INVALID",
      "reason:",
      validation.reason || "N/A"
    );

    if (!validation.valid || !validation.user) {
      console.log("[/api/auth/me] Session invalid or no user");
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    console.log(
      "[/api/auth/me] User authenticated:",
      validation.user.email,
      "role:",
      validation.user.role
    );

    return NextResponse.json({
      user: validation.user,
      authenticated: true,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Failed to get current user" },
      { status: 500 }
    );
  }
}
