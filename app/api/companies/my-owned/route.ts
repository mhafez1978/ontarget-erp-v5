import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { validateSessionForAPI } from "@/lib/validate-session";
import { Prisma } from "@prisma/client";

// Single consolidated GET handler for /api/companies/my-owned
// Returns companies the current user can manage/see and some optional plan info
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const { user } = validation;

    // Reusable select object for company data
    const companySelect = {
      id: true,
      name: true,
      slug: true,
      slogan: true,
      description: true,
      industry: true,
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
    } satisfies Prisma.CompanySelect;

    type CompanyWithCount = Prisma.CompanyGetPayload<{
      select: typeof companySelect;
    }>;

    type CompanyWithMemberCount = CompanyWithCount & { memberCount: number };

    let companies: CompanyWithMemberCount[] = [];

    // SUPER_ADMIN / ADMIN: aggregate owned, memberships, and staff companies
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      const userWithCompanies = await db.user.findUnique({
        where: { id: user.id },
        include: {
          ownedCompanies: {
            select: companySelect,
            orderBy: { createdAt: "asc" },
          },
          companyMemberships: {
            include: {
              company: {
                select: companySelect,
              },
            },
          },
          companyStaff: {
            include: {
              company: {
                select: companySelect,
              },
            },
          },
        },
      });

      if (userWithCompanies) {
        const map = new Map<string, CompanyWithMemberCount>();
        userWithCompanies.ownedCompanies.forEach((c) => {
          // For owned companies, memberCount includes owner (1) + members + staff
          const memberCount =
            1 + (c._count?.members || 0) + (c._count?.staff || 0);
          map.set(c.id, { ...c, memberCount });
        });
        userWithCompanies.companyMemberships.forEach((m) => {
          const company = m.company;
          // For memberships, don't add 1 because owner is counted separately
          const memberCount =
            (company._count?.members || 0) + (company._count?.staff || 0);
          map.set(company.id, { ...company, memberCount });
        });
        userWithCompanies.companyStaff.forEach((s) => {
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
            select: companySelect,
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
            select: companySelect,
          },
        },
        orderBy: { createdAt: "asc" },
      });
      companies = staff.map((s) => ({
        ...s.company,
        memberCount:
          1 + (s.company._count?.members || 0) + (s.company._count?.staff || 0),
      }));

      // Default: companies owned by the user
    } else {
      const ownedCompanies = await db.company.findMany({
        where: { ownerId: user.id },
        select: companySelect,
        orderBy: { createdAt: "asc" },
      });
      companies = ownedCompanies.map((c) => ({
        ...c,
        memberCount: 1 + (c._count?.members || 0) + (c._count?.staff || 0),
      }));

      // If none found above, also include companies where user is a member (companyMember)
      if (companies.length === 0) {
        try {
          const memberships = await db.companyMember.findMany({
            where: { userId: user.id },
            include: {
              company: {
                select: companySelect,
              },
            },
          });
          if (memberships && memberships.length > 0) {
            companies = memberships.map((m) => ({
              ...m.company,
              memberCount:
                1 +
                (m.company._count?.members || 0) +
                (m.company._count?.staff || 0),
            }));
          }
        } catch (e) {
          // Be resilient to missing companyMember table in some environments
          console.warn(
            "companyMember table inaccessible; skipping membership lookup",
            e
          );
        }
      }
    }

    // If we found no companies through ownerId/memberships/staff, be resilient
    // and attempt to find companies whose owner email matches the logged-in user's email.
    // This handles cases where an account was created twice (duplicate user rows) or
    // the company references a different user id than the current session (e.g., OAuth linking mismatch).
    if (companies.length === 0 && user.email) {
      // First try: owner email
      try {
        const byEmail = await db.company.findMany({
          where: { owner: { email: user.email } },
          select: companySelect,
        });
        if (byEmail && byEmail.length > 0) {
          console.log(
            "my-owned: fallback found companies by owner email",
            user.email,
            byEmail.length
          );
          companies = byEmail.map((c) => ({
            ...c,
            memberCount: 1 + (c._count?.members || 0) + (c._count?.staff || 0),
          }));
        }
      } catch (e) {
        console.warn("Fallback owner-by-email lookup failed", e);
      }

      // Second try: membership (companyMember) where the member's user email matches
      if (companies.length === 0) {
        try {
          const mems = await db.companyMember.findMany({
            where: { user: { email: user.email } },
            include: {
              company: {
                select: companySelect,
              },
            },
          });
          if (mems && mems.length > 0) {
            console.log(
              "my-owned: fallback found companies by membership email",
              user.email,
              mems.length
            );
            companies = mems.map((m) => ({
              ...m.company,
              memberCount:
                1 +
                (m.company._count?.members || 0) +
                (m.company._count?.staff || 0),
            }));
          }
        } catch (e) {
          console.warn("Fallback membership-by-email lookup failed", e);
        }
      }

      // Third try: staff (companyStaff) where the staff's user email matches
      if (companies.length === 0) {
        try {
          const staffRows = await db.companyStaff.findMany({
            where: { user: { email: user.email } },
            include: {
              company: {
                select: companySelect,
              },
            },
          });
          if (staffRows && staffRows.length > 0) {
            console.log(
              "my-owned: fallback found companies by staff email",
              user.email,
              staffRows.length
            );
            companies = staffRows.map((s) => ({
              ...s.company,
              memberCount:
                1 +
                (s.company._count?.members || 0) +
                (s.company._count?.staff || 0),
            }));
          }
        } catch (e) {
          console.warn("Fallback staff-by-email lookup failed", e);
        }
      }
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
