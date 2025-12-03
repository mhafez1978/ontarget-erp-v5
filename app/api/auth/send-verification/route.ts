import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    if (!user.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already verified
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });

    if (dbUser?.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate verification token (expires in 10 minutes)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save token to database
    await db.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires: tokenExpires,
      },
    });

    // Create verification URL
    const verificationUrl = `${
      process.env.NEXTAUTH_URL || "http://localhost:3001"
    }/api/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "movewebdesign@gmail.com",
        pass: process.env.EMAIL_PASSWORD || "rdketjlbkppvcgso",
      },
    });

    await transporter.sendMail({
      from: `"OnTarget ERP" <${
        process.env.EMAIL_USER || "movewebdesign@gmail.com"
      }>`,
      to: user.email,
      subject: "Verify Your Email Address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 14px 32px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔐 Verify Your Email</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.name || "there"}!</h2>
              <p>Thank you for creating an account with OnTarget ERP. Please verify your email address to activate your account and access all features.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this URL into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                ${verificationUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 10 minutes. If you didn't create an account, please ignore this email.
              </div>
              
              <p>Need help? Contact our support team.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} OnTarget ERP. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${user.name || "there"}!

Thank you for creating an account with OnTarget ERP. Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 10 minutes.

If you didn't create an account, please ignore this email.

© ${new Date().getFullYear()} OnTarget ERP. All rights reserved.
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("[Send Verification] Error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
