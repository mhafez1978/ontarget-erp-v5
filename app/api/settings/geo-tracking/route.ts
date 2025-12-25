import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);

    if (!validation.valid || validation.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.geoTrackingSetting.findFirst();

    return NextResponse.json({
      enabled: settings?.enabled || false,
      provider: settings?.provider || "IP_API",
      apiKey: settings?.apiKey ? "••••••••" : "", // Mask API key
    });
  } catch (error) {
    console.error("Error fetching geo tracking settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);

    if (!validation.valid || validation.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, provider, apiKey } = body;

    // Validate provider
    const validProviders = ["IP_API", "IPINFO", "IPGEOLOCATION"];
    if (provider && !validProviders.includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // Check if settings exist
    const existing = await db.geoTrackingSetting.findFirst();

    if (existing) {
      // Update existing settings
      await db.geoTrackingSetting.update({
        where: { id: existing.id },
        data: {
          enabled: enabled !== undefined ? enabled : existing.enabled,
          provider: provider || existing.provider,
          apiKey: apiKey !== undefined ? apiKey || null : existing.apiKey,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new settings
      await db.geoTrackingSetting.create({
        data: {
          enabled: enabled ?? false,
          provider: provider || "IP_API",
          apiKey: apiKey || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving geo tracking settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
