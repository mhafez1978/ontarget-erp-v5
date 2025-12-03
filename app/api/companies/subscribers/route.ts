import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

/**
 * GET /api/companies/subscribers
 *
 * Returns all subscriber companies (paying ERP customers)
 * - Companies with ESSENTIAL, GROWTH, or ENTERPRISE plans
 * - Excludes companies owned by SUPER_ADMIN users
 * - Only accessible by SUPER_ADMIN role
 *
 * These are the companies that PAY for the ERP service
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. SUPER_ADMIN only." },
        { status: 403 }
      );
    }

    // Get all SUPER_ADMIN user IDs to exclude their companies
    const superAdminUsers = await db.user.findMany({
      where: {
        role: "SUPER_ADMIN",
      },
      select: {
        id: true,
      },
    });

    const superAdminIds = superAdminUsers.map((u) => u.id);

    // Fetch subscriber companies:
    // - Owned by users with ESSENTIAL, GROWTH, or ENTERPRISE plans (paying customers)
    // - Exclude companies owned by SUPER_ADMIN users
    const subscriberCompanies = await db.company.findMany({
      where: {
        ownerId: {
          notIn: superAdminIds, // Exclude SUPER_ADMIN companies
        },
        owner: {
          plan: {
            in: ["ESSENTIAL", "GROWTH", "ENTERPRISE"], // Only paying plans
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            members: true,
            staff: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedCompanies = subscriberCompanies.map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      slogan: company.slogan,
      description: company.description,
      logo: company.logo,
      email: company.email,
      phone: company.phone,
      website: company.website,
      addressLine1: company.addressLine1,
      addressLine2: company.addressLine2,
      city: company.city,
      state: company.state,
      country: company.country,
      countryCode: company.countryCode,
      postalCode: company.postalCode,
      owner: {
        id: company.owner.id,
        name: company.owner.name,
        email: company.owner.email,
        plan: company.owner.plan,
        role: company.owner.role,
        joinedAt: company.owner.createdAt,
      },
      memberCount: company._count.members,
      staffCount: company._count.staff,
      createdAt: company.createdAt,
    }));

    // Group by plan for statistics
    const stats = {
      total: formattedCompanies.length,
      byPlan: {
        ESSENTIAL: formattedCompanies.filter(
          (c) => c.owner.plan === "ESSENTIAL"
        ).length,
        GROWTH: formattedCompanies.filter((c) => c.owner.plan === "GROWTH")
          .length,
        ENTERPRISE: formattedCompanies.filter(
          (c) => c.owner.plan === "ENTERPRISE"
        ).length,
      },
      totalMembers: formattedCompanies.reduce(
        (sum, c) => sum + c.memberCount,
        0
      ),
      totalStaff: formattedCompanies.reduce((sum, c) => sum + c.staffCount, 0),
    };

    return NextResponse.json({
      success: true,
      companies: formattedCompanies,
      stats,
    });
  } catch (error) {
    console.error("Error fetching subscriber companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriber companies" },
      { status: 500 }
    );
  }
}
