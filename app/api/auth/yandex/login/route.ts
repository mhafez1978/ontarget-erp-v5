import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch Yandex OAuth settings from database
    const settings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "yandex" },
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

    // Build Yandex OAuth authorization URL
    const authUrl = new URL("https://oauth.yandex.com/authorize");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", settings.clientId);
    authUrl.searchParams.append(
      "redirect_uri",
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/yandex/callback`
    );

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating Yandex OAuth:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
