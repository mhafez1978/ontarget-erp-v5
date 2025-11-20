import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/auth/google/login
// Initiates Google OAuth flow
// Supports both root platform auth (global OAuth) and company storefront auth (company OAuth)
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
          provider: "google",
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
      oauthSettings = await db.oAuthProviderSetting.findUnique({
        where: { provider: "google" },
      });

      if (!oauthSettings || !oauthSettings.enabled) {
        return NextResponse.json(
          { error: "Google OAuth is not enabled" },
          { status: 400 }
        );
      }

      if (!oauthSettings.clientId) {
        return NextResponse.json(
          { error: "Google OAuth is not properly configured" },
          { status: 500 }
        );
      }
    }

    // Build Google OAuth authorization URL
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`;
    const scope = "openid email profile";

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", oauthSettings.clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("access_type", "offline");
    // Only prompt for consent on first login, not every time
    authUrl.searchParams.set("prompt", "select_account");

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

    authUrl.searchParams.set("state", JSON.stringify(state));

    // Redirect user to Google OAuth consent screen
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google authentication" },
      { status: 500 }
    );
  }
}
