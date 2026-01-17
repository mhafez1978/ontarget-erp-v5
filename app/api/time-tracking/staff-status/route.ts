import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;
    const companyId = request.nextUrl.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if user is admin or manager of this company
    const membership = await db.companyStaff.findFirst({
      where: {
        userId: user.id,
        companyId: companyId,
        role: {
          in: ["ADMIN_OWNER", "COMPANY_MANAGER"],
        },
      },
    });

    if (!membership && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get all staff members with their current time entry status and session info
    const staffMembers = await db.companyStaff.findMany({
      where: {
        companyId: companyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        userId: true,
        role: true,
        jobTitle: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            sessions: {
              orderBy: {
                expires: "desc",
              },
              take: 2, // Get latest 2 to determine last seen
              select: {
                id: true,
                expires: true,
              },
            },
          },
        },

        timeEntries: {
          where: {
            clockOut: null, // Only get current active entries
          },
          orderBy: {
            clockIn: "desc",
          },
          take: 1,
          select: {
            id: true,
            clockIn: true,
            breakStart: true,
            breakEnd: true,
            status: true,
          },
        },
      },

      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // Transform data to include status
    const staffWithStatus = staffMembers.map((staff) => {
      const currentEntry = staff.timeEntries[0] || null;
      const now = new Date();
      const activeSession = staff.user.sessions.find(
        (s) => new Date(s.expires) > now
      );
      const hasActiveSession = !!activeSession;
      const lastSession = staff.user.sessions[0]; // Most recent session
      const lastSeen =
        lastSession && !hasActiveSession ? lastSession.expires : null;

      let status:
        | "OFFLINE"
        | "LOGGED_IN_CLOCKED_OUT"
        | "LOGGED_OUT_CLOCKED_IN"
        | "CLOCKED_IN"
        | "ON_BREAK" = "OFFLINE";

      // Determine status based on login and clock status
      if (currentEntry) {
        if (currentEntry.status === "ON_BREAK") {
          status = "ON_BREAK";
        } else if (currentEntry.status === "CLOCKED_IN") {
          if (hasActiveSession) {
            status = "CLOCKED_IN"; // Logged in AND clocked in (ideal working state)
          } else {
            status = "LOGGED_OUT_CLOCKED_IN"; // Clocked in but logged out (problem!)
          }
        }
      } else if (hasActiveSession) {
        status = "LOGGED_IN_CLOCKED_OUT"; // Logged in but not clocked in
      }

      const roleLabels: Record<string, string> = {
        SUPER_ADMIN: "SUPER_ADMIN",
        ADMIN_OWNER: "Admin",
        COMPANY_MANAGER: "Manager",
        COMPANY_STAFF: "Staff",
        COMPANY_CONTRACTOR: "Contractor",
      };

      // Prefer showing the user's global role when appropriate (e.g., SUPER_ADMIN)
      const displayTitle =
        staff.user?.role && roleLabels[staff.user.role]
          ? roleLabels[staff.user.role]
          : roleLabels[staff.role] || staff.role;

      return {
        id: staff.id,
        userId: staff.userId,
        user: staff.user,
        jobTitle: displayTitle,
        status,
        isLoggedIn: hasActiveSession,
        isClockedIn: currentEntry !== null,
        lastSeen: lastSeen ? new Date(lastSeen).toISOString() : null,
        currentEntry: currentEntry
          ? {
              id: currentEntry.id,
              clockIn: currentEntry.clockIn.toISOString(),
              breakStart: currentEntry.breakStart?.toISOString() || null,
              status: currentEntry.status,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      staff: staffWithStatus,
    });
  } catch (error) {
    console.error("Failed to fetch staff status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch staff status" },
      { status: 500 }
    );
  }
}
