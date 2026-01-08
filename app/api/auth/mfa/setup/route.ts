import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user } = validation;

    // Get full user details including MFA status
    const userDetails = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, mfaEnabled: true },
    });

    if (!userDetails || !userDetails.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (userDetails.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is already enabled" },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `OnTarget ERP (${userDetails.email})`,
      issuer: "OnTarget ERP",
      length: 32,
    });

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10))
    );

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || "");

    // Store secret and backup codes temporarily (not enabled yet)
    // We'll store them in a temporary field and only enable after verification
    await db.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: secret.base32, // Store the secret
        mfaBackupCodes: hashedBackupCodes, // Store hashed backup codes
        mfaEnabled: false, // Not enabled until verified
      },
    });

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes: backupCodes, // Send plain codes to user (display once!)
      otpauthUrl: secret.otpauth_url,
    });
  } catch (error) {
    console.error("[MFA Setup] Error:", error);
    return NextResponse.json({ error: "Failed to setup MFA" }, { status: 500 });
  }
}
