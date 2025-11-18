import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { revokeAllUserSessions } from "@/lib/session-manager";

// POST /api/auth/sessions/revoke-all - Revoke all sessions except current
export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user, session } = validation;

    // Revoke all sessions except current one
    const count = await revokeAllUserSessions(user.id, session.sessionToken);

    return NextResponse.json({
      success: true,
      message: `Successfully revoked ${count} session(s)`,
      revokedCount: count,
    });
  } catch (error) {
    console.error("[Revoke All Sessions Error]:", error);
    return NextResponse.json(
      { error: "Failed to revoke sessions" },
      { status: 500 }
    );
  }
}
