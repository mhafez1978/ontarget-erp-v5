import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import { sendEmail, getWelcomeCustomerEmailHtml } from "@/lib/email-service";

// Zod schema for registration validation
const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  plan: z
    .enum(["ESSENTIAL", "GROWTH", "ENTERPRISE"])
    .optional()
    .default("ESSENTIAL"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and sanitize input with Zod
    const validationResult = registerSchema.safeParse(body);

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

    const { name, email, password, plan } = validationResult.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token (expires in 10 minutes)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Calculate trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Create user (emailVerified = null until verified)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ERP_CUSTOMER", // Default role
        plan: plan,
        trialEndsAt: trialEndsAt,
        verificationToken,
        verificationTokenExpires,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        createdAt: true,
      },
    });

    // Get user's geolocation for audit log
    let geoData = null;
    try {
      const geoResponse = await fetch(
        `${request.nextUrl.origin}/api/get-location`,
        {
          headers: {
            "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
            "x-real-ip": request.headers.get("x-real-ip") || "",
          },
        }
      );
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
      }
    } catch (error) {
      console.error("Error fetching geolocation:", error);
    }

    // Create audit log for user registration
    try {
      await createAuditLog({
        action: AUDIT_ACTIONS.ERP_CUSTOMER_REGISTERED,
        userId: user.id,
        companyId: null, // No company association yet
        description: `New OnTarget ERP customer registered: ${name}`,
        metadata: {
          userRole: "ERP_CUSTOMER",
          userName: name,
          userEmail: email,
          plan: plan,
        },
        ipAddress: geoData?.ip || null,
        ipv4: geoData?.ipv4 || null,
        ipv6: geoData?.ipv6 || null,
        city: geoData?.city || null,
        state: geoData?.region || null,
        country: geoData?.country_name || null,
        countryFlag: geoData?.flag || null,
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
      // Don't fail registration if audit logging fails
    }

    // Send welcome email to new customer
    try {
      const html = getWelcomeCustomerEmailHtml(user.name || email, email);
      await sendEmail({
        to: email,
        subject: "Welcome to OnTarget ERP - Let's Get Started!",
        html,
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }

    // Send verification email with token link
    try {
      const verificationLink = `${request.nextUrl.origin}/api/auth/verify-email?token=${verificationToken}`;
      const verificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Please verify your email address to complete your registration and access OnTarget ERP.</p>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email Address</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationLink}</p>
          <p style="color: #999; font-size: 14px; margin-top: 30px;"><strong>This link will expire in 10 minutes.</strong></p>
          <p style="color: #999; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: "Verify Your Email - OnTarget ERP",
        html: verificationHtml,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails, but user won't be able to login
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully. Please check your email to verify your account.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
