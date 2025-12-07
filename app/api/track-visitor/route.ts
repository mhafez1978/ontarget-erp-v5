import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      ipAddress,
      ipv4,
      ipv6,
      city,
      state,
      country,
      countryFlag,
      userAgent,
      referrer,
      landingPage,
    } = body;

    // Check if geo-tracking is enabled
    const settings = await db.geoTrackingSetting.findFirst();

    if (!settings?.enabled) {
      console.log("Geo-tracking is disabled in settings:", settings);
      return NextResponse.json(
        { message: "Geo-tracking is disabled" },
        { status: 403 }
      );
    }

    // Store visitor tracking data
    const visitor = await db.visitorTracking.create({
      data: {
        ipAddress: ipAddress || "Unknown",
        ipv4: ipv4 || null,
        ipv6: ipv6 || null,
        city,
        state,
        country,
        countryFlag,
        userAgent,
        referrer,
        landingPage,
      },
    });

    // If the visitor is an authenticated user, update their active session geo
    const sessionToken = request.cookies.get("sessionToken")?.value;
    if (sessionToken) {
      try {
        await db.session.update({
          where: { sessionToken },
          data: {
            sessionIpAddress: ipAddress || ipv4 || ipv6 || null,
            sessionIpv4: ipv4 || null,
            sessionIpv6: ipv6 || null,
            sessionCity: city || null,
            sessionState: state || null,
            sessionCountry: country || null,
            sessionCountryFlag: countryFlag || null,
          },
        });
      } catch (error) {
        console.error("Failed to update session geo info from visitor tracking:", error);
      }
    }

    return NextResponse.json({ success: true, visitor });
  } catch (error) {
    console.error("Error tracking visitor:", error);
    return NextResponse.json(
      { error: "Failed to track visitor" },
      { status: 500 }
    );
  }
}
