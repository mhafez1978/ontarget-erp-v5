import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Find active subscriptions and include subscriber company location data
    const subs = await db.subscription.findMany({
      where: { status: "ACTIVE" },
      include: {
        subscriberCompany: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            locations: {
              where: { isMain: true },
              select: { latitude: true, longitude: true },
              take: 1,
            },
          },
        },
      },
      take: 1000, // limit to avoid huge responses
    });

    const markers = subs
      .map((s) => {
        const c = s.subscriberCompany;
        if (!c) return null;
        const loc =
          c.locations && c.locations.length > 0 ? c.locations[0] : null;
        const lat = loc?.latitude ?? c.latitude;
        const lng = loc?.longitude ?? c.longitude;
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        return {
          id: c.id,
          name: c.name,
          latitude: lat,
          longitude: lng,
          size: 0.06,
        };
      })
      .filter(Boolean);

    return NextResponse.json(markers);
  } catch (err) {
    console.error("/api/globe/markers error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
