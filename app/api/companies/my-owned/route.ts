import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = validation.user.id;

    // Get user with plan info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch ONLY companies owned by this user (regardless of role)
    // "My Personal Companies" means companies I own, not all companies in system
    const companies = await db.company.findMany({
      where: {
        ownerId: userId, // Everyone sees only companies they own
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedCompanies = companies.map((company) => ({
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
      memberCount: company._count.members,
      createdAt: company.createdAt,
    }));

    const companyCount = formattedCompanies.length;

    // Get plan limits
    // SUPER_USER plan has unlimited companies (like ENTERPRISE)
    const planLimits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
    const limit = planLimits?.companies ?? 0;
    const canCreateMore = companyCount < limit;

    return NextResponse.json({
      success: true,
      companies: formattedCompanies,
      count: formattedCompanies.length,
      userPlan: {
        plan: user.plan,
        companyCount,
        canCreateMore,
        limit: limit === Infinity ? "Unlimited" : limit,
      },
    });
  } catch (error) {
    console.error("Error fetching owned companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch owned companies" },
      { status: 500 }
    );
  }
}
