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

// GET /api/auth/google/callback
// Handles OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const stateParam = searchParams.get("state");

    // Extract plan and context from state parameter
    let selectedPlan: string | null = null;
    let companyId: string | null = null;
    let context: "root" | "storefront" = "root";

    if (stateParam) {
      try {
        const state = JSON.parse(stateParam);
        selectedPlan = state.plan;
        companyId = state.companyId;
        context = state.context || "root";
      } catch {
        console.log("[Google OAuth] Could not parse state parameter");
      }
    }

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

    // Get Google OAuth settings based on context
    let oauthSettings;

    if (context === "storefront" && companyId) {
      // Use company-specific OAuth settings
      oauthSettings = await db.companyOAuthSetting.findFirst({
        where: {
          companyId: companyId,
          provider: "google",
          enabled: true,
        },
      });
    } else {
      // Use global OAuth settings
      oauthSettings = await db.oAuthProviderSetting.findUnique({
        where: { provider: "google" },
      });
    }

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
        mfaEnabled: true,
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
      // User doesn't exist - create new user based on context
      if (context === "storefront" && companyId) {
        // STOREFRONT CONTEXT: Create COMPANY_CUSTOMER
        user = await db.user.create({
          data: {
            email,
            name: name || email.split("@")[0],
            image: picture,
            role: "COMPANY_CUSTOMER",
            plan: "COMPANY_CUSTOMER",
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
            mfaEnabled: true,
          },
        });

        // Note: COMPANY_CUSTOMER users are linked to companies through their orders
        // No welcome email for storefront customers (company can customize this later)
      } else {
        // ROOT PLATFORM CONTEXT: Create ERP_CUSTOMER
        // Use plan from register page if provided, otherwise GUEST for plan selection
        const userPlan =
          selectedPlan &&
          ["ESSENTIAL", "GROWTH", "ENTERPRISE"].includes(selectedPlan)
            ? (selectedPlan as "ESSENTIAL" | "GROWTH" | "ENTERPRISE")
            : "GUEST";

        user = await db.user.create({
          data: {
            email,
            name: name || email.split("@")[0],
            image: picture,
            role: "ERP_CUSTOMER", // New signups are ERP customers
            plan: userPlan, // Use selected plan from register page or GUEST
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
            mfaEnabled: true,
          },
        });

        // Send welcome email to new ERP customer only
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

    // If MFA is enabled, redirect to MFA challenge without creating a session
    if (user.mfaEnabled) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const pendingToken = createPendingMfaToken(user.id, user.email, "google");
      return buildMfaRedirectResponse(appUrl, pendingToken, "google");
    }

    // Create session using session manager
    const session = await createSession({ userId: user.id, request });

    console.log(
      "Google OAuth successful for user:",
      user.email,
      "Role:",
      user.role,
      "Plan:",
      user.plan,
      "Context:",
      context
    );

    // Determine redirect URL based on context and user state
    let redirectUrl: string;

    if (context === "storefront" && companyId) {
      // Get company slug for redirect
      const company = await db.company.findUnique({
        where: { id: companyId },
        select: { slug: true },
      });

      if (company?.slug) {
        redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/store/${company.slug}`;
      } else {
        // Fallback if company not found
        redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/`;
      }
    } else if (user.plan === "GUEST") {
      // ROOT PLATFORM - new users need to select a plan
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/select-plan`;
    } else {
      // ROOT PLATFORM - existing users go to dashboard
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    }

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
    console.error("Error in Google OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
