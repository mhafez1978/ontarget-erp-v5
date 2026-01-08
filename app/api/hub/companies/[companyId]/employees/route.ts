import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user } = validation;
    const userId = user.id;

    const { companyId } = await params;

    // Verify user has access to this company
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check access rights
    let hasAccess = false;

    if (user.role === "SUPER_ADMIN") {
      // Check if user owns the company or if it's a subscriber
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          OR: [
            { ownerId: user.id },
            {
              subscriberSubscriptions: {
                some: {
                  rootCompany: {
                    ownerId: user.id,
                  },
                  status: {
                    in: ["ACTIVE", "TRIAL"],
                  },
                },
              },
            },
          ],
        },
      });
      hasAccess = !!company;
    } else if (user.role === "ADMIN") {
      // Check if user owns the company
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          ownerId: user.id,
        },
      });
      hasAccess = !!company;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Fetch employees (staff) from the company
    const employees = await db.companyStaff.findMany({
      where: {
        companyId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const formattedEmployees = employees.map((emp) => ({
      id: emp.id, // Use CompanyStaff ID to ensure uniqueness
      userId: emp.user.id,
      name: emp.user.name,
      email: emp.user.email,
      role: emp.user.role,
      jobTitle: emp.jobTitle,
      status: emp.status,
    }));

    return NextResponse.json({ employees: formattedEmployees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
