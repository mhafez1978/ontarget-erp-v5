import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch GitHub OAuth settings from database
    const settings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "github" },
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

    // Build GitHub OAuth authorization URL
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.append("client_id", settings.clientId);
    authUrl.searchParams.append(
      "redirect_uri",
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
    );
    authUrl.searchParams.append("scope", "read:user user:email");

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating GitHub OAuth:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
