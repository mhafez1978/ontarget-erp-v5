import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// This must match the constant in bulk-upload route
const GENERIC_ACCESS_CODE = "Welcome2024!";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, accessCode, newPassword } = body;

    if (!email || !accessCode || !newPassword) {
      return NextResponse.json(
        { error: "Email, access code, and new password are required" },
        { status: 400 }
      );
    }

    // Validate access code matches the generic one
    if (accessCode !== GENERIC_ACCESS_CODE) {
      return NextResponse.json(
        {
          error: "Invalid access code. Please check the code from your email.",
        },
        { status: 401 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }

    // At this point, user.password is guaranteed to be a string
    const userPassword: string = user.password;

    // Verify the access code matches the user's current temporary password
    const currentPasswordValid = await bcrypt.compare(accessCode, userPassword);

    if (!currentPasswordValid) {
      return NextResponse.json(
        {
          error:
            "Invalid access code. Please check the code from your email or contact support.",
        },
        { status: 401 }
      );
    }

    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: new Date(), // Ensure email is verified
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password set successfully",
    });
  } catch (error) {
    console.error("Setup password error:", error);
    return NextResponse.json(
      { error: "An error occurred while setting your password" },
      { status: 500 }
    );
  }
}
