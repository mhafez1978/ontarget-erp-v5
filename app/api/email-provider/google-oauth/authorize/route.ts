import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const user = validation.user;

    // Only SUPER_ADMIN or ADMIN can set up email providers
    if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, clientSecret, fromEmail } = body;

    if (!clientId || !clientSecret || !fromEmail) {
      return NextResponse.json(
        { error: "Client ID, Client Secret, and From Email are required" },
        { status: 400 }
      );
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/email-provider/google-oauth/callback`
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline", // Will return refresh token
      scope: [
        "https://mail.google.com/", // Full Gmail SMTP access
      ],
      prompt: "consent", // Force consent screen to ensure refresh token
    });

    // Store temporary data in database for callback validation
    // We'll use a temporary record or session storage
    // For now, we'll return the data and let the frontend handle it

    return NextResponse.json({
      success: true,
      authUrl,
      clientId,
      clientSecret,
      fromEmail,
    });
  } catch (error) {
    console.error("[Google OAuth Authorize] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
