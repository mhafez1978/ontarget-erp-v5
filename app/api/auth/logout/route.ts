import { NextRequest, NextResponse } from "next/server";
import { revokeSession } from "@/lib/session-manager";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  try {
    // Get session token from request cookies
    const sessionToken = request.cookies.get("sessionToken")?.value;

    if (!sessionToken) {
      // No session, but still clear cookie and return success
      const response = NextResponse.json({
        success: true,
        message: "Logged out successfully",
      });
      response.cookies.delete("sessionToken");
      return response;
    }

    // Get geo-location for audit
    let geoData = null;
    try {
      const geoResponse = await fetch(
        `${request.nextUrl.origin}/api/get-location`,
        {
          headers: {
            "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
            "x-real-ip": request.headers.get("x-real-ip") || "",
          },
        }
      );
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
      }
    } catch (error) {
      console.error("Error fetching geolocation:", error);
    }

    // Get session details before revoking for audit log
    const { validateSession } = await import("@/lib/session-manager");
    const validation = await validateSession(sessionToken);

    // Revoke the session
    const success = await revokeSession(sessionToken);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to revoke session" },
        { status: 500 }
      );
    }

    // Create audit log if we have user info
    if (validation.valid && validation.user) {
      try {
        await createAuditLog({
          action: AUDIT_ACTIONS.USER_LOGOUT,
          userId: validation.user.id,
          description: "User logged out",
          metadata: {
            sessionId: validation.session?.id,
          },
          ipAddress: geoData?.ip || null,
          ipv4: geoData?.ipv4 || null,
          ipv6: geoData?.ipv6 || null,
          city: geoData?.city || null,
          state: geoData?.region || null,
          country: geoData?.country_name || null,
          countryFlag: geoData?.flag || null,
        });
      } catch (auditError) {
        console.error("Failed to create logout audit log:", auditError);
        // Don't fail logout if audit logging fails
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear session token cookie
    response.cookies.delete("sessionToken");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
