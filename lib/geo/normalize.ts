export type NormalizedGeo = {
  ip?: string | null;
  ipv4?: string | null;
  ipv6?: string | null;
  city?: string | null;
  region?: string | null;
  regionName?: string | null;
  district?: string | null;
  zip?: string | null;
  country_name?: string | null;
  country_code?: string | null;
  continent?: string | null;
  continentCode?: string | null;
  isp?: string | null;
  org?: string | null;
  as?: string | null;
  asname?: string | null;
  mobile?: boolean | null;
  proxy?: boolean | null;
  hosting?: boolean | null;
  dns?: { geo?: string | null; ip?: string | null } | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  timezone?: string | null;
};

// Small helpers to safely coerce unknown values into the expected shapes
const asStringOrNull = (v: unknown): string | null =>
  typeof v === "string" || typeof v === "number" ? String(v) : null;
const asNumberOrStringOrNull = (v: unknown): string | number | null =>
  typeof v === "string" || typeof v === "number" ? v : null;

export function normalizeIpApi(api: unknown): NormalizedGeo {
  if (!api || typeof api !== "object") return {};
  const apiObj = api as Record<string, unknown>;
  const query = apiObj.query ?? apiObj.ip ?? null;
  const queryStr = query == null ? null : String(query);

  const dnsObj =
    apiObj.dns && typeof apiObj.dns === "object"
      ? (apiObj.dns as Record<string, unknown>)
      : null;

  return {
    ip: queryStr || null,
    ipv4: queryStr && !queryStr.includes(":") ? queryStr : null,
    ipv6: queryStr && queryStr.includes(":") ? queryStr : null,
    city: asStringOrNull(apiObj.city),
    region: apiObj.regionName
      ? asStringOrNull(apiObj.regionName)
      : asStringOrNull(apiObj.region),
    district: asStringOrNull(apiObj.district),
    zip: asStringOrNull(apiObj.zip),
    country_name: asStringOrNull(apiObj.country),
    country_code: asStringOrNull(apiObj.countryCode),
    continent: asStringOrNull(apiObj.continent),
    continentCode: asStringOrNull(apiObj.continentCode),
    isp: asStringOrNull(apiObj.isp),
    org: asStringOrNull(apiObj.org),
    as: asStringOrNull(apiObj.as),
    asname: asStringOrNull(apiObj.asname),
    mobile: typeof apiObj.mobile === "boolean" ? apiObj.mobile : null,
    proxy: typeof apiObj.proxy === "boolean" ? apiObj.proxy : null,
    hosting: typeof apiObj.hosting === "boolean" ? apiObj.hosting : null,
    dns: dnsObj
      ? {
          geo: dnsObj.geo ? asStringOrNull(dnsObj.geo) : null,
          ip: dnsObj.ip ? asStringOrNull(dnsObj.ip) : null,
        }
      : null,
    latitude: asNumberOrStringOrNull(apiObj.lat ?? apiObj.latitude ?? null),
    longitude: asNumberOrStringOrNull(apiObj.lon ?? apiObj.longitude ?? null),
    timezone: asStringOrNull(apiObj.timezone),
  };
}

export function normalizeIpInfo(api: unknown): NormalizedGeo {
  if (!api || typeof api !== "object") return {};
  // ipinfo has nested geo or loc
  const apiObj = api as Record<string, unknown>;
  const geo = (apiObj.geo as Record<string, unknown> | null) || null;
  const loc = apiObj.loc ? String(apiObj.loc).split(",") : null;

  return {
    ip: apiObj.ip ? String(apiObj.ip) : null,
    ipv4:
      apiObj.ip && !String(apiObj.ip).includes(":") ? String(apiObj.ip) : null,
    ipv6:
      apiObj.ip && String(apiObj.ip).includes(":") ? String(apiObj.ip) : null,
    city:
      geo && geo.city ? asStringOrNull(geo.city) : asStringOrNull(apiObj.city),
    region:
      geo && geo.region_code
        ? asStringOrNull(geo.region_code)
        : asStringOrNull(apiObj.region),
    regionName:
      geo && geo.region
        ? asStringOrNull(geo.region)
        : asStringOrNull(apiObj.region),
    zip:
      geo && geo.postal_code
        ? asStringOrNull(geo.postal_code)
        : asStringOrNull(apiObj.postal),
    country_name:
      geo && geo.country
        ? asStringOrNull(geo.country)
        : asStringOrNull(apiObj.country),
    country_code:
      geo && geo.country_code
        ? asStringOrNull(geo.country_code)
        : asStringOrNull(apiObj.country),
    continent: geo && geo.continent ? asStringOrNull(geo.continent) : null,
    continentCode:
      geo && geo.continent_code ? asStringOrNull(geo.continent_code) : null,
    isp: apiObj.isp
      ? asStringOrNull(apiObj.isp)
      : apiObj.org
      ? asStringOrNull(apiObj.org)
      : null,
    org: apiObj.org ? asStringOrNull(apiObj.org) : null,
    as: apiObj.as ? asStringOrNull(apiObj.as) : null,
    asname: apiObj.asname ? asStringOrNull(apiObj.asname) : null,
    mobile: null,
    proxy: null,
    hosting: null,
    dns:
      apiObj.dns && typeof apiObj.dns === "object"
        ? {
            geo: (apiObj.dns as Record<string, unknown>).geo
              ? asStringOrNull((apiObj.dns as Record<string, unknown>).geo)
              : null,
            ip: (apiObj.dns as Record<string, unknown>).ip
              ? asStringOrNull((apiObj.dns as Record<string, unknown>).ip)
              : null,
          }
        : null,
    latitude: asNumberOrStringOrNull(
      loc ? loc[0] : (geo && (geo.latitude ?? null)) ?? null
    ),
    longitude: asNumberOrStringOrNull(
      loc ? loc[1] : (geo && (geo.longitude ?? null)) ?? null
    ),
    timezone:
      geo && geo.timezone
        ? asStringOrNull(geo.timezone)
        : asStringOrNull(apiObj.timezone),
  };
}

export function normalizeIpGeolocation(api: unknown): NormalizedGeo {
  if (!api || typeof api !== "object") return {};
  const apiObj = api as Record<string, unknown>;
  const loc =
    (apiObj.location as Record<string, unknown> | undefined) || apiObj;
  return {
    ip: apiObj.ip ? asStringOrNull(apiObj.ip) : null,
    ipv4:
      apiObj.ip && !String(apiObj.ip).includes(":")
        ? asStringOrNull(apiObj.ip)
        : null,
    ipv6:
      apiObj.ip && String(apiObj.ip).includes(":")
        ? asStringOrNull(apiObj.ip)
        : null,
    city: loc?.city ? asStringOrNull(loc.city) : null,
    region: loc?.state_prov ? asStringOrNull(loc.state_prov) : null,
    regionName: loc?.state_prov ? asStringOrNull(loc.state_prov) : null,
    district: loc?.district ? asStringOrNull(loc.district) : null,
    zip: loc?.zipcode ? asStringOrNull(loc.zipcode) : null,
    country_name: loc?.country_name ? asStringOrNull(loc.country_name) : null,
    country_code: loc?.country_code2 ? asStringOrNull(loc.country_code2) : null,
    continent: loc?.continent_name ? asStringOrNull(loc.continent_name) : null,
    continentCode: loc?.continent_code
      ? asStringOrNull(loc.continent_code)
      : null,
    isp: apiObj.isp ? asStringOrNull(apiObj.isp) : null,
    org: apiObj.org ? asStringOrNull(apiObj.org) : null,
    as: apiObj.as ? asStringOrNull(apiObj.as) : null,
    asname: apiObj.asname ? asStringOrNull(apiObj.asname) : null,
    mobile: null,
    proxy: null,
    hosting: null,
    dns:
      apiObj.dns && typeof apiObj.dns === "object"
        ? {
            geo: (apiObj.dns as Record<string, unknown>).geo
              ? asStringOrNull((apiObj.dns as Record<string, unknown>).geo)
              : null,
            ip: (apiObj.dns as Record<string, unknown>).ip
              ? asStringOrNull((apiObj.dns as Record<string, unknown>).ip)
              : null,
          }
        : null,
    latitude: asNumberOrStringOrNull(loc?.latitude ?? null),
    longitude: asNumberOrStringOrNull(loc?.longitude ?? null),
    timezone:
      loc?.time_zone && (loc.time_zone as Record<string, unknown>).name
        ? asStringOrNull((loc.time_zone as Record<string, unknown>).name)
        : null,
  };
}

export function normalize(provider: string, api: unknown): NormalizedGeo {
  switch ((provider || "").toUpperCase()) {
    case "IP_API":
      return normalizeIpApi(api);
    case "IPINFO":
      return normalizeIpInfo(api);
    case "IPGEOLOCATION":
      return normalizeIpGeolocation(api);
    default:
      // Try heuristics
      return normalizeIpApi(api);
  }
}
