import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";

// GET /api/teams - List all teams for a company (with filtering)
// POST /api/teams - Create a new team
export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get companyId from query params
    const { searchParams } = req.nextUrl;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this company
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId }, // Owner
          { members: { some: { userId } } }, // Member
          { staff: { some: { userId } } }, // Staff
        ],
      },
    });

    if (!company && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // Get all teams for the company with member count and project count
    const teams = await db.team.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
        members: {
          take: 5, // Get first 5 members for preview
          include: {
            staff: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        companyId: team.companyId,
        memberCount: team._count.members,
        projectCount: team._count.projects,
        members: team.members.map((m) => ({
          id: m.id,
          role: m.role,
          staffId: m.staffId,
          staff: {
            id: m.staff.id,
            user: m.staff.user,
          },
        })),
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, companyId, memberIds, managerIds, teamLeadIds } =
      body;

    if (!name || !companyId) {
      return NextResponse.json(
        { error: "Name and Company ID are required" },
        { status: 400 }
      );
    }

    // Check if user can create teams in this company
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId }, // Owner can create teams
          {
            members: {
              some: {
                userId,
                role: { in: ["ADMIN"] }, // Only ADMIN members can create teams
              },
            },
          },
        ],
      },
    });

    if (!company && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You don't have permission to create teams in this company" },
        { status: 403 }
      );
    }

    // Prevent duplicate team names within the same company
    const existingTeam = await db.team.findFirst({
      where: {
        companyId,
        name,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        {
          error:
            "A team with this name already exists for this company. Please choose a different name.",
        },
        { status: 400 }
      );
    }

    // Create the team
    const team = await db.team.create({
      data: {
        name,
        description,
        companyId,
      },
    });

    // Add initial members if provided
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Verify all memberIds are valid CompanyStaff IDs
      const staffMembers = await db.companyStaff.findMany({
        where: {
          id: { in: memberIds },
          companyId, // Ensure they belong to the same company
        },
      });

      if (staffMembers.length !== memberIds.length) {
        // Some invalid staff IDs
        await db.team.delete({ where: { id: team.id } }); // Rollback
        return NextResponse.json(
          { error: "Some staff members are invalid" },
          { status: 400 }
        );
      }

      // Add team members with appropriate roles
      await db.teamMember.createMany({
        data: memberIds.map((staffId: string) => {
          let role: "MANAGER" | "ADMIN" | "STAFF" | "CONTRACTOR" = "STAFF";

          // Assign role based on managerIds/teamLeadIds arrays
          if (managerIds && managerIds.includes(staffId)) {
            role = "MANAGER";
          } else if (teamLeadIds && teamLeadIds.includes(staffId)) {
            role = "ADMIN"; // Team Lead gets ADMIN role in the team
          }

          return {
            teamId: team.id,
            staffId,
            role,
          };
        }),
      });
    }

    // Add managers if provided and not already in members
    if (managerIds && managerIds.length > 0) {
      for (const managerId of managerIds) {
        if (!memberIds || !memberIds.includes(managerId)) {
          const managerStaff = await db.companyStaff.findUnique({
            where: { id: managerId },
          });

          if (managerStaff && managerStaff.companyId === companyId) {
            await db.teamMember.create({
              data: {
                teamId: team.id,
                staffId: managerId,
                role: "MANAGER",
              },
            });
          }
        }
      }
    }

    // Add team leads if provided and not already in members
    if (teamLeadIds && teamLeadIds.length > 0) {
      for (const teamLeadId of teamLeadIds) {
        if (!memberIds || !memberIds.includes(teamLeadId)) {
          const teamLeadStaff = await db.companyStaff.findUnique({
            where: { id: teamLeadId },
          });

          if (teamLeadStaff && teamLeadStaff.companyId === companyId) {
            await db.teamMember.create({
              data: {
                teamId: team.id,
                staffId: teamLeadId,
                role: "ADMIN", // Team Lead gets ADMIN role
              },
            });
          }
        }
      }
    }

    // Create audit log
    await createAuditLog({
      userId,
      companyId,
      action: "TEAM_CREATED",
      entityType: "Team",
      entityId: team.id,
      description: `Created team: ${name}`,
    });

    // Fetch the created team with members
    const createdTeam = await db.team.findUnique({
      where: { id: team.id },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
        members: {
          include: {
            staff: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      team: createdTeam,
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
