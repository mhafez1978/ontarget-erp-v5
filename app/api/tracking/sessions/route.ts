import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lookupGeoByIp, countryCodeToFlag } from "@/lib/ip-lookup";

interface ActiveSession {
  id: string;
  userName: string | null;
  userEmail: string | null;
  companyName: string | null;
  role: string;
  sessionCity: string | null;
  sessionState: string | null;
  sessionCountry: string | null;
  sessionCountryFlag: string | null;
  sessionIpAddress: string | null;
  sessionIpv4: string | null;
  sessionIpv6: string | null;
  createdAt: string;
  expiresAt: string;
}

async function enrichSessionGeo(session: {
  sessionCity: string | null;
  sessionState: string | null;
  sessionCountry: string | null;
  sessionCountryFlag: string | null;
  sessionIpv4: string | null;
  sessionIpv6: string | null;
  sessionIpAddress: string | null;
}) {
  let { sessionCity, sessionState, sessionCountry, sessionCountryFlag } =
    session;

  // Skip if we already have location data
  if (sessionCity && sessionCountry) {
    return { sessionCity, sessionState, sessionCountry, sessionCountryFlag };
  }

  // Try geo lookup if we have an IP
  const ipForLookup =
    session.sessionIpv4 || session.sessionIpv6 || session.sessionIpAddress;
  if (!ipForLookup) {
    return { sessionCity, sessionState, sessionCountry, sessionCountryFlag };
  }

  try {
    const geo = await lookupGeoByIp(ipForLookup);
    if (geo) {
      sessionCity = geo.city || sessionCity;
      sessionState = geo.region || sessionState;
      sessionCountry = geo.country || sessionCountry;
      sessionCountryFlag =
        sessionCountryFlag || countryCodeToFlag(geo.countryCode) || null;
    }
  } catch (error) {
    console.error("Geo lookup failed for session IP:", ipForLookup, error);
  }

  return { sessionCity, sessionState, sessionCountry, sessionCountryFlag };
}

/**
 * GET /api/tracking/sessions
 * Fetches all active user sessions with geo enrichment
 */
export async function GET() {
  try {
    const sessions = await db.session.findMany({
      where: { expires: { gt: new Date() } },
      include: {
        user: {
          include: {
            companyMemberships: {
              take: 1,
              orderBy: { joinedAt: "desc" },
              include: { company: true },
            },
          },
        },
      },
      orderBy: { id: "desc" },
    });

    const formattedSessions: ActiveSession[] = await Promise.all(
      sessions.map(async (session) => {
        const geoData = await enrichSessionGeo(session);
        const membership = session.user?.companyMemberships[0];

        // Calculate approximate createdAt from expires (sessions last 30 days)
        const expiresDate = new Date(session.expires);
        const createdAtApprox = new Date(
          expiresDate.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        return {
          id: session.id,
          userName: session.user?.name || null,
          userEmail: session.user?.email || null,
          companyName: membership?.company?.name || null,
          role: session.user?.role || "GUEST",
          ...geoData,
          sessionIpAddress: session.sessionIpAddress,
          sessionIpv4: session.sessionIpv4,
          sessionIpv6: session.sessionIpv6,
          createdAt: createdAtApprox.toISOString(),
          expiresAt: session.expires.toISOString(),
        };
      })
    );

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch active sessions" },
      { status: 500 }
    );
  }
}
