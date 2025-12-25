import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);

    if (!validation.valid || validation.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey } = body;

    let testUrl: string;
    const headers: HeadersInit = {
      "User-Agent": "OnTarget-ERP",
    };

    // Build test URL based on provider
    switch (provider) {
      case "IP_API":
        testUrl =
          "http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query";
        break;

      case "IPINFO":
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key required for IPinfo.io" },
            { status: 400 }
          );
        }
        headers["Authorization"] = `Bearer ${apiKey}`;
        testUrl = `https://ipinfo.io/json`;
        break;

      case "IPGEOLOCATION":
        if (!apiKey) {
          return NextResponse.json(
            { error: "API key required for IP Geolocation" },
            { status: 400 }
          );
        }
        testUrl = `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid provider" },
          { status: 400 }
        );
    }

    // Test the connection
    const response = await fetch(testUrl, { headers });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Normalize response based on provider
    let normalizedData: {
      city: string;
      region: string;
      country: string;
      ip: string;
    };

    switch (provider) {
      case "IP_API":
        if (data.status === "fail") {
          return NextResponse.json(
            { error: data.message || "API request failed" },
            { status: 400 }
          );
        }
        normalizedData = {
          city: data.city || "Unknown",
          region: data.regionName || data.region || "Unknown",
          country: data.country || "Unknown",
          ip: data.query || "Unknown",
        };
        break;

      case "IPINFO":
        normalizedData = {
          city: data.city || "Unknown",
          region: data.region || "Unknown",
          country: data.country || "Unknown",
          ip: data.ip || "Unknown",
        };
        break;

      case "IPGEOLOCATION":
        normalizedData = {
          city: data.city || "Unknown",
          region: data.state_prov || "Unknown",
          country: data.country_name || "Unknown",
          ip: data.ip || "Unknown",
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid provider" },
          { status: 400 }
        );
    }

    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error("Error testing geo tracking connection:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 500 }
    );
  }
}
