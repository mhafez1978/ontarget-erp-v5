import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import { createSession } from "@/lib/session-manager";

// Helper to extract client IP from request headers
function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0].trim();
    if (first) return first;
  }
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return null;
}

// Validation schema for setting password during OAuth signup
const setPasswordSchema = z.object({
  token: z.string().min(1, "Onboarding token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*]/,
      "Password must contain at least one special character (!@#$%^&*)"
    ),
  confirmPassword: z.string(),
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Valid email is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = setPasswordSchema
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
      .safeParse(body);

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

    const { token, password, name, email } = validationResult.data;

    // Find the onboarding record
    const onboarding = await db.oAuthOnboarding.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!onboarding) {
      return NextResponse.json(
        { error: "Invalid onboarding token" },
        { status: 404 }
      );
    }

    if (onboarding.isUsed) {
      return NextResponse.json(
        { error: "Onboarding already completed" },
        { status: 400 }
      );
    }

    if (new Date() > onboarding.expiresAt) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_EXPIRED,
        userId: onboarding.userId,
        description: `Expired OAuth password setup token for ${onboarding.user.email}`,
        metadata: { token },
      }).catch(console.error);

      return NextResponse.json(
        { error: "Onboarding token expired" },
        { status: 400 }
      );
    }

    // Verify email matches
    if (
      !onboarding.user.email ||
      email.toLowerCase() !== onboarding.user.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Email does not match registered email" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user and mark onboarding as used in a transaction
    // const now = new Date();
    const result = await db.$transaction(async (tx: any) => {
      // Update user with password, name, and set authMethod to 'both'
      const updatedUser = await tx.user.update({
        where: { id: onboarding.userId },
        data: {
          password: hashedPassword,
          name: name,
          authMethod: "both", // OAuth + credentials
        },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
        },
      });

      // DO NOT mark onboarding token as used yet - only mark it after plan selection
      // This allows the user to proceed to /select-plan with the same token

      return { user: updatedUser };
    });

    // Log the password setup with geo-location data
    const clientIp = getClientIp(request);
    await createAuditLog({
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      userId: result.user.id,
      entityType: "User",
      entityId: result.user.id,
      description: `Password set during OAuth onboarding for ${result.user.email}`,
      metadata: {
        email: result.user.email,
        name: result.user.name,
      },
      ipAddress: clientIp,
    }).catch(console.error);

    // Create a session for the user so they can proceed to plan selection
    const session = await createSession({ userId: result.user.id, request });

    // Return success with session cookie
    const response = NextResponse.json({
      success: true,
      message: "Password set successfully",
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      token, // Return token for next step (plan selection)
    });

    // Set session cookie
    response.cookies.set("sessionToken", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Set Password OAuth] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to set password",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
