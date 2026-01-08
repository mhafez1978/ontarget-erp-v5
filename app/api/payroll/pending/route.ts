import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user } = validation;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId query parameter is required" },
        { status: 400 }
      );
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, ownerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (user.role !== "SUPER_ADMIN" && user.id !== company.ownerId) {
      const staffRecord = await db.companyStaff.findFirst({
        where: {
          userId: user.id,
          companyId,
          role: {
            in: ["ADMIN", "MANAGER"],
          },
        },
      });

      if (!staffRecord) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const pendingEntries = await db.timeEntry.findMany({
      where: {
        companyId,
        isApproved: true,
        status: "CLOCKED_OUT",
        payrollEntryId: null,
      },
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

    return NextResponse.json({
      success: true,
      pendingEntries,
      total: pendingEntries.length,
    });
  } catch (error) {
    console.error("Fetch pending payroll entries error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending payroll entries" },
      { status: 500 }
    );
  }
}
