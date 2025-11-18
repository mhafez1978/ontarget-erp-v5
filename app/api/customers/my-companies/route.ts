import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    console.log("[API /customers/my-companies] Request received");

    // Get user from session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      console.log("[API /customers/my-companies] No sessionToken");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      console.log("[API /customers/my-companies] Invalid session");
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const user = validation.user;
    console.log(
      "[API /customers/my-companies] User:",
      user.email,
      "Role:",
      user.role
    );

    // Only ADMIN, MANAGER, STAFF can view company customers
    const allowedRoles = ["ADMIN", "MANAGER", "STAFF"];
    if (!allowedRoles.includes(user.role)) {
      console.log(
        "[API /customers/my-companies] Unauthorized role:",
        user.role
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all companies the user owns or is a member of
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

    const allCompanyIds = [
      ...ownedCompanies.map((c) => c.id),
      ...memberCompanies.map((m) => m.companyId),
    ];

    if (allCompanyIds.length === 0) {
      return NextResponse.json({
        success: true,
        customers: [],
        count: 0,
      });
    }

    // Fetch all COMPANY_CUSTOMER role users for these companies
    const companyMembers = await db.companyMember.findMany({
      where: {
        companyId: {
          in: allCompanyIds,
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

    // Group customers by company for easier frontend processing
    const companiesMap = new Map<
      string,
      { id: string; name: string; customers: typeof customers }
    >();

    customers.forEach((customer) => {
      if (!companiesMap.has(customer.companyId)) {
        companiesMap.set(customer.companyId, {
          id: customer.companyId,
          name: customer.companyName,
          customers: [],
        });
      }
      companiesMap.get(customer.companyId)!.customers.push(customer);
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
