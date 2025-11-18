import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch WeChat OAuth settings from database
    const settings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "wechat" },
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

    // Build WeChat OAuth authorization URL
    const authUrl = new URL("https://open.weixin.qq.com/connect/qrconnect");
    authUrl.searchParams.append("appid", settings.clientId);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append(
      "redirect_uri",
      encodeURIComponent(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/wechat/callback`
      )
    );
    authUrl.searchParams.append("scope", "snsapi_login");
    authUrl.searchParams.append("state", "STATE");

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating WeChat OAuth:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
