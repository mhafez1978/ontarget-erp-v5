import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

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

    // Calculate trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ERP_CUSTOMER", // Default role
        plan: plan,
        trialEndsAt: trialEndsAt,
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

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
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
