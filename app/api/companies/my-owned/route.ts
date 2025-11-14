import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { PLAN_LIMITS } from "@/lib/plan-limits";

export async function GET() {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with plan info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch companies owned by this specific user
    const companies = await db.company.findMany({
      where: {
        ownerId: userId,
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
      description: company.description,
      logo: company.logo,
      memberCount: company._count.members,
      createdAt: company.createdAt,
    }));

    const companyCount = formattedCompanies.length;
    const limit = PLAN_LIMITS[user.plan].companies;
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
