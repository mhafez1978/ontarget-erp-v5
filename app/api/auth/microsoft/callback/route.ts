import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

// GET /api/auth/microsoft/callback
// Handles OAuth callback from Microsoft
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("Microsoft OAuth error:", error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_cancelled`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`
      );
    }

    // Get Microsoft OAuth settings
    const oauthSettings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "microsoft" },
    });

    if (
      !oauthSettings ||
      !oauthSettings.clientId ||
      !oauthSettings.clientSecret
    ) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_config_error`
      );
    }

    // Exchange authorization code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`;

    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: oauthSettings.clientId,
          client_secret: oauthSettings.clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          scope: "openid email profile User.Read",
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_token_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    const tokenType = tokenData.token_type;
    const scope = tokenData.scope;
    const idToken = tokenData.id_token;

    // Get user profile from Microsoft Graph API
    const profileResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      console.error("Profile fetch failed:", await profileResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_profile_failed`
      );
    }

    const profile = await profileResponse.json();
    const {
      mail,
      userPrincipalName,
      displayName,
      id: microsoftUserId,
    } = profile;

    // Microsoft uses either 'mail' or 'userPrincipalName' for email
    const email = mail || userPrincipalName;

    if (!email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=no_email`
      );
    }

    // Check if user exists
    let user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        authMethod: true,
        password: true,
        isActive: true,
        image: true,
        plan: true,
      },
    });

    if (user) {
      // User exists - check if they can login with OAuth
      if (!user.isActive) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/login?error=account_disabled`
        );
      }

      // If user was credentials-only, upgrade to 'both' when they use OAuth
      if (user.authMethod === "credentials") {
        await db.user.update({
          where: { id: user.id },
          data: { authMethod: "both" },
        });
      }

      // Update their name if not set
      if (!user.name && displayName) {
        await db.user.update({
          where: { id: user.id },
          data: { name: displayName },
        });
      }
    } else {
      // User doesn't exist - create new ERP_CUSTOMER with ESSENTIAL plan
      user = await db.user.create({
        data: {
          email,
          name: displayName || email.split("@")[0],
          image: null, // Microsoft doesn't provide photo in basic profile
          role: "ERP_CUSTOMER",
          plan: "ESSENTIAL", // Start with ESSENTIAL plan (1 company, basic features)
          authMethod: "oauth",
          emailVerified: new Date(), // Microsoft emails are verified
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          authMethod: true,
          password: true,
          isActive: true,
          image: true,
          plan: true,
        },
      });
    }

    // Store or update OAuth account information
    if (user && microsoftUserId) {
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "microsoft",
            providerAccountId: microsoftUserId,
          },
        },
        create: {
          userId: user.id,
          type: "oauth",
          provider: "microsoft",
          providerAccountId: microsoftUserId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresIn
            ? Math.floor(Date.now() / 1000) + expiresIn
            : null,
          token_type: tokenType,
          scope: scope,
          id_token: idToken,
        },
        update: {
          access_token: accessToken,
          refresh_token: refreshToken || undefined,
          expires_at: expiresIn
            ? Math.floor(Date.now() / 1000) + expiresIn
            : null,
          token_type: tokenType,
          scope: scope,
          id_token: idToken,
        },
      });
    }

    // Get user's geolocation
    let geoData = null;
    try {
      const geoResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/get-location`,
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

    // Create a session record with geo-tracking
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: expiresAt,
        sessionIpAddress: geoData?.ip || null,
        sessionIpv4: geoData?.ipv4 || null,
        sessionIpv6: geoData?.ipv6 || null,
        sessionCity: geoData?.city || null,
        sessionState: geoData?.region || null,
        sessionCountry: geoData?.country_name || null,
        sessionCountryFlag: geoData?.flag || null,
      },
    });

    // Update user's last login info
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIpAddress: geoData?.ip || null,
        lastLoginCity: geoData?.city || null,
        lastLoginState: geoData?.region || null,
        lastLoginCountry: geoData?.country || null,
        lastLoginCountryFlag: geoData?.flag || null,
      },
    });

    // Create session cookies
    const cookieStore = await cookies();
    if (user) {
      cookieStore.set("userId", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
      cookieStore.set("sessionToken", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    // Check if user needs to select a plan (new users with GUEST plan)
    if (user.plan === "GUEST") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/select-plan`
      );
    }

    // Redirect to dashboard
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    );
  } catch (error) {
    console.error("Error in Microsoft OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
