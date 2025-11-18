import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { z } from "zod";

const sendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = sendVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user || !user.email) {
      // Don't reveal whether user exists (security best practice)
      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      );
    }

    // Generate verification token (expires in 10 minutes)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Save token to database
    await db.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires: tokenExpires,
      },
    });

    // Create verification URL
    const verificationUrl = `${request.nextUrl.origin}/api/auth/verify-email?token=${verificationToken}`;

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
      subject: "Verify Your Email - OnTarget ERP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Please verify your email address to complete your registration and access OnTarget ERP.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Verify Email Address
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
            <p style="color: #dc2626; font-weight: 600; margin-bottom: 10px;">⏱️ This link will expire in 10 minutes.</p>
            <p style="color: #999; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("[Send Verification Public] Error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
