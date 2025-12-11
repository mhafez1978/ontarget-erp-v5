import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/customers - Fetch customers filtered by company
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if this is the root company
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { isRoot: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    let customers;

    if (company.isRoot) {
      // For root company: Get users with ERP plans (ESSENTIAL, GROWTH, ENTERPRISE)
      customers = await db.user.findMany({
        where: {
          plan: {
            in: ["ESSENTIAL", "GROWTH", "ENTERPRISE"],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          role: true,
          image: true,
        },
        orderBy: { name: "asc" },
      });
    } else {
      // For regular companies: Get COMPANY_CUSTOMER role users associated with this company
      customers = await db.user.findMany({
        where: {
          role: "COMPANY_CUSTOMER",
          companyMemberships: {
            some: {
              companyId: companyId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
