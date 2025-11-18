import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;

    // Get user with plan and companies
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        ownedCompanies: true,
        companyMemberships: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current company count (needed for audit log and plan checks)
    const currentCompanyCount = user.ownedCompanies.length;

    // Check plan limits (SUPER_ADMIN bypasses limits)
    if (user.role !== "SUPER_ADMIN") {
      const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
      const companyLimit = planLimits?.companies ?? 0;

      if (currentCompanyCount >= companyLimit) {
        return NextResponse.json(
          {
            error: `Company limit reached for ${
              user.plan
            } plan. Current: ${currentCompanyCount}, Limit: ${
              companyLimit === Infinity ? "Unlimited" : companyLimit
            }`,
          },
          { status: 403 }
        );
      }
    }

    // Parse request body
    const body = await request.json();
    const { name, slogan, description, phone, email, website, address } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Get geo-location for audit log
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

    // Create company and update user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: name.trim(),
          slogan: slogan?.trim() || null,
          description: description?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          website: website?.trim() || null,
          ownerId: userId,
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

      // Add user as ADMIN member
      await tx.companyMember.create({
        data: {
          userId: userId,
          companyId: company.id,
          role: "ADMIN",
        },
      });

      // Add user as ADMIN staff (for employee pane)
      await tx.companyStaff.create({
        data: {
          userId: userId,
          companyId: company.id,
          role: "ADMIN",
          jobTitle: "MANAGER_ROLE",
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          hireDate: new Date(),
          city: address?.city || geoData?.city || null,
          state: address?.state || geoData?.region || null,
          country: address?.country || geoData?.country_name || null,
          countryCode: address?.countryCode || geoData?.country_code || null,
        },
      });

      // Promote user to ADMIN role if they're ERP_CUSTOMER
      if (user.role === "ERP_CUSTOMER") {
        await tx.user.update({
          where: { id: userId },
          data: { role: "ADMIN" },
        });
      }

      // Get or create root company (OnTarget ERP)
      let rootCompany = await tx.company.findFirst({
        where: { isRoot: true },
      });

      if (!rootCompany) {
        // Create root company if it doesn't exist
        rootCompany = await tx.company.create({
          data: {
            name: "OnTarget ERP",
            description: "OnTarget ERP SaaS Platform",
            isRoot: true,
            ownerId: userId, // Temporary owner, should be SUPER_ADMIN
          },
        });
      }

      // Create subscription record for this company with user's plan
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30-day trial

      await tx.subscription.create({
        data: {
          rootCompanyId: rootCompany.id,
          subscriberCompanyId: company.id,
          plan: user.plan, // Use user's plan for company subscription
          status: "TRIAL",
          trialEndsAt,
        },
      });

      return { company };
    });

    // Get updated user info
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Create audit logs (outside transaction to not fail the main operation)
    try {
      // Create single audit log for company creation
      await createAuditLog({
        action: AUDIT_ACTIONS.COMPANY_CREATED,
        userId: userId,
        companyId: result.company.id,
        entityType: ENTITY_TYPES.COMPANY,
        entityId: result.company.id,
        description: `Company "${result.company.name}" was created`,
        metadata: {
          companyName: result.company.name,
          userEmail: user.email,
          userRole: updatedUser?.role || user.role,
          plan: user.plan,
          companyCount: currentCompanyCount + 1,
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
      // Don't fail the company creation if audit logging fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Company created successfully",
        company: result.company,
        user: updatedUser || {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Company creation error:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
