import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI, hasRole } from "@/lib/validate-session";
import { db } from "@/lib/db";

// GET /api/auth/sessions/company - Admin: Get sessions for users in their companies
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    // Only ADMIN and SUPER_ADMIN can view company sessions
    if (!hasRole(user, ["ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // If SUPER_ADMIN, return all sessions (same as /all endpoint)
    if (hasRole(user, "SUPER_ADMIN")) {
      const sessions = await db.session.findMany({
        where: {
          expires: { gte: new Date() },
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
        createdAt: s.expires,
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
    }

    // For ADMIN, get sessions for users in their companies
    // First, find all companies where the admin is a member
    const adminCompanies = await db.companyMember.findMany({
      where: {
        userId: user.id,
        role: { in: ["OWNER", "ADMIN"] },
      },
      select: {
        companyId: true,
      },
    });

    const companyIds = adminCompanies.map((cm) => cm.companyId);

    if (companyIds.length === 0) {
      return NextResponse.json({
        success: true,
        sessions: [],
        count: 0,
      });
    }

    // Find all users who are members of these companies
    const companyMembers = await db.companyMember.findMany({
      where: {
        companyId: { in: companyIds },
      },
      select: {
        userId: true,
      },
    });

    const userIds = [...new Set(companyMembers.map((cm) => cm.userId))];

    // Get active sessions for these users
    const sessions = await db.session.findMany({
      where: {
        userId: { in: userIds },
        expires: { gte: new Date() },
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
      createdAt: s.expires,
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
    console.error("[Get Company Sessions Error]:", error);
    return NextResponse.json(
      { error: "Failed to get company sessions" },
      { status: 500 }
    );
  }
}
