import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { trackLoginMethod } from "@/lib/account-tracking";
import { createSession } from "@/lib/session-manager";
import { sendEmail, getWelcomeCustomerEmail } from "@/lib/email-service";

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

    // Fetch Yandex OAuth settings
    const settings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "yandex" },
    });

    if (!settings || !settings.clientId || !settings.clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_config_error`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth.yandex.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
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

    // Get user profile from Yandex API
    const profileResponse = await fetch("https://login.yandex.ru/info", {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      console.error("Profile fetch failed:", await profileResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_profile_failed`
      );
    }

    const profile = await profileResponse.json();
    const { default_email, real_name, default_avatar_id } = profile;
    const email = default_email;
    const name = real_name;
    const picture = default_avatar_id
      ? `https://avatars.yandex.net/get-yapic/${default_avatar_id}/islands-200`
      : null;

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
      // They will need to select a plan before accessing the dashboard
      user = await db.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          image: picture,
          role: "ERP_CUSTOMER",
          plan: "GUEST", // Set to GUEST so they're forced to select a plan
          authMethod: "oauth",
          emailVerified: new Date(), // Yandex emails are verified
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
    if (user && profile.id) {
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "yandex",
            providerAccountId: String(profile.id),
          },
        },
        create: {
          userId: user.id,
          type: "oauth",
          provider: "yandex",
          providerAccountId: String(profile.id),
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
      await trackLoginMethod(user.id, "yandex", String(profile.id), {
        email: email,
        displayName: name,
        avatarUrl: picture,
        access_token: accessToken,
      });
    }

    // Create session using session manager
    const cookieStore = await cookies();
    const session = await createSession({ userId: user.id });

    cookieStore.set("sessionToken", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

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
    console.error("Error in Yandex OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
