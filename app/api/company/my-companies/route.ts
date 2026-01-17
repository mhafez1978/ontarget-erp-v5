import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
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

    // Policy: return companies depending on user role
    // - SUPER_ADMIN: only companies they OWN (including root company)
    // - ADMIN_OWNER: owned companies + member companies (deduplicated)
    // - ADMIN_NONOWNER: only member companies
    // - COMPANY_MANAGER / COMPANY_STAFF / others: only member companies

    let companies: Array<any> = [];

    if (user.role === "SUPER_ADMIN") {
      // SUPER_ADMIN: return all companies so they can manage timesheets across the platform
      const allCompanies = await db.company.findMany({
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
      });

      // Mark owned companies accordingly
      const ownedSet = new Set(user.ownedCompanies.map((c) => c.id));
      companies = allCompanies.map((c) => ({
        ...c,
        isOwner: ownedSet.has(c.id),
      }));
    } else if (user.role === "ADMIN_OWNER") {
      const companyMap = new Map<string, any>();

      user.ownedCompanies.forEach((company) => {
        companyMap.set(company.id, { ...company, isOwner: true });
      });

      user.companyMemberships.forEach((membership) => {
        if (!companyMap.has(membership.company.id)) {
          companyMap.set(membership.company.id, {
            ...membership.company,
            isOwner: false,
          });
        }
      });

      companies = Array.from(companyMap.values());
    } else {
      // For ADMIN_NONOWNER /COMPANY_MANAGER / COMPANY_STAFFNY_COMPANY_STAFF / other roles only return companies they are a member of
      companies = user.companyMemberships.map((m) => ({
        ...m.company,
        isOwner: false,
      }));
    }

    return NextResponse.json({
      count: companies.length,
      companies,
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
