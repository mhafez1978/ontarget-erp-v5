import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      userName: session.user?.name || null,
      userEmail: session.user?.email || null,
      companyName: session.user?.companyMemberships[0]?.company?.name || null,
      role: session.user?.role || "GUEST",
      sessionCity: session.sessionCity,
      sessionState: session.sessionState,
      sessionCountry: session.sessionCountry,
      sessionCountryFlag: session.sessionCountryFlag,
      sessionIpAddress: session.sessionIpAddress,
      sessionIpv4: session.sessionIpv4,
      sessionIpv6: session.sessionIpv6,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch active sessions" },
      { status: 500 }
    );
  }
}
