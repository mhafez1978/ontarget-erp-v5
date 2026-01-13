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

export function normalizeIpApi(api: any): NormalizedGeo {
  if (!api) return {};
  return {
    ip: api.query || api.ip,
    ipv4: api.query && !String(api.query).includes(":") ? api.query : null,
    ipv6: api.query && String(api.query).includes(":") ? api.query : null,
    city: api.city || null,
    region: api.regionName || api.region || null,
    district: api.district || null,
    zip: api.zip || null,
    country_name: api.country || null,
    country_code: api.countryCode || null,
    continent: api.continent || null,
    continentCode: api.continentCode || null,
    isp: api.isp || null,
    org: api.org || null,
    as: api.as || null,
    asname: api.asname || null,
    mobile: typeof api.mobile === "boolean" ? api.mobile : null,
    proxy: typeof api.proxy === "boolean" ? api.proxy : null,
    hosting: typeof api.hosting === "boolean" ? api.hosting : null,
    dns: api.dns ? { geo: api.dns.geo || null, ip: api.dns.ip || null } : null,
    latitude: api.lat ?? api.latitude ?? null,
    longitude: api.lon ?? api.longitude ?? null,
    timezone: api.timezone || null,
  };
}

export function normalizeIpInfo(api: any): NormalizedGeo {
  if (!api) return {};
  // ipinfo has nested geo or loc
  const geo = api.geo || null;
  const loc = api.loc ? String(api.loc).split(",") : null;

  return {
    ip: api.ip || null,
    ipv4: api.ip && !String(api.ip).includes(":") ? api.ip : null,
    ipv6: api.ip && String(api.ip).includes(":") ? api.ip : null,
    city: geo?.city || api.city || null,
    region: geo?.region_code || api.region || null,
    regionName: geo?.region || api.region || null,
    zip: geo?.postal_code || api.postal || null,
    country_name: geo?.country || api.country || null,
    country_code: geo?.country_code || api.country || null,
    continent: geo?.continent || null,
    continentCode: geo?.continent_code || null,
    isp: api.isp || api.org || null,
    org: api.org || null,
    as: api.as || null,
    asname: api.asname || null,
    mobile: null,
    proxy: null,
    hosting: null,
    dns: api.dns ? { geo: api.dns.geo || null, ip: api.dns.ip || null } : null,
    latitude: loc ? loc[0] : geo?.latitude ?? null,
    longitude: loc ? loc[1] : geo?.longitude ?? null,
    timezone: geo?.timezone || api.timezone || null,
  };
}

export function normalizeIpGeolocation(api: any): NormalizedGeo {
  if (!api) return {};
  const loc = api.location || api;
  return {
    ip: api.ip || null,
    ipv4: api.ip && !String(api.ip).includes(":") ? api.ip : null,
    ipv6: api.ip && String(api.ip).includes(":") ? api.ip : null,
    city: loc?.city || null,
    region: loc?.state_prov || null,
    regionName: loc?.state_prov || null,
    district: loc?.district || null,
    zip: loc?.zipcode || null,
    country_name: loc?.country_name || null,
    country_code: loc?.country_code2 || null,
    continent: loc?.continent_name || null,
    continentCode: loc?.continent_code || null,
    isp: api.isp || null,
    org: api.org || null,
    as: api.as || null,
    asname: api.asname || null,
    mobile: null,
    proxy: null,
    hosting: null,
    dns: api.dns ? { geo: api.dns.geo || null, ip: api.dns.ip || null } : null,
    latitude: loc?.latitude || null,
    longitude: loc?.longitude || null,
    timezone: loc?.time_zone?.name || null,
  };
}

export function normalize(provider: string, api: any): NormalizedGeo {
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
