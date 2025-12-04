import { NextRequest, NextResponse } from "next/server";

// Small in-memory TTL cache for recent lookups to reduce provider calls.
// Use globalThis to survive hot module reloads in development.
type CacheItem = { payload: any; expiresAt: number };
const CACHE_TTL_MS =
  Number(process.env.GET_LOCATION_CACHE_TTL_MS) || 5 * 60 * 1000; // 5m default

const CACHE_KEY = "__get_location_cache_v1" as const;
if (!(globalThis as any)[CACHE_KEY]) {
  (globalThis as any)[CACHE_KEY] = new Map<string, CacheItem>();
}
const globalCache: Map<string, CacheItem> = (globalThis as any)[CACHE_KEY];

function getCached(ipKey: string) {
  const entry = globalCache.get(ipKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    globalCache.delete(ipKey);
    return null;
  }
  return entry.payload;
}

function setCached(ipKey: string, payload: any) {
  globalCache.set(ipKey, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Test helper — clear cache (exported for unit tests)
export function __clearGetLocationCache() {
  globalCache.clear();
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP from headers (forwarded by proxy/load balancer)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");

    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2...)
    // The first one is the real client IP
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp;

    // Build the URL - if we have a client IP, query it specifically
    // Otherwise, ipapi.co will detect the server's IP
    const apiUrl = clientIp
      ? `https://ipapi.co/${clientIp}/json/`
      : "https://ipapi.co/json/";

    // Cache key - prefer client IP but fall back to server-level key
    const origin = request?.nextUrl?.origin || "unknown";
    const cacheKey = clientIp ? `ip:${clientIp}` : `server:${origin}`;

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      // Return cached payload directly
      return NextResponse.json(cached);
    }

    // Fetch from ipapi.co - this will return location for the specified IP
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "NextJS-App",
      },
    });

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

    const data = await response.json();

    // Determine if the IP is IPv4 or IPv6
    const isIPv6 = data.ip && data.ip.includes(":");
    // console.log(
    //   `Primary IP from ipapi.co: ${data.ip} (${isIPv6 ? "IPv6" : "IPv4"})`
    // );

    // Try to get IPv4 address as well if current is IPv6
    let ipv4 = isIPv6 ? null : data.ip;
    const ipv6 = isIPv6 ? data.ip : null;

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
    let fallbackData: any = null;
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
            fallbackData = altJson;
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
      ? countryCodeToFlag(data.country_code)
      : null;

    const payload = {
      ip: data.ip || "Unknown",
      ipv4: ipv4,
      ipv6: ipv6,
      city: data.city || null,
      region: data.region || null,
      country_name: data.country_name || null,
      country_code: data.country_code || null,
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
