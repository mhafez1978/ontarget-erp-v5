interface PrimaryAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface AddressLike {
  primaryAddress?: PrimaryAddress | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function serializeAddress(entity?: AddressLike | null) {
  // Prefer resolved primaryAddress when present, fall back to legacy inline fields
  const primary = entity?.primaryAddress;

  const line1 = primary?.line1 ?? entity?.addressLine1 ?? null;
  const line2 = primary?.line2 ?? entity?.addressLine2 ?? null;
  const city = primary?.city ?? entity?.city ?? null;
  const state = primary?.state ?? entity?.state ?? null;
  const country = primary?.country ?? entity?.country ?? null;
  const postalCode = primary?.postalCode ?? entity?.postalCode ?? null;
  const countryCode = primary?.countryCode ?? entity?.countryCode ?? null;
  const latitude = primary?.latitude ?? entity?.latitude ?? null;
  const longitude = primary?.longitude ?? entity?.longitude ?? null;

  return {
    line1,
    line2,
    city,
    state,
    country,
    postalCode,
    countryCode,
    latitude,
    longitude,
  };
}

export const COMPANY_PRIMARY_ADDRESS_INCLUDE = {
  primaryAddress: {
    select: {
      line1: true,
      line2: true,
      city: true,
      state: true,
      country: true,
      postalCode: true,
      countryCode: true,
      latitude: true,
      longitude: true,
    },
  },
};

export const USER_PRIMARY_ADDRESS_INCLUDE = COMPANY_PRIMARY_ADDRESS_INCLUDE;
