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

    // Find active time entry
    const timeEntry = await db.timeEntry.findFirst({
      where: {
        staffId: staff.id,
        status: "CLOCKED_IN",
      },
      orderBy: {
        clockIn: "desc",
      },
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: "You are not clocked in or already on break" },
        { status: 400 }
      );
    }

    // Update time entry to start break
    const updatedEntry = await db.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        breakStart: new Date(),
        status: "ON_BREAK",
      },
    });

    return NextResponse.json({
      success: true,
      timeEntry: updatedEntry,
      message: "Break started",
    });
  } catch (error) {
    console.error("Break start error:", error);
    return NextResponse.json(
      { error: "Failed to start break" },
      { status: 500 }
    );
  }
}
