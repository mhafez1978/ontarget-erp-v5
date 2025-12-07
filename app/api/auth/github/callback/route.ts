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
    const stateParam = searchParams.get("state");

    // Extract context and companyId from state parameter
    let companyId: string | null = null;
    let context: "root" | "storefront" = "root";

    if (stateParam) {
      try {
        const state = JSON.parse(stateParam);
        companyId = state.companyId;
        context = state.context || "root";
      } catch {
        console.log("[GitHub OAuth] Could not parse state parameter");
      }
    }

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

    // Fetch GitHub OAuth settings based on context
    let settings;

    if (context === "storefront" && companyId) {
      // Use company-specific OAuth settings
      settings = await db.companyOAuthSetting.findFirst({
        where: {
          companyId: companyId,
          provider: "github",
          enabled: true,
        },
      });
    } else {
      // Use global OAuth settings
      settings = await db.oAuthProviderSetting.findUnique({
        where: { provider: "github" },
      });
    }

    if (!settings || !settings.clientId || !settings.clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_config_error`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: settings.clientId,
          client_secret: settings.clientSecret,
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
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

    // Get user profile from GitHub API
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!profileResponse.ok) {
      console.error("Profile fetch failed:", await profileResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_profile_failed`
      );
    }

    const profile = await profileResponse.json();
    let email = profile.email;

    // If email is not public, fetch from emails endpoint
    if (!email) {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        const primaryEmail = emails.find(
          (e: { primary: boolean; verified: boolean }) =>
            e.primary && e.verified
        );
        email = primaryEmail?.email || emails[0]?.email;
      }
    }

    // Generate placeholder email if GitHub doesn't provide one
    if (!email) {
      // Use GitHub username or ID to create a placeholder email
      const githubUsername = profile.login || `github${profile.id}`;
      email = `${githubUsername}@github.placeholder.local`;
      console.log(`[GitHub OAuth] No email found, using placeholder: ${email}`);
    }

    const { name, avatar_url } = profile;
    const isPlaceholderEmail = email.endsWith("@github.placeholder.local");

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

      if (avatar_url && avatar_url !== user.image && !hasCustomProfileImage) {
        await db.user.update({
          where: { id: user.id },
          data: { image: avatar_url },
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
            image: avatar_url,
            role: "COMPANY_CUSTOMER",
            plan: "COMPANY_CUSTOMER",
            authMethod: "oauth",
            emailVerified: new Date(),
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
        // No welcome email for storefront customers
      } else {
        // ROOT PLATFORM CONTEXT: Create ERP_CUSTOMER with GUEST plan
        // They will need to select a plan before accessing the dashboard
        // If using placeholder email, they'll also need to update their email
        user = await db.user.create({
          data: {
            email,
            name: name || email.split("@")[0],
            image: avatar_url,
            role: "ERP_CUSTOMER",
            plan: "GUEST", // Set to GUEST so they're forced to select a plan
            authMethod: "oauth",
            emailVerified: new Date(), // GitHub emails are verified
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
    }

    // Store or update OAuth account information
    if (user && profile.id) {
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "github",
            providerAccountId: String(profile.id),
          },
        },
        create: {
          userId: user.id,
          type: "oauth",
          provider: "github",
          providerAccountId: String(profile.id),
          access_token: accessToken,
          email: email,
          displayName: profile.login || name,
          avatarUrl: avatar_url,
        },
        update: {
          access_token: accessToken,
          email: email,
          displayName: profile.login || name,
          avatarUrl: avatar_url,
        },
      });

      // Track login method for analytics
      await trackLoginMethod(user.id, "github", String(profile.id), {
        email: email,
        displayName: profile.login || name,
        profileUrl: profile.html_url,
        avatarUrl: avatar_url,
        access_token: accessToken,
      });
    }

    // If MFA is enabled, redirect to MFA challenge without creating a session
    if (user.mfaEnabled) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      const pendingToken = createPendingMfaToken(user.id, user.email, "github");
      return buildMfaRedirectResponse(appUrl, pendingToken, "github");
    }

    // Create session token
    const session = await createSession({
      userId: user.id,
      userAgent: request.headers.get("user-agent") || undefined,
      request,
    });

    // Determine redirect URL
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
    console.error("Error in GitHub OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
