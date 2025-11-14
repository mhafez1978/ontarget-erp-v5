import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled } = body;

    // Check if settings exist
    const existingSettings = await db.geoTrackingSetting.findFirst();

    let settings;
    if (existingSettings) {
      // Update existing settings
      settings = await db.geoTrackingSetting.update({
        where: { id: existingSettings.id },
        data: { enabled },
      });
    } else {
      // Create new settings
      settings = await db.geoTrackingSetting.create({
        data: { enabled },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating geo-tracking settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const settings = await db.geoTrackingSetting.findFirst();

    return NextResponse.json({
      enabled: settings?.enabled || false,
      settings,
    });
  } catch (error) {
    console.error("Error fetching geo-tracking settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
