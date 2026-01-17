import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET - Fetch time entries
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check user's access
    const staff = await db.companyStaff.findFirst({
      where: {
        userId: user.id,
        companyId,
      },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    // Allow SUPER_ADMIN to access any company even when they are not a member
    const userRole = user.role || "";
    if (!staff && userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // Build query
    const where: {
      companyId: string;
      staffId?: string;
      clockIn?: {
        gte?: Date;
        lte?: Date;
      };
    } = { companyId };

    // If not admin/manager, only show own entries
    if (!["ADMIN_OWNER", "SUPER_ADMIN", "COMPANY_MANAGER"].includes(userRole)) {
      // staff should exist for non-admin roles
      where.staffId = staff?.id;
    } else if (staffId) {
      // Admin/manager can filter by specific staff
      where.staffId = staffId;
    }

    // Date filters
    if (startDate || endDate) {
      where.clockIn = {};
      if (startDate) where.clockIn.gte = new Date(startDate);
      if (endDate) where.clockIn.lte = new Date(endDate);
    }

    // Fetch entries
    const entries = await db.timeEntry.findMany({
      where,
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        clockIn: "desc",
      },
    });

    // Enrich entries with approver user info when available
    const approverIds = [
      ...new Set(entries.map((e) => e.approvedBy).filter(Boolean) as string[]),
    ];
    const approverMap: Record<
      string,
      { id: string; name?: string | null; email?: string | null }
    > = {};
    if (approverIds.length > 0) {
      const approvers = await db.companyStaff.findMany({
        where: { id: { in: approverIds } },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      for (const a of approvers) {
        approverMap[a.id] = {
          id: a.user.id,
          name: a.user.name,
          email: a.user.email,
        };
      }
    }

    const enriched = entries.map((e) => ({
      ...e,
      approvedByUser: e.approvedBy ? approverMap[e.approvedBy] || null : null,
    }));

    // Get current active entry
    const activeEntry = enriched.find(
      (e) => e.status === "CLOCKED_IN" || e.status === "ON_BREAK"
    );

    return NextResponse.json({
      success: true,
      entries: enriched,
      activeEntry: activeEntry || null,
    });
  } catch (error) {
    console.error("Get entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}
