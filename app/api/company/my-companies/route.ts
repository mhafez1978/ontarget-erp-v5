import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
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

    // Get user's companies (owned + member of)
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompanies: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            email: true,
            phone: true,
            website: true,
            createdAt: true,
          },
        },
        companyMemberships: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                description: true,
                logo: true,
                email: true,
                phone: true,
                website: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Combine owned and member companies (remove duplicates)
    const companyMap = new Map();

    // Add owned companies
    user.ownedCompanies.forEach((company) => {
      companyMap.set(company.id, { ...company, isOwner: true });
    });

    // Add member companies
    user.companyMemberships.forEach((membership) => {
      if (!companyMap.has(membership.company.id)) {
        companyMap.set(membership.company.id, {
          ...membership.company,
          isOwner: false,
        });
      }
    });

    const companies = Array.from(companyMap.values());

    return NextResponse.json({
      count: companies.length,
      companies: companies,
      plan: user.plan,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
