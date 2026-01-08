import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;

    // Get user's company memberships for access control
    const userWithMemberships = await db.user.findUnique({
      where: { id: user.id },
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

    if (!userWithMemberships) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    if (userWithMemberships.role === "SUPER_ADMIN") {
      // SUPER_ADMIN sees all audit logs
      whereClause = {};
    } else if (userWithMemberships.role === "ADMIN") {
      // ADMIN sees logs from their company only
      const companyIds = userWithMemberships.companyMemberships.map(
        (m) => m.companyId
      );
      if (companyIds.length > 0) {
        whereClause = {
          companyId: {
            in: companyIds,
          },
        };
      } else {
        // Admin not in any company yet
        whereClause = {
          userId: userWithMemberships.id, // Only see their own logs
        };
      }
    } else if (
      ["MANAGER", "STAFF", "CONTRACTOR", "SUPPLIER"].includes(
        userWithMemberships.role
      )
    ) {
      // Other roles see logs from their company
      const companyIds = userWithMemberships.companyMemberships.map(
        (m) => m.companyId
      );
      if (companyIds.length > 0) {
        whereClause = {
          companyId: {
            in: companyIds,
          },
        };
      } else {
        // Not in any company, only see own logs
        whereClause = {
          userId: userWithMemberships.id,
        };
      }
    } else {
      // ERP_CUSTOMER, COMPANY_CUSTOMER, GUEST see only their own logs
      whereClause = {
        userId: userWithMemberships.id,
      };
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const entityId = searchParams.get("entityId");

    // Apply entityId filter if provided
    if (entityId) {
      whereClause = { ...whereClause, entityId };
    }

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
