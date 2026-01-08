import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user } = validation;
    const body = await request.json();
    const { companyId, notes } = body;

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

    if (!staff) {
      return NextResponse.json(
        { error: "You are not a staff member of this company" },
        { status: 403 }
      );
    }

    // Find active time entry
    const timeEntry = await db.timeEntry.findFirst({
      where: {
        staffId: staff.id,
        status: {
          in: ["CLOCKED_IN", "ON_BREAK"],
        },
      },
      orderBy: {
        clockIn: "desc",
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: "You are not clocked in" },
        { status: 400 }
      );
    }

    const clockOut = new Date();
    const totalMinutes =
      Math.floor(
        (clockOut.getTime() - timeEntry.clockIn.getTime()) / 1000 / 60
      ) - timeEntry.breakMinutes;
    const totalHours = Number((totalMinutes / 60).toFixed(2));

    // Update time entry
    const updatedEntry = await db.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOut,
        status: "CLOCKED_OUT",
        totalMinutes,
        totalHours,
        notes: notes || timeEntry.notes,
      },
    });

    return NextResponse.json({
      success: true,
      timeEntry: updatedEntry,
      message: "Clocked out successfully",
    });
  } catch (error) {
    console.error("Clock out error:", error);
    return NextResponse.json({ error: "Failed to clock out" }, { status: 500 });
  }
}
