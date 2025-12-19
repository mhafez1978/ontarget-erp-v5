/**
 * Geo-location utility for fetching IP location data
 * Used for audit logging and security tracking
 */

// Small in-memory TTL cache for recent lookups to reduce provider calls.
type CacheItem = { payload: GeoLocationData; expiresAt: number };
const CACHE_TTL_MS =
  Number(process.env.GET_LOCATION_CACHE_TTL_MS) || 5 * 60 * 1000; // 5m default

const CACHE_KEY = "__geo_location_cache_v1" as const;
if (!(globalThis as unknown as Record<string, unknown>)[CACHE_KEY]) {
  (globalThis as unknown as Record<string, unknown>)[CACHE_KEY] = new Map<
    string,
    CacheItem
  >();
}
const globalCache: Map<string, CacheItem> = (
  globalThis as unknown as Record<string, unknown>
)[CACHE_KEY] as Map<string, CacheItem>;

export interface GeoLocationData {
  ip: string;
  ipv4?: string;
  ipv6?: string;
  city: string | null;
  region: string | null;
  region_code: string | null;
  country: string;
  country_name: string;
  country_code: string;
  country_code_iso3: string;
  country_capital: string | null;
  country_tld: string | null;
  continent_code: string | null;
  in_eu: boolean;
  postal: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  utc_offset: string | null;
  country_calling_code: string | null;
  currency: string | null;
  currency_name: string | null;
  languages: string | null;
  country_area: number | null;
  country_population: number | null;
  asn: string | null;
  org: string | null;
  flag?: string;
}

function getCached(ipKey: string): GeoLocationData | null {
  const entry = globalCache.get(ipKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    globalCache.delete(ipKey);
    return null;
  }
  return entry.payload;
}

function setCached(ipKey: string, payload: GeoLocationData) {
  globalCache.set(ipKey, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
}

/**
 * Fetch geo-location data for an IP address
 * @param clientIp - The IP address to look up (optional, will detect server IP if not provided)
 * @returns Geo-location data or null if lookup fails
 */
export async function getGeoLocation(
  clientIp?: string | null
): Promise<GeoLocationData | null> {
  try {
    // Check cache first
    const cacheKey = clientIp || "server-ip";
    const cached = getCached(cacheKey);
    if (cached) {
      return cached;
    }

    // Build the URL - if we have a client IP, query it specifically
    const url = clientIp
      ? `https://ipapi.co/${clientIp}/json/`
      : "https://ipapi.co/json/";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ontarget-erp/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        `Geo-location lookup failed: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = (await response.json()) as GeoLocationData;

    // Add flag emoji if we have a country code
    if (data.country_code) {
      const codePoints = data.country_code
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
      data.flag = String.fromCodePoint(...codePoints);
    }

    // Cache the result
    setCached(cacheKey, data);

    return data;
  } catch (error) {
    console.debug("Failed to fetch geo-location:", error);
    return null;
  }
}

/**
 * Extract client IP from request headers
 * @param headers - Request headers
 * @returns Client IP address or null
 */
export function extractClientIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  const realIp = headers.get("x-real-ip");

  // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2...)
  // The first one is the real client IP
  return forwardedFor?.split(",")[0]?.trim() || realIp || null;
}

/**
 * Clear the geo-location cache (for testing)
 */
export function clearGeoLocationCache() {
  globalCache.clear();
}
