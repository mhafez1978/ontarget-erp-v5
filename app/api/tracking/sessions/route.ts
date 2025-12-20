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

export async function GET() {
  try {
    // Get active sessions (not expired)
    const now = new Date();

    const sessions = await db.session.findMany({
      where: {
        expires: {
          gt: now,
        },
      },
      include: {
        user: {
          include: {
            companyMemberships: {
              take: 1,
              orderBy: {
                joinedAt: "desc",
              },
              include: {
                company: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const formattedSessions = await Promise.all(
      sessions.map(async (session) => {
        let sessionCity = session.sessionCity;
        let sessionState = session.sessionState;
        let sessionCountry = session.sessionCountry;
        let sessionCountryFlag = session.sessionCountryFlag;

        if (
          !sessionCity &&
          !sessionCountry &&
          (session.sessionIpv4 ||
            session.sessionIpv6 ||
            session.sessionIpAddress)
        ) {
          const ipForLookup =
            session.sessionIpv4 ||
            session.sessionIpv6 ||
            session.sessionIpAddress;
          try {
            const geo = await lookupGeoByIp(ipForLookup);
            if (geo) {
              sessionCity = geo.city || sessionCity;
              sessionState = geo.region || sessionState;
              sessionCountry = geo.country || sessionCountry;
              sessionCountryFlag =
                sessionCountryFlag ||
                countryCodeToFlag(geo.countryCode) ||
                null;
            }
          } catch (error) {
            console.error(
              "Geo lookup failed for active session:",
              ipForLookup,
              error
            );
          }
        }

        return {
          id: session.id,
          userName: session.user?.name || null,
          userEmail: session.user?.email || null,
          companyName:
            session.user?.companyMemberships[0]?.company?.name || null,
          role: session.user?.role || "GUEST",
          sessionCity,
          sessionState,
          sessionCountry,
          sessionCountryFlag,
          sessionIpAddress: session.sessionIpAddress,
          sessionIpv4: session.sessionIpv4,
          sessionIpv6: session.sessionIpv6,
          createdAt: session.createdAt.toISOString(),
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
