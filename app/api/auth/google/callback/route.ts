import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";
import { trackLoginMethod } from "@/lib/account-tracking";
import { sendEmail, getWelcomeCustomerEmail } from "@/lib/email-service";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

// GET /api/auth/google/callback
// Handles OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_cancelled`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_failed`
      );
    }

    // Get Google OAuth settings
    const oauthSettings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "google" },
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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
      }),
    });

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

    // Get user profile from Google
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!profileResponse.ok) {
      console.error("Profile fetch failed:", await profileResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_profile_failed`
      );
    }

    const profile = await profileResponse.json();
    const { email, name, picture, verified_email, id: googleUserId } = profile;

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

      // Update their profile picture if changed
      if (picture && picture !== user.image) {
        await db.user.update({
          where: { id: user.id },
          data: { image: picture },
        });
      }
    } else {
      // User doesn't exist - create new ERP_CUSTOMER with GUEST plan
      // They will be redirected to plan selection
      user = await db.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          image: picture,
          role: "ERP_CUSTOMER",
          plan: "GUEST", // Set to GUEST so they're forced to select a plan
          authMethod: "oauth",
          emailVerified: verified_email ? new Date() : null,
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

      // Send welcome email to new customer
      try {
        console.log(`[Google OAuth] Sending welcome email to: ${email}`);
        const { subject, html } = await getWelcomeCustomerEmail(
          user.name || email,
          email
        );
        console.log(`[Google OAuth] Email subject: ${subject}`);
        await sendEmail({
          to: email,
          subject,
          html,
        });
        console.log(
          `[Google OAuth] Welcome email sent successfully to: ${email}`
        );

        // Log welcome email sent
        await createAuditLog({
          action: AUDIT_ACTIONS.WELCOME_EMAIL_SENT,
          userId: user.id,
          entityType: "User",
          entityId: user.id,
          description: `Welcome email sent to new ERP customer: ${email}`,
          metadata: {
            email,
            userName: user.name,
            provider: "google",
            subject,
          },
        });
      } catch (emailError) {
        console.error(
          "[Google OAuth] Failed to send welcome email:",
          emailError
        );
        console.error("[Google OAuth] Error details:", {
          message:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
          stack: emailError instanceof Error ? emailError.stack : undefined,
        });

        // Log email failure
        await createAuditLog({
          action: AUDIT_ACTIONS.EMAIL_FAILED,
          userId: user.id,
          entityType: "User",
          entityId: user.id,
          description: `Failed to send welcome email to: ${email}`,
          metadata: {
            email,
            provider: "google",
            error:
              emailError instanceof Error
                ? emailError.message
                : String(emailError),
          },
        }).catch(console.error);
        // Don't fail OAuth if email fails
      }
    }

    // Store or update OAuth account information
    if (user && googleUserId) {
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: googleUserId,
          },
        },
        create: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: googleUserId,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresIn
            ? Math.floor(Date.now() / 1000) + expiresIn
            : null,
          token_type: tokenType,
          scope: scope,
          id_token: idToken,
          email: email,
          displayName: name,
          avatarUrl: picture,
        },
        update: {
          access_token: accessToken,
          refresh_token: refreshToken || undefined, // Only update if present
          expires_at: expiresIn
            ? Math.floor(Date.now() / 1000) + expiresIn
            : null,
          token_type: tokenType,
          scope: scope,
          id_token: idToken,
          email: email,
          displayName: name,
          avatarUrl: picture,
        },
      });

      // Track login method for analytics
      await trackLoginMethod(user.id, "google", googleUserId, {
        email: email,
        displayName: name,
        profileUrl: `https://accounts.google.com/${googleUserId}`,
        avatarUrl: picture,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresIn
          ? Math.floor(Date.now() / 1000) + expiresIn
          : null,
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

    // Create session cookie
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

    console.log(
      "Google OAuth successful for user:",
      user.email,
      "Plan:",
      user.plan
    );

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
    console.error("Error in Google OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
