import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with role and company info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    if (user.role === "SUPER_ADMIN") {
      // SUPER_ADMIN sees all audit logs
      whereClause = {};
    } else if (user.role === "ADMIN") {
      // ADMIN sees logs from their company only
      const companyIds = user.companyMemberships.map((m) => m.companyId);
      if (companyIds.length > 0) {
        whereClause = {
          companyId: {
            in: companyIds,
          },
        };
      } else {
        // Admin not in any company yet
        whereClause = {
          userId: user.id, // Only see their own logs
        };
      }
    } else if (
      ["MANAGER", "STAFF", "CONTRACTOR", "SUPPLIER"].includes(user.role)
    ) {
      // Other roles see logs from their company
      const companyIds = user.companyMemberships.map((m) => m.companyId);
      if (companyIds.length > 0) {
        whereClause = {
          companyId: {
            in: companyIds,
          },
        };
      } else {
        // Not in any company, only see own logs
        whereClause = {
          userId: user.id,
        };
      }
    } else {
      // ERP_CUSTOMER, COMPANY_CUSTOMER, GUEST see only their own logs
      whereClause = {
        userId: user.id,
      };
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch audit logs
    const auditLogs = await db.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await db.auditLog.count({
      where: whereClause,
    });

    return NextResponse.json({
      auditLogs,
      totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Audit log fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch audit logs",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
