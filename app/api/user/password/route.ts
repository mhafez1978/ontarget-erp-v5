import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validateSessionForAPI } from "@/lib/validate-session";

// Zod schema for password update
const updatePasswordSchema = z.object({
  currentPassword: z.string().optional(), // Optional if user has no password (OAuth only)
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// PATCH /api/user/password
// Update user's password and handle authMethod transition
export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;

    const body = await request.json();

    // Validate input
    const validationResult = updatePasswordSchema.safeParse(body);

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

    const { currentPassword, newPassword } = validationResult.data;

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        authMethod: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has a password, verify current password
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Determine new authMethod
    let newAuthMethod = user.authMethod;

    if (user.authMethod === "oauth" && !user.password) {
      // User was OAuth only, now setting password → transition to 'both'
      newAuthMethod = "both";
    } else if (!user.password && user.authMethod === "credentials") {
      // Safety check: shouldn't happen, but ensure consistency
      newAuthMethod = "credentials";
    }

    // Update password and authMethod
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        authMethod: newAuthMethod,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      authMethod: newAuthMethod,
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
