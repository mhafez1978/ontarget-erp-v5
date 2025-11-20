import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan");
    const companyId = searchParams.get("companyId"); // For storefront context

    let oauthSettings;

    if (companyId) {
      // STOREFRONT CONTEXT: Use company-specific OAuth settings
      oauthSettings = await db.companyOAuthSetting.findFirst({
        where: {
          companyId: companyId,
          provider: "github",
          isEnabled: true,
        },
      });

      if (!oauthSettings || !oauthSettings.clientId) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_config_error`
        );
      }
    } else {
      // ROOT PLATFORM CONTEXT: Use global OAuth settings
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

      oauthSettings = settings;
    }

    // Build GitHub OAuth authorization URL
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.append("client_id", oauthSettings.clientId);
    authUrl.searchParams.append(
      "redirect_uri",
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`
    );
    authUrl.searchParams.append("scope", "read:user user:email");

    // Pass context through state parameter
    const state: {
      plan?: string;
      companyId?: string;
      context: "root" | "storefront";
    } = {
      context: companyId ? "storefront" : "root",
    };

    if (plan && ["ESSENTIAL", "GROWTH", "ENTERPRISE"].includes(plan)) {
      state.plan = plan;
    }

    if (companyId) {
      state.companyId = companyId;
    }

    authUrl.searchParams.append("state", JSON.stringify(state));

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating GitHub OAuth:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
