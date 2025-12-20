import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { validateSessionForAPI } from "@/lib/validate-session";

// Single consolidated GET handler for /api/companies/my-owned
// Returns companies the current user can manage/see and some optional plan info
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const { user } = validation;

    let companies: any[] = [];

    // SUPER_ADMIN / ADMIN: aggregate owned, memberships, and staff companies
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      const userWithCompanies = await db.user.findUnique({
        where: { id: user.id },
        include: {
          ownedCompanies: {
            select: {
              id: true,
              name: true,
              slug: true,
              slogan: true,
              description: true,
              logo: true,
              email: true,
              salesEmail: true,
              supportEmail: true,
              phone: true,
              website: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              state: true,
              country: true,
              countryCode: true,
              postalCode: true,
              isRoot: true,
              createdAt: true,
              _count: {
                select: {
                  members: true,
                  staff: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          companyMemberships: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  slogan: true,
                  description: true,
                  logo: true,
                  email: true,
                  salesEmail: true,
                  supportEmail: true,
                  phone: true,
                  website: true,
                  addressLine1: true,
                  addressLine2: true,
                  city: true,
                  state: true,
                  country: true,
                  countryCode: true,
                  postalCode: true,
                  isRoot: true,
                  createdAt: true,
                  _count: {
                    select: {
                      members: true,
                      staff: true,
                    },
                  },
                },
              },
            },
          },
          companyStaff: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  slogan: true,
                  description: true,
                  logo: true,
                  email: true,
                  salesEmail: true,
                  supportEmail: true,
                  phone: true,
                  website: true,
                  addressLine1: true,
                  addressLine2: true,
                  city: true,
                  state: true,
                  country: true,
                  countryCode: true,
                  postalCode: true,
                  isRoot: true,
                  createdAt: true,
                  _count: {
                    select: {
                      members: true,
                      staff: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (userWithCompanies) {
        const map = new Map<string, any>();
        userWithCompanies.ownedCompanies.forEach((c) => {
          // For owned companies, memberCount includes owner (1) + members + staff
          const memberCount =
            1 + (c._count?.members || 0) + (c._count?.staff || 0);
          map.set(c.id, { ...c, memberCount });
        });
        userWithCompanies.companyMemberships.forEach((m: any) => {
          const company = m.company;
          // For memberships, don't add 1 because owner is counted separately
          const memberCount =
            (company._count?.members || 0) + (company._count?.staff || 0);
          map.set(company.id, { ...company, memberCount });
        });
        userWithCompanies.companyStaff.forEach((s: any) => {
          const company = s.company;
          // For staff companies, don't add 1 because owner is counted separately
          const memberCount =
            (company._count?.members || 0) + (company._count?.staff || 0);
          map.set(company.id, { ...company, memberCount });
        });
        companies = Array.from(map.values());

        // For SUPER_ADMIN only: ensure root company present and sorted first
        if (user.role === "SUPER_ADMIN") {
          const root = await db.company.findFirst({
            where: { isRoot: true },
            select: {
              id: true,
              name: true,
              slug: true,
              slogan: true,
              description: true,
              logo: true,
              email: true,
              salesEmail: true,
              supportEmail: true,
              phone: true,
              website: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              state: true,
              country: true,
              countryCode: true,
              postalCode: true,
              isRoot: true,
              createdAt: true,
              _count: {
                select: {
                  members: true,
                  staff: true,
                },
              },
            },
          });
          if (root && !companies.some((c) => c.id === root.id)) {
            // For root company (owned by super admin), memberCount = 1 (owner) + members + staff
            const memberCount =
              1 + (root._count?.members || 0) + (root._count?.staff || 0);
            companies.unshift({ ...root, memberCount });
          }
        }

        // Sort: root first (if present), then by creation date
        companies.sort((a, b) =>
          a.isRoot && !b.isRoot
            ? -1
            : !a.isRoot && b.isRoot
            ? 1
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      // Manager/Staff/Contractor: companies via companyStaff
    } else if (["MANAGER", "STAFF", "CONTRACTOR"].includes(user.role)) {
      const staff = await db.companyStaff.findMany({
        where: { userId: user.id },
        include: {
          company: {
            select: { id: true, name: true, isRoot: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      companies = staff.map((s) => s.company);

      // Default: companies owned by the user
    } else {
      companies = await db.company.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true, isRoot: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });
    }

    // Attach basic plan limits info where available
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    const plan = dbUser?.plan || "FREE";
    const planLimits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? {
      companies: 0,
    };
    const companyCount = companies.length;
    const limit = planLimits.companies ?? 0;

    return NextResponse.json({
      success: true,
      companies,
      count: companies.length,
      userPlan: {
        plan,
        companyCount,
        limit: limit === Infinity ? "Unlimited" : limit,
        canCreateMore: limit === Infinity ? true : companyCount < limit,
      },
    });
  } catch (error) {
    console.error("GET /api/companies/my-owned error:", error);
    return NextResponse.json(
      { success: false, companies: [], error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
