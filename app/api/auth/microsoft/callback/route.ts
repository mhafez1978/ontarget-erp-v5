import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackLoginMethod } from "@/lib/account-tracking";
import { createSession } from "@/lib/session-manager";
import { sendEmail, getWelcomeCustomerEmail } from "@/lib/email-service";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import {
  buildMfaRedirectResponse,
  createPendingMfaToken,
} from "@/lib/mfa-pending";
import { decrypt } from "@/lib/encryption";

// GET /api/auth/microsoft/callback
// Handles OAuth callback from Microsoft
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const stateParam = searchParams.get("state");

    // Extract plan from state if provided
    let selectedPlan: string | null = null;
    if (stateParam) {
      try {
        const state = JSON.parse(stateParam);
        selectedPlan = state.plan;
      } catch {
        console.log("[Microsoft OAuth] Could not parse state parameter");
      }
    }

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

    // Decrypt the client secret before using it and trim whitespace
    const clientSecret = decrypt(oauthSettings.clientSecret).trim();

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
          client_secret: clientSecret,
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

      // Update their name if not set
      if (!user.name && displayName) {
        await db.user.update({
          where: { id: user.id },
          data: { name: displayName },
        });
      }
    } else {
      // User doesn't exist - create new ERP_CUSTOMER
      // Use plan from register page if provided, otherwise GUEST for plan selection
      const userPlan =
        selectedPlan &&
        ["ESSENTIAL", "GROWTH", "ENTERPRISE"].includes(selectedPlan)
          ? (selectedPlan as "ESSENTIAL" | "GROWTH" | "ENTERPRISE")
          : "GUEST";

      isNewUser = true;

      user = await db.user.create({
        data: {
          email,
          name: displayName || email.split("@")[0],
          image: null, // Microsoft doesn't provide photo in basic profile
          role: "ERP_CUSTOMER",
          plan: userPlan, // Use selected plan from register page or GUEST
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
            provider: "microsoft",
            subject,
          },
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);

        // Log email failure
        await createAuditLog({
          action: AUDIT_ACTIONS.EMAIL_FAILED,
          userId: user.id,
          entityType: "User",
          entityId: user.id,
          description: `Failed to send welcome email to: ${email}`,
          metadata: {
            email,
            provider: "microsoft",
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

      // Track login method for analytics
      await trackLoginMethod(user.id, "microsoft", microsoftUserId, {
        email: email,
        displayName: displayName,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresIn
          ? Math.floor(Date.now() / 1000) + expiresIn
          : null,
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
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_TOKEN_CREATED,
        userId: user.id,
        entityType: "User",
        entityId: user.id,
        description: `Created onboarding token for Microsoft OAuth user: ${email}`,
        metadata: {
          token: onboarding.token,
          expiresAt: onboarding.expiresAt.toISOString(),
          provider: "microsoft",
        },
      });
    }

    // If MFA is enabled, redirect to MFA challenge without creating a session
    if (user.mfaEnabled) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const pendingToken = createPendingMfaToken(
        user.id,
        user.email,
        "microsoft"
      );
      return buildMfaRedirectResponse(appUrl, pendingToken, "microsoft");
    }

    // Create session using session manager
    const session = await createSession({ userId: user.id, request });

    console.log(
      "Microsoft OAuth successful for user:",
      user.email,
      "Plan:",
      user.plan
    );

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
    console.error("Error in Microsoft OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
