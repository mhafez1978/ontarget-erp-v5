import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
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

    // Fetch Line OAuth settings
    const settings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "line" },
    });

    if (!settings || !settings.clientId || !settings.clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_config_error`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`,
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
    const idToken = tokenData.id_token;

    // Get user profile from Line API
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
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
    const { displayName, pictureUrl, userId } = profile;

    // Decode ID token to get email
    let email = null;
    if (idToken) {
      try {
        const payload = JSON.parse(
          Buffer.from(idToken.split(".")[1], "base64").toString()
        );
        email = payload.email;
      } catch (e) {
        console.error("Failed to decode ID token:", e);
      }
    }

    // If no email, use Line userId as identifier
    if (!email) {
      email = `line_${userId}@line.oauth`;
    }

    const name = displayName;
    const picture = pictureUrl;

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
          name: name || "Line User",
          image: picture,
          role: "ERP_CUSTOMER",
          plan: "GUEST", // Set to GUEST so they're forced to select a plan
          authMethod: "oauth",
          emailVerified: new Date(), // Line is verified
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
    console.error("Error in Line OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
