import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/companies - Get companies accessible to the user
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    // Fetch companies based on role
    // SUPER_ADMIN/ADMIN: owned companies + companies they're members/staff of
    // MANAGER/STAFF/CONTRACTOR: companies they're staff members of
    // Others: only companies they own
    let companies;

    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
      // Get owned companies and companies they're members of
      const userWithCompanies = await db.user.findUnique({
        where: { id: user.id },
        include: {
          ownedCompanies: {
            select: {
              id: true,
              name: true,
              description: true,
              logo: true,
              isRoot: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "asc", // Oldest first (root company first)
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
                  isRoot: true,
                  createdAt: true,
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
                  description: true,
                  logo: true,
                  isRoot: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });

      if (!userWithCompanies) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Combine owned, member, and staff companies (remove duplicates)
      const companyMap = new Map();

      // Add owned companies
      userWithCompanies.ownedCompanies.forEach((company) => {
        companyMap.set(company.id, company);
      });

      // Add member companies
      userWithCompanies.companyMemberships.forEach((membership) => {
        if (!companyMap.has(membership.company.id)) {
          companyMap.set(membership.company.id, membership.company);
        }
      });

      // Add staff companies
      userWithCompanies.companyStaff.forEach((staff) => {
        if (!companyMap.has(staff.company.id)) {
          companyMap.set(staff.company.id, staff.company);
        }
      });

      companies = Array.from(companyMap.values());

      // Sort: root company first, then by creation date (oldest first)
      companies.sort((a, b) => {
        if (a.isRoot && !b.isRoot) return -1;
        if (!a.isRoot && b.isRoot) return 1;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    } else if (
      user.role === "MANAGER" ||
      user.role === "STAFF" ||
      user.role === "CONTRACTOR"
    ) {
      // Staff roles see companies they're staff members of
      const staffMemberships = await db.companyStaff.findMany({
        where: {
          userId: user.id,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              description: true,
              logo: true,
              isRoot: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      companies = staffMemberships.map((staff) => staff.company);
    } else {
      // Other roles only see companies they own
      companies = await db.company.findMany({
        where: {
          ownerId: user.id,
        },
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          isRoot: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc", // Oldest first
        },
      });
    }

    return NextResponse.json({
      success: true,
      companies,
      count: companies.length,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
