import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import speakeasy from "speakeasy";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, isBackupCode } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: "User ID and token required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        mfaSecret: true,
        mfaEnabled: true,
        mfaBackupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: "MFA not enabled for this user" },
        { status: 400 }
      );
    }

    let verified = false;

    if (isBackupCode) {
      // Verify backup code
      const backupCodes = user.mfaBackupCodes as string[];

      if (!backupCodes || !Array.isArray(backupCodes)) {
        return NextResponse.json(
          { error: "No backup codes available" },
          { status: 400 }
        );
      }

      // Check if token matches any backup code
      for (let i = 0; i < backupCodes.length; i++) {
        const matches = await bcrypt.compare(token, backupCodes[i]);
        if (matches) {
          verified = true;
          // Remove used backup code
          backupCodes.splice(i, 1);
          await db.user.update({
            where: { id: user.id },
            data: { mfaBackupCodes: backupCodes },
          });
          break;
        }
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: token,
        window: 2, // Allow 2 steps before/after for clock skew
      });
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "MFA verification successful",
    });
  } catch (error) {
    console.error("[MFA Validate] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate MFA code" },
      { status: 500 }
    );
  }
}
