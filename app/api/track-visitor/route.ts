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
        // Use updateMany instead of update so we don't get a P2025 error when
        // the session does not exist. updateMany returns { count } and will
        // simply update 0 rows if no match is found — we can log that fact for
        // debugging without causing an exception.
        const result = await db.session.updateMany({
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

        if (result.count === 0) {
          // Not an error — it's expected in some flows: the cookie existed but
          // the DB session row was already removed/expired. Keep this at debug
          // level to avoid alarm while still giving developers visibility.
          console.debug(
            "No session row found for token when updating geo (sessionToken)"
          );
        }
      } catch (error) {
        console.error(
          "Failed to update session geo info from visitor tracking:",
          error
        );
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
