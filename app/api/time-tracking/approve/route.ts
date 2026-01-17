import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { entryId } = await req.json();

    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    // Check if user is staff member
    const staff = await db.companyStaff.findFirst({
      where: {
        userId: validation.user.id,
      },
      include: {
        company: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff membership not found" },
        { status: 404 }
      );
    }

    // Only ADMIN_OWNER, SUPER_ADMIN, or COMPANY_MANAGER can approve
    const canApprove = [
      "ADMIN_OWNER",
      "SUPER_ADMIN",
      "COMPANY_MANAGER",
    ].includes(validation.user.role);
    if (!canApprove) {
      return NextResponse.json(
        { error: "Only admins and managers can approve time entries" },
        { status: 403 }
      );
    }

    // Get the time entry
    const entry = await db.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    // Verify entry belongs to same company
    if (entry.companyId !== staff.companyId) {
      return NextResponse.json(
        { error: "Cannot approve entries from other companies" },
        { status: 403 }
      );
    }

    // Check if already approved
    if (entry.isApproved) {
      return NextResponse.json(
        { error: "Entry is already approved" },
        { status: 400 }
      );
    }

    // Check if entry is completed
    if (entry.status !== "CLOCKED_OUT") {
      return NextResponse.json(
        { error: "Can only approve completed entries" },
        { status: 400 }
      );
    }

    // Approve the entry
    const updatedEntry = await db.timeEntry.update({
      where: { id: entryId },
      data: {
        isApproved: true,
        approvedBy: staff.id,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      entry: updatedEntry,
    });
  } catch (error) {
    console.error("Approve time entry error:", error);
    return NextResponse.json(
      { error: "Failed to approve time entry" },
      { status: 500 }
    );
  }
}
