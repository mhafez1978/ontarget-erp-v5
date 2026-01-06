import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, systemName, companyName, companySlogan } =
      body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const sanitizedPassword = typeof password === "string" ? password : "";
    const trimmedCompanyName =
      typeof companyName === "string" ? companyName.trim() : "";
    const sanitizedSystemName =
      typeof systemName === "string" && systemName.trim().length > 0
        ? systemName.trim()
        : "OnTarget ERP";
    const sanitizedCompanySlogan =
      typeof companySlogan === "string" ? companySlogan.trim() : "";

    // Validate required fields
    if (
      !trimmedName ||
      !normalizedEmail ||
      !sanitizedPassword ||
      !trimmedCompanyName
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Check if SUPER_ADMIN already exists
    const existingSuperAdmin = await db.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
      },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: "System already initialized" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(sanitizedPassword, 10);

    // Create SUPER_ADMIN user and root company in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the SUPER_ADMIN user
      const user = await tx.user.create({
        data: {
          name: trimmedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "SUPER_ADMIN",
          plan: "SUPER_USER", // Super admins get free unlimited SUPER_USER plan
          emailVerified: new Date(), // Auto-verify super admin
        },
      });

      // Create the root company (OnTarget ERP - the SaaS provider)
      const company = await tx.company.create({
        data: {
          name: trimmedCompanyName,
          slogan: sanitizedCompanySlogan || "People Driven & AI Insight",
          description: `Welcome to ${trimmedCompanyName}`,
          ownerId: user.id,
          isRoot: true, // Mark as root company
        },
      });

      // Add the super admin as a company member with ADMIN role
      await tx.companyMember.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "ADMIN",
        },
      });

      // Add the super admin as a company staff member (employee)
      // Super admin is also an employee of the root company and needs to get paid
      await tx.companyStaff.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "ADMIN",
          jobTitle: "MANAGER_ROLE",
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          hireDate: new Date(),
        },
      });

      // Initialize geo tracking settings (enabled by default with free IP-API provider)
      await tx.geoTrackingSetting.create({
        data: {
          enabled: true,
          provider: "IP_API", // Free provider, no API key needed
        },
      });

      return { user, company };
    });

    // Get user's geolocation
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

    // Create a session record
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.session.create({
      data: {
        sessionToken,
        userId: result.user.id,
        expires: expiresAt,
        sessionIpAddress: geoData?.ip || null,
        sessionIpv4: geoData?.ipv4 || null,
        sessionIpv6: geoData?.ipv6 || null,
        sessionCity: geoData?.city || null,
        sessionState: geoData?.region || null,
        sessionCountry: geoData?.country_name || null,
        sessionCountryFlag: geoData?.flag || null,
      },
    });

    // Update user's captured location info
    await db.user.update({
      where: { id: result.user.id },
      data: {
        capturedIpAddress: geoData?.ip || null,
        capturedCity: geoData?.city || null,
        capturedState: geoData?.region || null,
        capturedCountry: geoData?.country || null,
        capturedCountryFlag: geoData?.flag || null,
        lastLoginAt: new Date(),
        lastLoginIpAddress: geoData?.ip || null,
        lastLoginCity: geoData?.city || null,
        lastLoginState: geoData?.region || null,
        lastLoginCountry: geoData?.country || null,
        lastLoginCountryFlag: geoData?.flag || null,
      },
    });

    // Create audit logs for system initialization
    try {
      // First event: System is now live!
      await createAuditLog({
        action: "SYSTEM_SETUP_COMPLETED",
        userId: result.user.id,
        companyId: result.company.id,
        description: `${sanitizedSystemName} is now live!`,
        ipAddress: geoData?.ip || null,
        ipv4: geoData?.ipv4 || null,
        ipv6: geoData?.ipv6 || null,
        city: geoData?.city || null,
        state: geoData?.region || null,
        country: geoData?.country_name || null,
        countryFlag: geoData?.flag || null,
      });

      // Second event: SUPER_ADMIN account created
      await createAuditLog({
        action: AUDIT_ACTIONS.SUPER_ADMIN_CREATED,
        userId: result.user.id,
        companyId: result.company.id,
        description: "SUPER_ADMIN account was created",
        metadata: {
          userRole: "SUPER_ADMIN",
          userName: trimmedName,
          userEmail: normalizedEmail,
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
      console.error("Failed to create audit logs:", auditError);
      // Don't fail the setup if audit logging fails
    }

    // Return success without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = result.user;

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "System initialized successfully",
        user: userWithoutPassword,
        company: result.company,
      },
      { status: 201 }
    );

    // Set secure session token cookie for auto-login
    response.cookies.set("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Error initializing system:", error);
    return NextResponse.json(
      { error: "Failed to initialize system" },
      { status: 500 }
    );
  }
}
