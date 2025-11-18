import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/auth/microsoft/login
// Initiates Microsoft OAuth flow
export async function GET() {
  try {
    // Get Microsoft OAuth settings from database
    const oauthSettings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "microsoft" },
    });

    if (!oauthSettings || !oauthSettings.enabled) {
      return NextResponse.json(
        { error: "Microsoft OAuth is not enabled" },
        { status: 400 }
      );
    }

    if (!oauthSettings.clientId) {
      return NextResponse.json(
        { error: "Microsoft OAuth is not properly configured" },
        { status: 500 }
      );
    }

    // Build Microsoft OAuth authorization URL
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`;
    const scope = "openid email profile User.Read";

    const authUrl = new URL(
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
    );
    authUrl.searchParams.set("client_id", oauthSettings.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("response_mode", "query");
    authUrl.searchParams.set("prompt", "select_account");

    // Redirect user to Microsoft OAuth consent screen
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating Microsoft OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate Microsoft authentication" },
      { status: 500 }
    );
  }
}
