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
            storeMetadata: true,
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

    // Map subscriber companies to markers
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
          // Allow company to override marker color via storeMetadata.markerColor (hex string), otherwise undefined
          color:
            (c.storeMetadata as { markerColor?: string } | null)?.markerColor ??
            undefined,
        };
      })
      .filter(Boolean);

    // Also add the root company as a prominent red marker if coordinates are available
    const root = await db.company.findFirst({
      where: { isRoot: true },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        storeMetadata: true,
        locations: {
          where: { isMain: true },
          select: { latitude: true, longitude: true },
          take: 1,
        },
      },
    });

    if (root) {
      const rootLoc =
        root.locations && root.locations.length > 0 ? root.locations[0] : null;
      const rootLat = rootLoc?.latitude ?? root.latitude;
      const rootLng = rootLoc?.longitude ?? root.longitude;
      if (typeof rootLat === "number" && typeof rootLng === "number") {
        const rootMarker = {
          id: root.id,
          name: root.name,
          latitude: rootLat,
          longitude: rootLng,
          size: 0.12,
          color:
            (root.storeMetadata as { markerColor?: string } | null)
              ?.markerColor ?? "#ff0000",
          isRoot: true,
        };

        // Put root marker first so client can pick its color as globe markerColor
        markers.unshift(rootMarker as any);
      }
    }

    return NextResponse.json(markers);
  } catch (err) {
    console.error("/api/globe/markers error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
