import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session-manager";
import {
  PENDING_COOKIE,
  clearPendingMfaCookie,
  verifyPendingMfaToken,
} from "@/lib/mfa-pending";

export async function POST(request: NextRequest) {
  try {
    const pendingToken = request.cookies.get(PENDING_COOKIE)?.value;
    const payload = verifyPendingMfaToken(pendingToken);

    if (!payload) {
      return NextResponse.json(
        { error: "MFA challenge not found or expired" },
        { status: 401 }
      );
    }

    const body = await request.json();
    // Accept either `code` or legacy `token` field
    const rawCode = body.code || body.token;
    const { isBackupCode, userId: clientUserId } = body;

    if (!rawCode) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Optional: defend against userId tampering by comparing to payload
    if (clientUserId && clientUserId !== payload.userId) {
      return NextResponse.json(
        { error: "User mismatch for MFA challenge" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        mfaEnabled: true,
        mfaSecret: true,
        mfaBackupCodes: true,
        email: true,
        role: true,
      },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json(
        { error: "MFA not enabled for this user" },
        { status: 400 }
      );
    }

    let verified = false;

    if (isBackupCode) {
      const backupCodes = (user.mfaBackupCodes as string[]) || [];
      for (let i = 0; i < backupCodes.length; i++) {
        const matches = await bcrypt.compare(rawCode, backupCodes[i]);
        if (matches) {
          verified = true;
          backupCodes.splice(i, 1);
          await db.user.update({
            where: { id: user.id },
            data: { mfaBackupCodes: backupCodes },
          });
          break;
        }
      }
    } else {
      verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: rawCode,
        window: 2,
      });
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Create a real session now that MFA passed
    const session = await createSession({
      userId: user.id,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const response = NextResponse.json({
      success: true,
      redirect: "/dashboard",
    });

    response.cookies.set("sessionToken", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    clearPendingMfaCookie(response);

    return response;
  } catch (error) {
    console.error("[MFA Login] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify MFA code" },
      { status: 500 }
    );
  }
}
