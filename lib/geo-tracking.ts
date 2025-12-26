/**
 * Geo-tracking utility using ipapi.co API
 *
 * API: https://ipapi.co/json/
 * Features:
 * - Free tier: 30,000 requests/month (1,000/day)
 * - No API key required
 * - Returns: IP, city, state/province, country, country flag emoji
 * - Rate limit: 1,000 requests per day
 */

export interface GeoLocation {
  ip: string;
  ipv4: string | null;
  ipv6: string | null;
  city: string | null;
  region: string | null; // state/province
  country: string | null;
  country_name: string | null;
  country_code: string | null;
  flag: string | null; // emoji flag
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

export async function getGeoLocation(): Promise<GeoLocation | null> {
  try {
    // Use our API route instead of calling ipapi.co directly
    // This avoids CORS issues and rate limiting from the client
    const response = await fetch("/api/get-location", {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[Geo Tracking] API returned ${response.status} ${response.statusText}`
      );
      try {
        const errorData = await response.json();
        console.error("[Geo Tracking] Error details:", errorData);
      } catch (e) {
        console.error("[Geo Tracking] Could not parse error response", e);
      }

      console.warn("Geo-tracking API unavailable, using fallback");
      // Return localhost fallback
      return {
        ip: "127.0.0.1",
        ipv4: "127.0.0.1",
        ipv6: null,
        city: "Localhost",
        region: null,
        country: "Local Development",
        country_name: "Local Development",
        country_code: null,
        flag: "🏠",
        latitude: null,
        longitude: null,
        timezone: null,
      };
    }

    const data = await response.json();

    return {
      ip: data.ip || "Unknown",
      ipv4: data.ipv4 || null,
      ipv6: data.ipv6 || null,
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      country_name: data.country_name || null,
      country_code: data.country_code || null,
      flag: data.flag || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error("Failed to fetch geo-location:", error);
    // Return localhost fallback
    return {
      ip: "127.0.0.1",
      ipv4: "127.0.0.1",
      ipv6: null,
      city: "Localhost",
      region: null,
      country: "Local Development",
      country_name: "Local Development",
      country_code: null,
      flag: "🏠",
      latitude: null,
      longitude: null,
      timezone: null,
    };
  }
}

/**
 * Client-side geo-tracking hook
 */
export async function trackVisitor() {
  try {
    const location = await getGeoLocation();

    if (!location) {
      return null;
    }

    // Send to API to store in database
    await fetch("/api/track-visitor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ipAddress: location.ip,
        ipv4: location.ipv4,
        ipv6: location.ipv6,
        city: location.city,
        state: location.region,
        country: location.country,
        countryFlag: location.flag,
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
        landingPage: window.location.pathname,
      }),
    });

    return location;
  } catch (error) {
    console.error("Failed to track visitor:", error);
    return null;
  }
}
