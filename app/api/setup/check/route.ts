import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check if any SUPER_ADMIN exists
    const superAdmin = await db.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
      },
    });

    return NextResponse.json({
      hasSetup: !!superAdmin,
      needsSetup: !superAdmin,
    });
  } catch (error) {
    console.error("Error checking setup status:", error);
    return NextResponse.json(
      { error: "Failed to check setup status" },
      { status: 500 }
    );
  }
}
