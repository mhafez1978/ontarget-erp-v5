import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch Line OAuth settings from database
    const settings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "line" },
    });

    if (!settings || !settings.enabled) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_not_enabled`
      );
    }

    if (!settings.clientId || !settings.clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_config_error`
      );
    }

    // Generate state for security
    const state = Math.random().toString(36).substring(7);

    // Build Line OAuth authorization URL
    const authUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", settings.clientId);
    authUrl.searchParams.append(
      "redirect_uri",
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`
    );
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("scope", "profile openid email");

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating Line OAuth:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
