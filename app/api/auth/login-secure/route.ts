import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";
import { createPendingMfaToken, PENDING_COOKIE } from "@/lib/mfa-pending";

// Zod schema for login validation
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Get geo-location data first
    let geoData = null;
    let ipAddress = "127.0.0.1";

    try {
      const geoResponse = await fetch(
        `${request.nextUrl.origin}/api/get-location`,
        {
          headers: {
            "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
            "x-real-ip": request.headers.get("x-real-ip") || "",
          },
        }
      );
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
        ipAddress = geoData?.ip || "127.0.0.1";
      }
    } catch (error) {
      console.error("[LOGIN] Error fetching geolocation:", error);
      // Continue without geo data
    }

    // STEP 1: Check if IP is blacklisted
    try {
      const blacklistCheck = await fetch(
        `${request.nextUrl.origin}/api/security/check-ip?ip=${ipAddress}`,
        { cache: "no-store" }
      );

      if (blacklistCheck.ok) {
        const blacklistData = await blacklistCheck.json();

        if (blacklistData.blocked) {
          // IP is blocked - deny access immediately
          return NextResponse.json(
            {
              error: blacklistData.isPermanent
                ? "Your IP has been permanently blocked due to security concerns. Please contact support."
                : `Your IP has been temporarily blocked due to multiple failed login attempts. Please try again after ${new Date(
                    blacklistData.blockedUntil
                  ).toLocaleString()}.`,
              blocked: true,
              blockedUntil: blacklistData.blockedUntil,
              isPermanent: blacklistData.isPermanent,
            },
            { status: 403 }
          );
        }
      }
    } catch (error) {
      console.error("[LOGIN] Error checking IP blacklist:", error);
      // Continue login attempt if blacklist check fails
    }

    const body = await request.json();

    // STEP 2: Validate input
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // STEP 3: Find user
    let user;
    try {
      user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          emailVerified: true,
          mfaEnabled: true,
          mfaSecret: true,
          authMethod: true,
          isActive: true,
        },
      });
    } catch (error) {
      console.error("[LOGIN] Database error finding user:", error);
      return NextResponse.json(
        { error: "Database connection failed. Please try again." },
        { status: 500 }
      );
    }

    if (!user || !user.password) {
      // STEP 4a: Log failed attempt (user doesn't exist)
      try {
        await fetch(`${request.nextUrl.origin}/api/security/failed-attempts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            ipAddress,
            geoData,
            userAgent: request.headers.get("user-agent"),
          }),
        });
      } catch (error) {
        console.error("[LOGIN] Error logging failed attempt:", error);
      }

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // STEP 3.5: Check if account is disabled
    if (!user.isActive) {
      return NextResponse.json(
        {
          error:
            "Your account has been disabled. Please contact support for assistance.",
        },
        { status: 403 }
      );
    }

    // STEP 3.6: Check if user is OAuth-only
    if (user.authMethod === "oauth" && user.password) {
      return NextResponse.json(
        {
          error:
            "Please continue with Google or Microsoft login. This account was created using OAuth authentication.",
        },
        { status: 401 }
      );
    }

    // STEP 4: Verify password
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error("[LOGIN] Password comparison error:", error);
      return NextResponse.json(
        { error: "Authentication failed. Please try again." },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      // STEP 4b: Log failed attempt (wrong password)
      try {
        await fetch(`${request.nextUrl.origin}/api/security/failed-attempts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            ipAddress,
            geoData,
            userAgent: request.headers.get("user-agent"),
          }),
        });
      } catch (error) {
        console.error("[LOGIN] Error logging failed attempt:", error);
      }

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // STEP 4.5: Check if email is verified (skip for SUPER_ADMIN as safety net)
    if (!user.emailVerified && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error:
            "Please verify your email address before logging in. Check your inbox for the verification link.",
          emailNotVerified: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // STEP 5: Success! Clear any recent failed attempts for this IP/email
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await db.failedLoginAttempt.deleteMany({
        where: {
          email,
          ipAddress,
          attemptedAt: {
            gte: oneHourAgo,
          },
        },
      });
    } catch (error) {
      console.error("[LOGIN] Error clearing failed attempts:", error);
      // Continue with login even if this fails
    }

    // STEP 6: If MFA is enabled, issue pending token and require MFA before session
    if (user.mfaEnabled && user.mfaSecret) {
      const pendingToken = createPendingMfaToken(
        user.id,
        user.email,
        "credentials"
      );

      const mfaResponse = NextResponse.json({
        mfaRequired: true,
        redirect: "/login/mfa",
      });

      mfaResponse.cookies.set(PENDING_COOKIE, pendingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 5, // 5 minutes
        path: "/",
      });

      return mfaResponse;
    }

    // STEP 7: Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    try {
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
    } catch (error) {
      console.error("[LOGIN] Error creating session:", error);
      return NextResponse.json(
        { error: "Failed to create session. Please try again." },
        { status: 500 }
      );
    }

    // STEP 8: Update user's last login info
    try {
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
    } catch (error) {
      console.error("[LOGIN] Error updating last login info:", error);
      // Continue - non-critical
    }

    // STEP 9: Log successful login to audit
    try {
      await createAuditLog({
        userId: user.id,
        action: "USER_LOGIN_SUCCESS",
        description: `User ${user.email} logged in successfully`,
        ipAddress: geoData?.ip || null,
        city: geoData?.city || null,
        state: geoData?.region || null,
        country: geoData?.country_name || null,
        countryFlag: geoData?.flag || null,
        metadata: {
          email: user.email,
          role: user.role,
          location: geoData
            ? `${geoData.city}, ${geoData.region}, ${geoData.country_name}`
            : "Unknown",
        },
      });
    } catch (error) {
      console.error("[LOGIN] Error creating audit log:", error);
      // Continue - non-critical
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    // STEP 10: Create response with user data
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
    });

    // Set secure session token cookie
    response.cookies.set("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[LOGIN] Secure login error:", error);

    // Provide more specific error information in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json(
        {
          error: "Failed to login",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
