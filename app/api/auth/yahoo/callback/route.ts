import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackLoginMethod } from "@/lib/account-tracking";
import { createSession } from "@/lib/session-manager";
import { sendEmail, getWelcomeCustomerEmail } from "@/lib/email-service";
import {
  buildMfaRedirectResponse,
  createPendingMfaToken,
} from "@/lib/mfa-pending";

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
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
      );
    }

    // Fetch Yahoo OAuth settings
    const settings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "yahoo" },
    });

    if (!settings || !settings.clientId || !settings.clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_config_error`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://api.login.yahoo.com/oauth2/get_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${settings.clientId}:${settings.clientSecret}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/yahoo/callback`,
          grant_type: "authorization_code",
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

    // Get user profile from Yahoo API
    const profileResponse = await fetch(
      "https://api.login.yahoo.com/openid/v1/userinfo",
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
    const { email, name, picture } = profile;

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
        mfaEnabled: true,
      },
    });

    let isNewUser = false;

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

      // Update their profile picture only if they don't already have a custom upload
      const hasCustomProfileImage =
        user.image?.startsWith("/uploads/") ||
        user.image?.includes("/uploads/");

      if (picture && picture !== user.image && !hasCustomProfileImage) {
        await db.user.update({
          where: { id: user.id },
          data: { image: picture },
        });
      }
    } else {
      // User doesn't exist - create new ERP_CUSTOMER with GUEST plan
      // They will need to select a plan before accessing the dashboard
      isNewUser = true;

      user = await db.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          image: picture,
          role: "ERP_CUSTOMER",
          plan: "GUEST", // Set to GUEST so they're forced to select a plan
          authMethod: "oauth",
          emailVerified: new Date(), // Yahoo emails are verified
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
          mfaEnabled: true,
        },
      });

      // Send welcome email to new customer
      try {
        const { subject, html } = await getWelcomeCustomerEmail(
          user.name || email,
          email
        );
        await sendEmail({
          to: email,
          subject,
          html,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail OAuth if email fails
      }
    }

    // Store or update OAuth account information
    if (user && profile.sub) {
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "yahoo",
            providerAccountId: profile.sub,
          },
        },
        create: {
          userId: user.id,
          type: "oauth",
          provider: "yahoo",
          providerAccountId: profile.sub,
          access_token: accessToken,
          email: email,
          displayName: name,
          avatarUrl: picture,
        },
        update: {
          access_token: accessToken,
          email: email,
          displayName: name,
          avatarUrl: picture,
        },
      });

      // Track login method for analytics
      await trackLoginMethod(user.id, "yahoo", profile.sub, {
        email: email,
        displayName: name,
        avatarUrl: picture,
        access_token: accessToken,
      });
    }

    // Create onboarding token for new OAuth users (expires in 24 hours)
    let onboarding = null;
    if (isNewUser) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      onboarding = await db.oAuthOnboarding.create({
        data: {
          userId: user.id,
          expiresAt,
          context: "root",
        },
      });

      // Audit: onboarding token created
      const { createAuditLog, AUDIT_ACTIONS } = await import("@/lib/audit-log");
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_TOKEN_CREATED,
        userId: user.id,
        entityType: "User",
        entityId: user.id,
        description: `Created onboarding token for Yahoo OAuth user: ${email}`,
        metadata: {
          token: onboarding.token,
          expiresAt: onboarding.expiresAt.toISOString(),
          provider: "yahoo",
        },
      });
    }

    // If MFA is enabled, redirect to MFA challenge without creating a session
    if (user.mfaEnabled) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const pendingToken = createPendingMfaToken(user.id, user.email, "yahoo");
      return buildMfaRedirectResponse(appUrl, pendingToken, "yahoo");
    }

    // Create session using session manager
    const session = await createSession({ userId: user.id, request });

    // Determine redirect URL
    const redirectUrl =
      user.plan === "GUEST" && onboarding
        ? `${process.env.NEXT_PUBLIC_APP_URL}/oauth-setup/${encodeURIComponent(
            onboarding.token
          )}`
        : user.plan === "GUEST"
        ? `${process.env.NEXT_PUBLIC_APP_URL}/select-plan`
        : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

    const response = NextResponse.redirect(redirectUrl);

    // Set session cookie on response
    response.cookies.set("sessionToken", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in Yahoo OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
