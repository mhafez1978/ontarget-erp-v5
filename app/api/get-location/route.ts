import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countryCodeToFlag } from "@/lib/ip-lookup";
import { normalize, type NormalizedGeo } from "@/lib/geo/normalize";
import type { Prisma } from "@/generated/prisma/client";
import Decimal from "decimal.js";
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
  console.log("====== GET LOCATION API CALLED ======");
  try {
    // Get provider settings from database
    const settings = await db.geoTrackingSetting.findFirst();
    console.log("GET LOCATION - Settings:", JSON.stringify(settings, null, 2));

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
    let clientIp = forwardedFor?.split(",")[0]?.trim() || realIp;

    // Allow ip override via query param (useful for local dev or explicit lookups)
    const ipOverride = request.nextUrl.searchParams.get("ip");
    if (ipOverride) {
      clientIp = ipOverride;
      console.log("[Get Location] Using ip override:", clientIp);
    }

    // Only attempt a public IP fallback if we have no client IP at all.
    // If a client IP is present (even if it's a private/local address such as
    // 127.0.0.1), prefer to call the configured provider and surface any
    // provider-level errors (e.g. "private range").
    if (!clientIp) {
      console.log(
        `[Get Location] No client IP provided, attempting public IP fallback`
      );
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json", {
          signal: AbortSignal.timeout(3000),
        });
        if (ipRes.ok) {
          const ipJson = await ipRes.json();
          if (ipJson?.ip) {
            clientIp = String(ipJson.ip);
            console.log(
              "[Get Location] Fetched public IP from ipify:",
              clientIp
            );
          }
        }
      } catch (err) {
        console.debug("[Get Location] Public IP fallback failed:", err);
      }

      // If still missing after attempting fallback, return mock data
      if (!clientIp) {
        console.log(
          `[Get Location] Returning mock data for missing client IP (unknown)`
        );
        const mockData = {
          ip: "127.0.0.1",
          ipv4: "127.0.0.1",
          ipv6: null,
          city: "Localhost",
          region: null,
          country_name: "Local Development",
          country_code: "LOCAL",
          flag: "🏠",
          latitude: null,
          longitude: null,
          timezone: null,
        };
        return NextResponse.json(mockData);
      }
    }

    // Cache key - prefer client IP but fall back to server-level key
    const origin = request?.nextUrl?.origin || "unknown";
    const cacheKey = clientIp ? `ip:${clientIp}` : `server:${origin}`;

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[Get Location] Returning CACHED response for ${cacheKey}`);
      // Return cached payload directly
      return NextResponse.json(cached);
    }

    console.log(`[Get Location] NO CACHE for ${cacheKey}, fetching fresh data`);

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
    console.log(`[Get Location] Fetching from ${settings.provider}:`, apiUrl);
    console.log(`[Get Location] Headers:`, headers);
    const response = await fetch(apiUrl, { headers });

    console.log(`[Get Location] Response status:`, response.status);
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

    const apiData: unknown = await response.json();
    console.log(
      `[Get Location] Raw API response:`,
      JSON.stringify(apiData, null, 2)
    );

    // Normalize response using the shared helper
    // Keep provider-specific behavior where necessary (e.g. IP_API status failure)
    if (
      settings.provider === "IP_API" &&
      apiData &&
      typeof apiData === "object" &&
      (apiData as Record<string, unknown>).status === "fail"
    ) {
      const msg = (apiData as Record<string, unknown>).message;
      return NextResponse.json(
        { error: msg ? String(msg) : "API request failed" },
        { status: 400 }
      );
    }

    // Use normalization helper for a consistent shape
    // `normalize` handles provider heuristics and maps fields to a common shape
    // TODO: expand provider-specific handling if new providers are added
    const normalized: NormalizedGeo = normalize(
      settings.provider || "",
      apiData
    );
    const data = normalized; // use normalized directly

    console.log(
      `[Get Location] Normalized data:`,
      JSON.stringify(data, null, 2)
    );

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

    // Persist an enriched GeoLocationRecord (best-effort; failures should not block the response)
    try {
      // Small helpers to safely extract fields from the unknown `apiData` or dns objects
      const getString = (obj: unknown, key: string): string | null => {
        if (!obj || typeof obj !== "object") return null;
        const v = (obj as Record<string, unknown>)[key];
        if (typeof v === "string") return v;
        if (typeof v === "number") return String(v);
        return null;
      };

      const dnsObj =
        apiData &&
        typeof apiData === "object" &&
        (apiData as Record<string, unknown>).dns &&
        typeof (apiData as Record<string, unknown>).dns === "object"
          ? ((apiData as Record<string, unknown>).dns as Record<
              string,
              unknown
            >)
          : undefined;

      const continent =
        getString(apiData, "continent") || getString(apiData, "continent_name");
      const continentCode =
        getString(apiData, "continentCode") ||
        getString(apiData, "continent_code");
      const dnsGeo = dnsObj ? getString(dnsObj, "geo") : null;
      const dnsIp = dnsObj ? getString(dnsObj, "ip") : null;

      const latVal = normalized.latitude ?? null;
      const longVal = normalized.longitude ?? null;

      const latDecimal =
        latVal != null && !Number.isNaN(Number(latVal))
          ? new Decimal(String(latVal))
          : null;
      const longDecimal =
        longVal != null && !Number.isNaN(Number(longVal))
          ? new Decimal(String(longVal))
          : null;

      const createData: Prisma.GeoLocationRecordCreateInput = {
        ip: String(payload.ip || ""),
        ipv4: payload.ipv4 ?? null,
        ipv6: payload.ipv6 ?? null,
        provider: settings.provider,
        providerRaw: apiData as Prisma.InputJsonValue,

        city: payload.city ?? null,
        region: payload.region ?? null,
        regionName: normalized.regionName
          ? String(normalized.regionName)
          : null,
        district: normalized.district ? String(normalized.district) : null,
        zip: normalized.zip ? String(normalized.zip) : null,

        countryName: payload.country_name ?? null,
        countryCode: payload.country_code ?? null,
        continent: continent ?? null,
        continentCode: continentCode ?? null,

        isp: normalized.isp ? String(normalized.isp) : null,
        org: normalized.org ? String(normalized.org) : null,
        as: normalized.as ? String(normalized.as) : null,
        asName: normalized.asname ? String(normalized.asname) : null,

        mobile:
          typeof normalized.mobile === "boolean" ? normalized.mobile : null,
        proxy: typeof normalized.proxy === "boolean" ? normalized.proxy : null,
        hosting:
          typeof normalized.hosting === "boolean" ? normalized.hosting : null,
        dnsGeo: dnsGeo ?? null,
        dnsIp: dnsIp ?? null,

        latitude: latDecimal,
        longitude: longDecimal,
        timezone: normalized.timezone ? String(normalized.timezone) : null,
      };

      await db.geoLocationRecord.create({ data: createData });
    } catch (err) {
      console.debug("Failed to persist geo record:", err);
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
