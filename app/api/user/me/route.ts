import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

// GET /api/user/me - Get current user information with permissions context
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    // Fetch user with all permission-relevant associations
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        // Companies owned by this user
        ownedCompanies: {
          select: {
            id: true,
            name: true,
          },
        },
        // Companies where user is a member (ADMIN_OWNER role in company)
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        // Companies where user is staff (workforce)
        companyStaff: {
          select: {
            id: true,
            companyId: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            // Teams where this staff member is assigned
            teamMemberships: {
              select: {
                teamId: true,
                role: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    companyId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Flatten team memberships from staff records
    const teamMemberships = user.companyStaff.flatMap((staff) =>
      staff.teamMemberships.map((membership) => ({
        teamId: membership.teamId,
        role: membership.role,
        team: membership.team,
      }))
    );

    // Build the response with structured data
    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      ownedCompanies: user.ownedCompanies,
      companyMemberships: user.companyMemberships.map((m) => ({
        companyId: m.companyId,
        role: m.role,
        company: m.company,
      })),
      staffMemberships: user.companyStaff.map((staff) => ({
        companyId: staff.companyId,
        role: staff.role,
        company: staff.company,
      })),
      teamMemberships: teamMemberships,
    };

    return NextResponse.json({
      success: true,
      user: userInfo,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information" },
      { status: 500 }
    );
  }
}
