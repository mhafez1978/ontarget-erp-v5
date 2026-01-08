import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const body = await request.json();
    const { companyId } = body;

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

    // Find active break
    const timeEntry = await db.timeEntry.findFirst({
      where: {
        staffId: staff.id,
        status: "ON_BREAK",
      },
      orderBy: {
        clockIn: "desc",
      },
    });

    if (!timeEntry || !timeEntry.breakStart) {
      return NextResponse.json(
        { error: "You are not on break" },
        { status: 400 }
      );
    }

    const breakEnd = new Date();
    const breakMinutes = Math.floor(
      (breakEnd.getTime() - timeEntry.breakStart.getTime()) / 1000 / 60
    );

    // Update time entry to end break
    const updatedEntry = await db.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        breakEnd,
        breakMinutes: timeEntry.breakMinutes + breakMinutes,
        status: "CLOCKED_IN",
      },
    });

    return NextResponse.json({
      success: true,
      timeEntry: updatedEntry,
      message: "Break ended",
    });
  } catch (error) {
    console.error("Break end error:", error);
    return NextResponse.json({ error: "Failed to end break" }, { status: 500 });
  }
}
