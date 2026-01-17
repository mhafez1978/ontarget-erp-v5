import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { Prisma, UserRole, CompanyMemberRole } from "@/generated/prisma/client";

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
    let whereClause: Prisma.AuditLogWhereInput = {};

    // Check if user has admin roles in any company
    const hasAdminRole = userWithMemberships.companyMemberships.some(
      (m) =>
        m.role === CompanyMemberRole.ADMIN_OWNER ||
        m.role === CompanyMemberRole.ADMIN_NONOWNER ||
        m.role === CompanyMemberRole.COMPANY_MANAGER
    );

    const hasStaffRole = userWithMemberships.companyMemberships.some(
      (m) =>
        m.role === CompanyMemberRole.COMPANY_STAFF ||
        m.role === CompanyMemberRole.COMPANY_CONTRACTOR ||
        m.role === CompanyMemberRole.COMPANY_SUPPLIER
    );

    if (userWithMemberships.role === UserRole.SUPER_ADMIN) {
      // SUPER_ADMIN sees all audit logs
      whereClause = {};
    } else if (hasAdminRole) {
      // Users with admin roles in companies see logs from their companies
      const companyIds = userWithMemberships.companyMemberships
        .filter(
          (m) =>
            m.role === CompanyMemberRole.ADMIN_OWNER ||
            m.role === CompanyMemberRole.ADMIN_NONOWNER ||
            m.role === CompanyMemberRole.COMPANY_MANAGER
        )
        .map((m) => m.companyId);
      if (companyIds.length > 0) {
        whereClause = {
          companyId: {
            in: companyIds,
          },
        };
      } else {
        // Fallback to own logs
        whereClause = {
          userId: userWithMemberships.id,
        };
      }
    } else if (hasStaffRole) {
      // Staff roles see logs from their companies
      const companyIds = userWithMemberships.companyMemberships
        .filter(
          (m) =>
            m.role === CompanyMemberRole.COMPANY_STAFF ||
            m.role === CompanyMemberRole.COMPANY_CONTRACTOR ||
            m.role === CompanyMemberRole.COMPANY_SUPPLIER
        )
        .map((m) => m.companyId);
      if (companyIds.length > 0) {
        whereClause = {
          companyId: {
            in: companyIds,
          },
        };
      } else {
        // Fallback to own logs
        whereClause = {
          userId: userWithMemberships.id,
        };
      }
    } else {
      // ERP_CUSTOMER, COMPANY_CUSTOMER, TRIAL see only their own logs
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
