import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, companyId } = body;

    // Validate required fields
    if (!name || !email || !password || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if company exists and has storefront enabled
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, isStoreEnabled: true },
    });

    if (!company || !company.isStoreEnabled) {
      return NextResponse.json(
        { error: "Company not found or storefront is not enabled" },
        { status: 404 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token (expires in 24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with COMPANY_CUSTOMER role
    // Note: COMPANY_CUSTOMER users are linked to companies through their orders and carts
    // The companyId will be stored in their order records when they make purchases
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "COMPANY_CUSTOMER",
        plan: "COMPANY_CUSTOMER", // Set plan to COMPANY_CUSTOMER as well
        verificationToken,
        verificationTokenExpires: tokenExpires,
        emailVerified: null, // Will be set when they verify
      },
    });

    // Create verification URL
    const verificationUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    }/api/auth/verify-email?token=${verificationToken}`;

    // Send verification email
    try {
      await sendEmail({
        to: email,
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
                <h2>Hello ${name}!</h2>
                <p>Thank you for creating an account with ${
                  company.name
                }. Please verify your email address to activate your account and start shopping.</p>
                
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p>Or copy and paste this URL into your browser:</p>
                <p style="word-break: break-all; background: white; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                  ${verificationUrl}
                </p>
                
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> This link will expire in 24 hours. If you didn't create an account, please ignore this email.
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} ${
          company.name
        }. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      {
        message:
          "Registration successful. Please check your email to verify your account.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
