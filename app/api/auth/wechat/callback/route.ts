import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { createSession } from "@/lib/session-manager";
import { sendEmail, getWelcomeCustomerEmailHtml } from "@/lib/email-service";

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

    // Fetch WeChat OAuth settings
    const settings = await db.oAuthProviderSetting.findUnique({
      where: { provider: "wechat" },
    });

    if (!settings || !settings.clientId || !settings.clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_config_error`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${settings.clientId}&secret=${settings.clientSecret}&code=${code}&grant_type=authorization_code`
    );

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_token_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, openid } = tokenData;

    if (!access_token || !openid) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_token_failed`
      );
    }

    // Get user profile from WeChat API
    const profileResponse = await fetch(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`
    );

    if (!profileResponse.ok) {
      console.error("Profile fetch failed:", await profileResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_profile_failed`
      );
    }

    const profile = await profileResponse.json();
    const { nickname, headimgurl, unionid } = profile;

    // WeChat doesn't provide email, use unionid as unique identifier
    // Create a synthetic email for WeChat users
    const email = `wechat_${unionid || openid}@wechat.oauth`;
    const name = nickname;
    const picture = headimgurl;

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
          name: name || `WeChat User`,
          image: picture,
          role: "ERP_CUSTOMER",
          plan: "GUEST", // Set to GUEST so they're forced to select a plan
          authMethod: "oauth",
          emailVerified: new Date(), // WeChat is verified
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
        const html = getWelcomeCustomerEmailHtml(user.name || email, email);
        await sendEmail({
          to: email,
          subject: "Welcome to OnTarget ERP - Let's Get Started!",
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
    console.error("Error in WeChat OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`
    );
  }
}
