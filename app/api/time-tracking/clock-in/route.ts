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
    const { companyId, notes, location } = body;

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

    // Check if already clocked in
    const existingEntry = await db.timeEntry.findFirst({
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

    if (existingEntry) {
      return NextResponse.json(
        {
          error: "You are already clocked in",
          entry: existingEntry,
        },
        { status: 400 }
      );
    }

    // Get IP address
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Create new time entry
    const timeEntry = await db.timeEntry.create({
      data: {
        staffId: staff.id,
        companyId,
        clockIn: new Date(),
        status: "CLOCKED_IN",
        notes: notes || null,
        location: location || null,
        ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      timeEntry,
      message: "Clocked in successfully",
    });
  } catch (error) {
    console.error("Clock in error:", error);
    return NextResponse.json({ error: "Failed to clock in" }, { status: 500 });
  }
}
