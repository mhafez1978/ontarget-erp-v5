import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";

const subscriberCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Customer name is required")
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
    confirmPassword: z.string().min(1, "Please confirm password"),
    companyName: z
      .string()
      .trim()
      .min(1, "Company name is required")
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must be less than 100 characters"),
    plan: z.enum(["ESSENTIAL", "GROWTH", "ENTERPRISE"], {
      message: "Plan is required",
    }),
    status: z.enum(["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"], {
      message: "Status is required",
    }),
    trialDays: z
      .number()
      .min(0, "Trial days must be at least 0")
      .max(365, "Trial days cannot exceed 365"),
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const currentUser = validation.user;

    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - SUPER_ADMIN only" },
        { status: 403 }
      );
    }

    // Get the root company
    const ownedCompanies = await db.company.findMany({
      where: {
        ownerId: currentUser.id,
        isRoot: true,
      },
      select: { id: true },
    });

    const rootCompany = ownedCompanies[0];
    if (!rootCompany) {
      return NextResponse.json(
        { error: "Root company not found. Please complete setup first." },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = subscriberCreateSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      companyName,
      plan,
      status,
      trialDays,
      address,
    } = result.data;

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

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

    // Create user, company, member, and subscription in a transaction
    const result_data = await db.$transaction(async (tx) => {
      // Create the customer user with ADMIN role
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
          plan,
          trialEndsAt: trialDays > 0 ? trialEndsAt : null,
          emailVerified: new Date(), // Auto-verify
          // Add address fields if provided
          addressLine1: address?.addressLine1 || null,
          addressLine2: address?.addressLine2 || null,
          city: address?.city || null,
          state: address?.state || null,
          country: address?.country || null,
          countryCode: address?.countryCode || null,
          postalCode: address?.postalCode || null,
          latitude: address?.latitude || null,
          longitude: address?.longitude || null,
        },
      });

      // Create the subscriber company
      const company = await tx.company.create({
        data: {
          name: companyName,
          description: `${companyName} - OnTarget ERP Subscriber`,
          ownerId: user.id,
          isRoot: false, // This is a subscriber company
        },
      });

      // Add user as company member with ADMIN role
      await tx.companyMember.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "ADMIN",
        },
      });

      // Add user as company staff with ADMIN role (for employee pane)
      await tx.companyStaff.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "ADMIN",
          jobTitle: "Administrator",
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          hireDate: new Date(),
          city: address?.city || geoData?.city || null,
          state: address?.state || geoData?.region || null,
          country: address?.country || geoData?.country_name || null,
          countryCode: address?.countryCode || geoData?.country_code || null,
        },
      });

      // Create subscription record
      const subscription = await tx.subscription.create({
        data: {
          rootCompanyId: rootCompany.id,
          subscriberCompanyId: company.id,
          plan,
          status,
          trialEndsAt: trialDays > 0 ? trialEndsAt : null,
        },
      });

      return { user, company, subscription };
    });

    // Create audit log for SUPER_ADMIN
    await createAuditLog({
      action: AUDIT_ACTIONS.SUBSCRIBER_CUSTOMER_CREATED,
      userId: currentUser.id,
      companyId: result_data.company.id,
      entityType: "Subscriber",
      entityId: result_data.user.id,
      description: `Subscriber customer created: ${name} (${email}) with company ${companyName}`,
      metadata: {
        userName: name,
        userEmail: email,
        companyName,
        plan,
        status,
        trialDays,
        trialEndsAt: result_data.subscription.trialEndsAt?.toISOString(),
      },
      ipAddress: geoData?.ip || null,
      ipv4: geoData?.version === "IPv4" ? geoData?.ip : null,
      ipv6: geoData?.version === "IPv6" ? geoData?.ip : null,
      city: geoData?.city || null,
      state: geoData?.region || null,
      country: geoData?.country_name || null,
      countryFlag: geoData?.flag || null,
    });

    // Create audit log for the new subscriber customer (ADMIN)
    await createAuditLog({
      action: AUDIT_ACTIONS.COMPANY_CREATED,
      userId: result_data.user.id,
      companyId: result_data.company.id,
      entityType: "Company",
      entityId: result_data.company.id,
      description: `Company "${companyName}" created by SUPER_ADMIN`,
      metadata: {
        companyName,
        plan,
        status,
        trialDays,
        trialEndsAt: result_data.subscription.trialEndsAt?.toISOString(),
        createdBySuperAdmin: true,
      },
      ipAddress: geoData?.ip || null,
      ipv4: geoData?.version === "IPv4" ? geoData?.ip : null,
      ipv6: geoData?.version === "IPv6" ? geoData?.ip : null,
      city: geoData?.city || null,
      state: geoData?.region || null,
      country: geoData?.country_name || null,
      countryFlag: geoData?.flag || null,
    });

    return NextResponse.json({
      message: "Subscriber created successfully",
      subscriber: {
        id: result_data.user.id,
        name: result_data.user.name,
        email: result_data.user.email,
        companyId: result_data.company.id,
        companyName: result_data.company.name,
        plan: result_data.subscription.plan,
        status: result_data.subscription.status,
        trialEndsAt: result_data.subscription.trialEndsAt,
      },
    });
  } catch (error) {
    console.error("Error creating subscriber:", error);
    return NextResponse.json(
      { error: "Failed to create subscriber" },
      { status: 500 }
    );
  }
}
