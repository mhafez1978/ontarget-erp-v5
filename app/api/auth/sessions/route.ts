import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getUserSessions, revokeSessionById } from "@/lib/session-manager";

// GET /api/auth/sessions - Get all active sessions for current user
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user, session: currentSession } = validation;

    // Get all sessions for user
    const sessions = await getUserSessions(user.id);

    // Format sessions with additional info
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      isCurrent: s.id === currentSession.id,
      location:
        [s.sessionCity, s.sessionState, s.sessionCountry]
          .filter(Boolean)
          .join(", ") || "Unknown",
      ipAddress: s.sessionIpAddress || "Unknown",
      country: s.sessionCountry,
      countryFlag: s.sessionCountryFlag,
      createdAt: s.expires, // Using expires as a proxy for created date
      expiresAt: s.expires,
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      count: formattedSessions.length,
    });
  } catch (error) {
    console.error("[Get Sessions Error]:", error);
    return NextResponse.json(
      { error: "Failed to get sessions" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/sessions?sessionId=xxx - Revoke a specific session
export async function DELETE(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user, session: currentSession } = validation;

    // Get sessionId from query
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Don't allow revoking current session (use logout for that)
    if (sessionId === currentSession.id) {
      return NextResponse.json(
        { error: "Cannot revoke current session. Use logout instead." },
        { status: 400 }
      );
    }

    // Verify session belongs to current user
    const sessions = await getUserSessions(user.id);
    const sessionToRevoke = sessions.find((s) => s.id === sessionId);

    if (!sessionToRevoke) {
      return NextResponse.json(
        { error: "Session not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Revoke the session
    const success = await revokeSessionById(sessionId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to revoke session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("[Revoke Session Error]:", error);
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}
