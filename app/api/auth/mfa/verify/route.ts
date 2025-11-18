import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import speakeasy from "speakeasy";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Verification code required" },
        { status: 400 }
      );
    }

    const userDetails = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, mfaSecret: true, mfaEnabled: true },
    });

    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userDetails.mfaSecret) {
      return NextResponse.json(
        { error: "MFA not setup. Please setup MFA first." },
        { status: 400 }
      );
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: userDetails.mfaSecret,
      encoding: "base32",
      token: token,
      window: 2, // Allow 2 steps before/after current time for clock skew
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Enable MFA
    await db.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
        mfaSetupAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "MFA enabled successfully",
    });
  } catch (error) {
    console.error("[MFA Verify] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify MFA code" },
      { status: 500 }
    );
  }
}
