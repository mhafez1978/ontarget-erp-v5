import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { z } from "zod";

// Zod schema for forgot password validation
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and sanitize input with Zod
    const validationResult = forgotPasswordSchema.safeParse(body);

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

    const { email } = validationResult.data;

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we return success message
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Delete any existing unused reset tokens for this user
    await db.passwordReset.deleteMany({
      where: {
        userId: user.id,
        used: false,
      },
    });

    // Create new password reset token
    await db.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expires: expiresAt,
      },
    });

    // TODO: In production, send email with reset link
    // For now, we'll just return the token (development only)
    // const resetUrl = `${request.nextUrl.origin}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(user.email, resetUrl);

    console.log("Password reset token for", email, ":", resetToken);
    console.log(
      "Reset URL:",
      `${request.nextUrl.origin}/reset-password?token=${resetToken}`
    );

    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
      // Only include token in development
      ...(process.env.NODE_ENV === "development" && { token: resetToken }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
