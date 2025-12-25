import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
// Small in-memory TTL cache for recent lookups to reduce provider calls.
// Use globalThis to survive hot module reloads in development.
type CacheItem = { payload: unknown; expiresAt: number };
const CACHE_TTL_MS =
  Number(process.env.GET_LOCATION_CACHE_TTL_MS) || 5 * 60 * 1000; // 5m default

const CACHE_KEY = "__get_location_cache_v1" as const;
if (!(globalThis as unknown as Record<string, unknown>)[CACHE_KEY]) {
  (globalThis as unknown as Record<string, unknown>)[CACHE_KEY] = new Map<
    string,
    CacheItem
  >();
}
const globalCache: Map<string, CacheItem> = (
  globalThis as unknown as Record<string, unknown>
)[CACHE_KEY] as Map<string, CacheItem>;

function getCached(ipKey: string) {
  const entry = globalCache.get(ipKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    globalCache.delete(ipKey);
    return null;
  }
  return entry.payload;
}

function setCached(ipKey: string, payload: unknown) {
  globalCache.set(ipKey, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Test helper — clear cache (exported for unit tests)
export function __clearGetLocationCache() {
  globalCache.clear();
}

export async function GET(request: NextRequest) {
  try {
    // Get provider settings from database
    const settings = await db.geoTrackingSetting.findFirst();

    if (!settings || !settings.enabled) {
      return NextResponse.json(
        { error: "Geo tracking is disabled" },
        { status: 403 }
      );
    }

    // Get client IP from headers (forwarded by proxy/load balancer)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2...)
    // The first one is the real client IP
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp;

    // Cache key - prefer client IP but fall back to server-level key
    const origin = request?.nextUrl?.origin || "unknown";
    const cacheKey = clientIp ? `ip:${clientIp}` : `server:${origin}`;

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      // Return cached payload directly
      return NextResponse.json(cached);
    }

    // Build API URL based on provider
    let apiUrl: string;
    const headers: HeadersInit = {
      "User-Agent": "OnTarget-ERP",
    };

    switch (settings.provider) {
      case "IP_API":
        apiUrl = clientIp
          ? `http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query`
          : "http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,query";
        break;

      case "IPINFO":
        if (!settings.apiKey) {
          return NextResponse.json(
            { error: "IPinfo.io API key not configured" },
            { status: 500 }
          );
        }
        headers["Authorization"] = `Bearer ${settings.apiKey}`;
        apiUrl = clientIp
          ? `https://ipinfo.io/${clientIp}/json`
          : `https://ipinfo.io/json`;
        break;

      case "IPGEOLOCATION":
        if (!settings.apiKey) {
          return NextResponse.json(
            { error: "IP Geolocation API key not configured" },
            { status: 500 }
          );
        }
        apiUrl = clientIp
          ? `https://api.ipgeolocation.io/ipgeo?apiKey=${settings.apiKey}&ip=${clientIp}`
          : `https://api.ipgeolocation.io/ipgeo?apiKey=${settings.apiKey}`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid geo tracking provider" },
          { status: 500 }
        );
    }

    // Fetch from provider
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      // Rate limited or API error - try to at least return the client IP
      const fallbackIp = clientIp || "127.0.0.1";
      const isLocalhost =
        fallbackIp === "127.0.0.1" ||
        fallbackIp === "::1" ||
        fallbackIp?.startsWith("192.168.") ||
        fallbackIp?.startsWith("10.");

      return NextResponse.json(
        {
          error: "Rate limited or API unavailable",
          ip: fallbackIp,
          ipv4: fallbackIp && !fallbackIp.includes(":") ? fallbackIp : null,
          ipv6: fallbackIp && fallbackIp.includes(":") ? fallbackIp : null,
          city: isLocalhost ? "Localhost" : null,
          region: null,
          country_name: isLocalhost ? "Local Development" : null,
          country_code: null,
          flag: isLocalhost ? "🏠" : null,
        },
        { status: response.status }
      );
    }

    const apiData = await response.json();

    // Normalize response based on provider
    let data: Record<string, unknown>;

    switch (settings.provider) {
      case "IP_API":
        if (apiData.status === "fail") {
          return NextResponse.json(
            { error: apiData.message || "API request failed" },
            { status: 400 }
          );
        }
        data = {
          ip: apiData.query,
          ipv4: !apiData.query?.includes(":") ? apiData.query : null,
          ipv6: apiData.query?.includes(":") ? apiData.query : null,
          city: apiData.city,
          region: apiData.regionName || apiData.region,
          country_name: apiData.country,
          country_code: apiData.countryCode,
          latitude: apiData.lat,
          longitude: apiData.lon,
          timezone: apiData.timezone,
        };
        break;

      case "IPINFO":
        data = {
          ip: apiData.ip,
          ipv4: !apiData.ip?.includes(":") ? apiData.ip : null,
          ipv6: apiData.ip?.includes(":") ? apiData.ip : null,
          city: apiData.city,
          region: apiData.region,
          country_name: apiData.country,
          country_code: apiData.country,
          latitude: apiData.loc?.split(",")[0],
          longitude: apiData.loc?.split(",")[1],
          timezone: apiData.timezone,
        };
        break;

      case "IPGEOLOCATION":
        data = {
          ip: apiData.ip,
          ipv4: !apiData.ip?.includes(":") ? apiData.ip : null,
          ipv6: apiData.ip?.includes(":") ? apiData.ip : null,
          city: apiData.city,
          region: apiData.state_prov,
          country_name: apiData.country_name,
          country_code: apiData.country_code2,
          latitude: apiData.latitude,
          longitude: apiData.longitude,
          timezone: apiData.time_zone?.name,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid provider" },
          { status: 500 }
        );
    }

    // Determine if the IP is IPv4 or IPv6
    const ipString = String(data.ip || "");
    const isIPv6 = ipString.includes(":");
    // console.log(
    //   `Primary IP from ipapi.co: ${data.ip} (${isIPv6 ? "IPv6" : "IPv4"})`
    // );

    // Try to get IPv4 address as well if current is IPv6
    let ipv4 = isIPv6 ? null : ipString;
    const ipv6 = isIPv6 ? ipString : null;

    // If we got IPv6, try to also fetch IPv4 from multiple services
    if (isIPv6 && ipv4 === null) {
      // Try multiple IPv4 detection services in order
      const ipv4Services = [
        "https://api.ipify.org?format=json",
        "https://api64.ipify.org?format=json",
        "https://ipv4.icanhazip.com",
      ];

      for (const serviceUrl of ipv4Services) {
        try {
          const ipv4Response = await fetch(serviceUrl, {
            headers: {
              "User-Agent": "NextJS-App",
            },
            signal: AbortSignal.timeout(3000), // 3 second timeout
          });

          if (ipv4Response.ok) {
            let possibleIPv4: string | null = null;

            // Different services return different formats
            if (serviceUrl.includes("ipify")) {
              const ipv4Data = await ipv4Response.json();
              possibleIPv4 = ipv4Data.ip;
            } else {
              possibleIPv4 = (await ipv4Response.text()).trim();
            }

            // Only use it if it's actually IPv4 (doesn't contain ':')
            if (possibleIPv4 && !possibleIPv4.includes(":")) {
              ipv4 = possibleIPv4;
              //console.log(`IPv4 detected from ${serviceUrl}: ${ipv4}`);
              break; // Found IPv4, stop trying other services
            }
          }
        } catch (error) {
          console.log(`Could not fetch IPv4 from ${serviceUrl}:`, error);
          // Continue to next service
        }
      }

      if (!ipv4) {
        console.log(
          "No IPv4 address available - you may be on an IPv6-only network"
        );
      }
    }

    // If ipapi returned minimal data (no city/country), try a lightweight fallback
    // provider to improve location accuracy (e.g. ipwho.is). Keep this tolerant
    // — don't fail if the secondary provider is down.
    // variable previously used for debugging; no longer required
    if ((!data.city || !data.country_name) && data.ip) {
      try {
        const altResp = await fetch(`https://ipwho.is/${data.ip}`, {
          headers: { "User-Agent": "NextJS-App" },
          signal: AbortSignal.timeout(3000),
        });

        if (altResp.ok) {
          const altJson = await altResp.json();
          // ipwho.is uses different field names but provides city/region/country
          if (altJson && altJson.success !== false) {
            // normalize fields onto `data` so later code can use them uniformly
            data.city = data.city || altJson.city || null;
            data.region = data.region || altJson.region || null;
            data.country_name = data.country_name || altJson.country || null;
            data.country_code =
              data.country_code || altJson.country_code || null;
            data.latitude = data.latitude || altJson.latitude || null;
            data.longitude = data.longitude || altJson.longitude || null;
          }
        }
      } catch (err) {
        // Best-effort only — leave original data as-is on any error
        console.debug("ipwho.is fallback failed:", err);
      }
    }

    // Convert country code to flag emoji
    const flag = data.country_code
      ? countryCodeToFlag(String(data.country_code))
      : null;

    const payload = {
      ip: String(data.ip || "Unknown"),
      ipv4: ipv4,
      ipv6: ipv6,
      city: data.city ? String(data.city) : null,
      region: data.region ? String(data.region) : null,
      country_name: data.country_name ? String(data.country_name) : null,
      country_code: data.country_code ? String(data.country_code) : null,
      flag,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };

    // Store successful lookup in cache (best-effort)
    try {
      setCached(cacheKey, payload);
    } catch (err) {
      console.debug("Failed to set geo cache:", err);
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Geo-location API error:", error);

    // Get client IP from headers for fallback
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const fallbackIp =
      forwardedFor?.split(",")[0]?.trim() || realIp || "127.0.0.1";
    const isLocalhost =
      fallbackIp === "127.0.0.1" ||
      fallbackIp === "::1" ||
      fallbackIp?.startsWith("192.168.") ||
      fallbackIp?.startsWith("10.");

    // Return fallback with client IP
    return NextResponse.json({
      ip: fallbackIp,
      ipv4: fallbackIp && !fallbackIp.includes(":") ? fallbackIp : null,
      ipv6: fallbackIp && fallbackIp.includes(":") ? fallbackIp : null,
      city: isLocalhost ? "Localhost" : null,
      region: null,
      country_name: isLocalhost ? "Local Development" : null,
      country_code: null,
      flag: isLocalhost ? "🏠" : null,
    });
  }
}

function countryCodeToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";

  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
