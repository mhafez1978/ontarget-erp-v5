import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get user ID from cookie (temporary solution until NextAuth is set up)
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user,
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
