import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Revalidate cache every 60 seconds for faster updates
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

    // Fetch all companies with their locations and store metadata
    const companies = await db.company.findMany({
      select: {
        id: true,
        name: true,
        isRoot: true,
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
    });

    // Process each company and add markers for locations
    companies.forEach((company) => {
      const isRoot = company.isRoot;
      const size = 0.03; // Smaller, consistent marker size
      // Root company locations = purple (#9333ea), Subscriber locations = green (#10b981)
      const defaultColor = isRoot ? "#9333ea" : "#10b981";
      const customColor =
        (company.storeMetadata as { markerColor?: string } | null)
          ?.markerColor ?? undefined;
      const color = customColor || defaultColor;

      // Add markers for all locations
      if (company.locations && company.locations.length > 0) {
        company.locations.forEach((loc) => {
          if (
            typeof loc.latitude === "number" &&
            typeof loc.longitude === "number"
          ) {
            markers.push({
              id: `${company.id}-${loc.id}`,
              name: `${company.name} - ${loc.name}`,
              latitude: loc.latitude,
              longitude: loc.longitude,
              size,
              color,
              isRoot,
              companyId: company.id,
            });
          }
        });
      } else if (
        typeof company.latitude === "number" &&
        typeof company.longitude === "number"
      ) {
        // Fallback: use company-level coordinates if no locations exist
        markers.push({
          id: company.id,
          name: company.name,
          latitude: company.latitude,
          longitude: company.longitude,
          size,
          color,
          isRoot,
          companyId: company.id,
        });
      }
    });

    console.log(
      `[Globe Markers] Generated ${markers.length} markers from ${companies.length} companies`
    );
    companies.forEach((c) => {
      console.log(
        `  - ${c.name} (${c.isRoot ? "ROOT" : "SUB"}): ${
          c.locations.length
        } locations, coords: ${c.latitude},${c.longitude}`
      );
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
