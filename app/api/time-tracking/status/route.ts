import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET - Fetch current status
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Get staff record
    const staff = await db.companyStaff.findFirst({
      where: {
        userId: user.id,
        companyId,
      },
    });

    // Check if user is the company owner (ADMIN_OWNER who owns the company)
    const isOwner =
      user.role === "ADMIN_OWNER" &&
      (await db.company.findFirst({
        where: {
          id: companyId,
          ownerId: user.id,
        },
      }));

    if (!staff && !isOwner) {
      return NextResponse.json(
        {
          success: true,
          isStaff: false,
          status: null,
          entry: null,
        },
        { status: 200 }
      );
    }

    // Find active time entry (only if staff exists)
    let activeEntry = null;
    if (staff !== null) {
      const staffId = staff.id;
      activeEntry = await db.timeEntry.findFirst({
        where: {
          staffId,
          status: {
            in: ["CLOCKED_IN", "ON_BREAK"],
          },
        },
        orderBy: {
          clockIn: "desc",
        },
      });
    }

    return NextResponse.json({
      success: true,
      isStaff: !!staff || isOwner,
      status: activeEntry?.status || "CLOCKED_OUT",
      entry: activeEntry || null,
    });
  } catch (error) {
    console.error("Get status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
