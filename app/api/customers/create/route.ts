import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { validateSession } from "@/lib/session-manager";

const customerCreateSchema = z.object({
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
    .max(100, "Password must be less than 100 characters"),
  companyId: z.string().min(1, "Company selection is required"),
  role: z.string().optional().default("COMPANY_CUSTOMER"),
  address: z
    .object({
      addressLine1: z.string().optional(),
      addressLine2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      countryCode: z.string().optional(),
      postalCode: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;
    const user = validation.user;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only certain roles can create customers
    const allowedRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate and sanitize with Zod
    const validationResult = customerCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: "Validation failed",
          errors,
          message: errors[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const { name, email, password, companyId, address } = validationResult.data;

    // Verify the company exists and user has access to it
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        owner: true,
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user is owner or member of the company
    const isOwner = company.ownerId === user.id;
    const isMember = company.members.length > 0;

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the customer user
    const customer = await db.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        role: "COMPANY_CUSTOMER",
        plan: "COMPANY_CUSTOMER", // Company customers don't have subscription plans
        emailVerified: new Date(), // Auto-verify customers created by company admins
        addressLine1: address?.addressLine1,
        addressLine2: address?.addressLine2,
        city: address?.city,
        state: address?.state,
        country: address?.country,
        countryCode: address?.countryCode,
        postalCode: address?.postalCode,
        latitude: address?.latitude,
        longitude: address?.longitude,
      },
    });

    // Create company membership for the customer
    await db.companyMember.create({
      data: {
        userId: customer.id,
        companyId: companyId,
        role: "STAFF", // Default company role for customers
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE_CUSTOMER",
        entityType: "User",
        entityId: customer.id,
        description: `Created customer: ${customer.name} (${customer.email})`,
        metadata: JSON.stringify({
          customerName: customer.name,
          customerEmail: customer.email,
          customerId: customer.id,
          companyId: companyId,
          companyName: company.name,
        }),
        companyId: companyId,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        companyId: companyId,
        createdAt: customer.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
