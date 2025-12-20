import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Revalidate cache every 60 seconds
export const revalidate = 60;

// Type definition for globe markers
type GlobeMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  size: number;
  color?: string; // Hex color string (e.g., "#ff0000")
  isRoot?: boolean;
  companyId: string;
};

export async function GET() {
  try {
    const markers: GlobeMarker[] = [];

    // Add all root company locations as red markers
    const root = await db.company.findFirst({
      where: { isRoot: true },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        locations: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (root) {
      // Add markers for all root company locations
      if (root.locations && root.locations.length > 0) {
        root.locations.forEach((loc) => {
          if (
            typeof loc.latitude === "number" &&
            typeof loc.longitude === "number"
          ) {
            markers.push({
              id: `${root.id}-${loc.id}`,
              name: `${root.name} - ${loc.name}`,
              latitude: loc.latitude,
              longitude: loc.longitude,
              size: 0.12,
              color: "#ff0000", // Red for root company
              isRoot: true,
              companyId: root.id,
            });
          }
        });
      } else if (
        typeof root.latitude === "number" &&
        typeof root.longitude === "number"
      ) {
        // Fallback: use company-level coordinates if no locations exist
        markers.push({
          id: root.id,
          name: root.name,
          latitude: root.latitude,
          longitude: root.longitude,
          size: 0.12,
          color: "#ff0000",
          isRoot: true,
          companyId: root.id,
        });
      }
    }

    // Add markers for all subscriber company locations
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
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
      take: 1000,
    });

    subs.forEach((s) => {
      const c = s.subscriberCompany;
      if (!c) return;

      // Skip root company (already added above)
      if (c.id === root?.id) return;

      // Add markers for all subscriber locations
      if (c.locations && c.locations.length > 0) {
        c.locations.forEach((loc) => {
          if (
            typeof loc.latitude === "number" &&
            typeof loc.longitude === "number"
          ) {
            markers.push({
              id: `${c.id}-${loc.id}`,
              name: `${c.name} - ${loc.name}`,
              latitude: loc.latitude,
              longitude: loc.longitude,
              size: 0.06,
              color:
                (c.storeMetadata as { markerColor?: string } | null)
                  ?.markerColor ?? undefined,
              companyId: c.id,
            });
          }
        });
      } else if (
        typeof c.latitude === "number" &&
        typeof c.longitude === "number"
      ) {
        // Fallback: use company-level coordinates if no locations exist
        markers.push({
          id: c.id,
          name: c.name,
          latitude: c.latitude,
          longitude: c.longitude,
          size: 0.06,
          color:
            (c.storeMetadata as { markerColor?: string } | null)?.markerColor ??
            undefined,
          companyId: c.id,
        });
      }
    });

    return NextResponse.json(markers);
  } catch (err) {
    console.error("/api/globe/markers error:", err);
    return NextResponse.json([], {
      status: 500,
      statusText: "Internal Server Error",
    });
  }
}
