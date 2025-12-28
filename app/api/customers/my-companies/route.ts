import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    console.log("[API /customers/my-companies] Request received");

    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      console.log("[API /customers/my-companies] Invalid session");
      return validation.response;
    }

    const user = validation.user;
    console.log(
      "[API /customers/my-companies] User:",
      user.email,
      "Role:",
      user.role
    );

    // COMPANY_CUSTOMER users can only see their own company
    if (user.role === "COMPANY_CUSTOMER" || user.role === "ERP_CUSTOMER") {
      console.log(
        "[API /customers/my-companies] Customer fetching their company"
      );

      // Find the customer's company through CompanyMember
      const customerMembership = await db.companyMember.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!customerMembership) {
        console.log(
          "[API /customers/my-companies] Customer not linked to any company"
        );
        return NextResponse.json({
          success: true,
          companies: [],
          customers: [],
          count: 0,
        });
      }

      // Return the customer's company in the same format
      return NextResponse.json({
        success: true,
        companies: [
          {
            id: customerMembership.company.id,
            name: customerMembership.company.name,
            customers: [], // Customers don't need to see other customers
          },
        ],
        customers: [],
        count: 0,
      });
    }

    // ADMIN, MANAGER, STAFF can view all company customers they manage
    const allowedRoles = ["ADMIN", "MANAGER", "STAFF"];
    if (!allowedRoles.includes(user.role)) {
      console.log(
        "[API /customers/my-companies] Unauthorized role:",
        user.role
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all companies the user owns, is a member of, or is staff in
    const ownedCompanies = await db.company.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
      },
    });

    const memberCompanies = await db.companyMember.findMany({
      where: {
        userId: user.id,
      },
      select: {
        companyId: true,
      },
    });

    const staffCompanies = await db.companyStaff.findMany({
      where: {
        userId: user.id,
      },
      select: {
        companyId: true,
      },
    });

    const allCompanyIds = [
      ...ownedCompanies.map((c) => c.id),
      ...memberCompanies.map((m) => m.companyId),
      ...staffCompanies.map((s) => s.companyId),
    ];

    // Remove duplicates
    const uniqueCompanyIds = [...new Set(allCompanyIds)];

    // If the user manages no companies, return an empty response
    if (uniqueCompanyIds.length === 0) {
      return NextResponse.json({
        success: true,
        customers: [],
        companies: [],
        count: 0,
      });
    }

    // Fetch basic company info for all managed companies (include those with zero customers)
    const managedCompanies = await db.company.findMany({
      where: { id: { in: uniqueCompanyIds } },
      select: { id: true, name: true },
    });

    // Pre-populate a map with all managed companies (customers empty by default)
    const companiesMap = new Map(
      managedCompanies.map((c) => [
        c.id,
        { id: c.id, name: c.name, customers: [] as any },
      ])
    );

    // Fetch all COMPANY_CUSTOMER role users for these companies (if any)
    const companyMembers = await db.companyMember.findMany({
      where: {
        companyId: {
          in: uniqueCompanyIds,
        },
        user: {
          role: "COMPANY_CUSTOMER",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const customers = companyMembers.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      companyId: member.company.id,
      companyName: member.company.name,
      role: member.user.role, // Use the user's role (COMPANY_CUSTOMER) not the CompanyMember role
      joinedAt: member.joinedAt,
      createdAt: member.user.createdAt,
    }));

    // Attach customers to the pre-populated companies map
    customers.forEach((customer) => {
      const entry = companiesMap.get(customer.companyId);
      if (entry) {
        entry.customers.push(customer);
      } else {
        // Fallback: create entry if company wasn't in managedCompanies for some reason
        companiesMap.set(customer.companyId, {
          id: customer.companyId,
          name: customer.companyName,
          customers: [customer],
        });
      }
    });

    const companies = Array.from(companiesMap.values());

    console.log(
      "[API /customers/my-companies] Returning",
      customers.length,
      "customers across",
      companies.length,
      "companies"
    );

    return NextResponse.json({
      success: true,
      customers,
      companies, // Array of companies with their customers
      count: customers.length,
    });
  } catch (error) {
    console.error("[API /customers/my-companies] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
