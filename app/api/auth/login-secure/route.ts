import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";

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
      console.error("Error fetching geolocation:", error);
    }

    // STEP 1: Check if IP is blacklisted
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
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user || !user.password) {
      // STEP 4a: Log failed attempt (user doesn't exist)
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

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // STEP 4: Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // STEP 4b: Log failed attempt (wrong password)
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

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // STEP 5: Success! Clear any recent failed attempts for this IP/email
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

    // STEP 6: Create session
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

    // STEP 7: Update user's last login info
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

    // STEP 8: Log successful login to audit
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

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
    });

    // Set cookie with user ID
    response.cookies.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Secure login error:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
