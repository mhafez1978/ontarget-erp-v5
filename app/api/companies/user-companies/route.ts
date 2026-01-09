import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    // Get all companies where user is a member
    const memberships = await db.companyStaff.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        company: {
          name: "asc",
        },
      },
    });

    // Transform to include role - filter only active companies
    const companies = memberships
      .filter((m) => m.company.isActive)
      .map((m) => ({
        id: m.company.id,
        name: m.company.name,
        role: m.role,
      }));

    // If super admin, also include root company
    if (user.role === "SUPER_ADMIN") {
      const rootCompany = await db.company.findFirst({
        where: {
          isRoot: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (rootCompany) {
        // Add root company at the beginning
        companies.unshift({
          id: rootCompany.id,
          name: rootCompany.name,
          role: "ADMIN", // Super admin acts as admin of root company
        });
      }
    }

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error) {
    console.error("Failed to fetch user companies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
