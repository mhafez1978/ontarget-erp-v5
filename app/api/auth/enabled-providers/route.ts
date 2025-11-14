import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get only enabled providers with minimal info for public consumption
    const enabledProviders = await db.oAuthProviderSetting.findMany({
      where: { enabled: true },
      select: {
        provider: true,
        enabled: true,
      },
    });

    return NextResponse.json({ providers: enabledProviders });
  } catch (error) {
    console.error("Error fetching enabled OAuth providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch enabled OAuth providers" },
      { status: 500 }
    );
  }
}
