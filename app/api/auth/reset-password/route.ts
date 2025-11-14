import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

// Zod schema for reset password validation
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and sanitize input with Zod
    const validationResult = resetPasswordSchema.safeParse(body);

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

    const { token, password } = validationResult.data;

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid reset token
    const passwordReset = await db.passwordReset.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expires: {
          gt: new Date(), // Token not expired
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and mark token as used
    await db.$transaction([
      db.user.update({
        where: { id: passwordReset.userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }),
      db.passwordReset.update({
        where: { id: passwordReset.id },
        data: {
          used: true,
        },
      }),
    ]);

    // Delete all other reset tokens for this user
    await db.passwordReset.deleteMany({
      where: {
        userId: passwordReset.userId,
        id: {
          not: passwordReset.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
