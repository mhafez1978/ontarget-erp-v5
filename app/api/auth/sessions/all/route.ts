import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI, hasRole } from "@/lib/validate-session";
import { db } from "@/lib/db";

// GET /api/auth/sessions/all - Super Admin only: Get all active sessions in the system
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    // Only SUPER_ADMIN can view all sessions
    if (!hasRole(user, "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    // Get all active sessions with user info
    const sessions = await db.session.findMany({
      where: {
        expires: { gte: new Date() }, // Only active sessions
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        expires: "desc",
      },
    });

    // Format sessions
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      isCurrent:
        s.userId === user.id &&
        s.sessionToken === validation.session.sessionToken,
      location:
        [s.sessionCity, s.sessionState, s.sessionCountry]
          .filter(Boolean)
          .join(", ") || "Unknown",
      ipAddress: s.sessionIpAddress || "Unknown",
      country: s.sessionCountry,
      countryFlag: s.sessionCountryFlag,
      userAgent: s.sessionUserAgent,
      createdAt: s.expires, // Using expires as proxy for created
      expiresAt: s.expires,
      userId: s.user.id,
      userName: s.user.name,
      userEmail: s.user.email,
      userRole: s.user.role,
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      count: formattedSessions.length,
    });
  } catch (error) {
    console.error("[Get All Sessions Error]:", error);
    return NextResponse.json(
      { error: "Failed to get sessions" },
      { status: 500 }
    );
  }
}
