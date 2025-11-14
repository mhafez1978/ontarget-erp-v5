import { NextResponse } from "next/server";

// GET /api/geocode/search?q=address&limit=5
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = searchParams.get("limit") || "5";

    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: "Query must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Proxy to Photon API (free, unlimited, OpenStreetMap-based)
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(
        query
      )}&limit=${limit}`,
      {
        headers: {
          "User-Agent": "OnTarget-ERP-App",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      features: data.features || [],
    });
  } catch (error) {
    console.error("Geocoding search error:", error);
    return NextResponse.json(
      { error: "Failed to search addresses" },
      { status: 500 }
    );
  }
}
