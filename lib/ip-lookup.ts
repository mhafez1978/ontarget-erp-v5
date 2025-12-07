interface GeoLookupResult {
  ip?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
}

function countryCodeToFlag(code?: string | null) {
  if (!code || code.length !== 2) return null;
  const base = 127397;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => base + c.charCodeAt(0))
  );
}

async function lookupGeoByIp(ip?: string | null): Promise<GeoLookupResult | null> {
  if (!ip) return null;

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        "User-Agent": "OnTargetERP-GeoLookup/1.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data?.error) {
      return null;
    }

    return {
      ip: data.ip || ip,
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      countryCode: data.country_code || null,
    };
  } catch (error) {
    console.error("[GeoLookup] Geo lookup failed:", error);
    return null;
  }
}

export { lookupGeoByIp, countryCodeToFlag };
export type { GeoLookupResult };
