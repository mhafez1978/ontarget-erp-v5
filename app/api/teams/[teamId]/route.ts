import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";

// GET /api/teams/[teamId] - Get team details
// PATCH /api/teams/[teamId] - Update team
// DELETE /api/teams/[teamId] - Delete team
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { teamId } = await params;

    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            ownerId: true,
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
                    role: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            _count: {
              select: {
                tasks: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user has access to this team's company
    const hasAccess =
      team.company.ownerId === userId ||
      (await db.companyMember.findFirst({
        where: {
          userId,
          companyId: team.companyId,
        },
      })) ||
      (await db.companyStaff.findFirst({
        where: {
          userId,
          companyId: team.companyId,
        },
      }));

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!hasAccess && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "You don't have access to this team" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      team: {
        ...team,
        members: team.members.map((m) => ({
          id: m.id,
          role: m.role,
          joinedAt: m.createdAt,
          staff: {
            id: m.staff.id,
            jobTitle: m.staff.jobTitle,
            user: m.staff.user,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { teamId } = await params;
    const body = await req.json();
    const { name, description, managerIds, teamLeadIds, memberIds } = body;

    // Get team with company info
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        company: {
          select: {
            id: true,
            ownerId: true,
          },
        },
        members: {
          where: {
            staff: {
              userId,
            },
          },
          select: {
            role: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Check permissions: Company owner, Team ADMIN, or SUPER_ADMIN
    const isOwner = team.company.ownerId === userId;
    const isTeamAdmin =
      team.members.length > 0 && team.members[0].role === "ADMIN";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !isTeamAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to edit this team" },
        { status: 403 }
      );
    }

    // Update team
    const updatedTeam = await db.team.update({
      where: { id: teamId },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
      },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    // Update team members if memberIds provided
    if (memberIds && Array.isArray(memberIds)) {
      // Get current members
      const currentMembers = await db.teamMember.findMany({
        where: { teamId },
        select: { staffId: true, id: true },
      });

      const currentStaffIds = currentMembers.map((m) => m.staffId);

      // Find members to remove (in current but not in new list)
      const membersToRemove = currentMembers.filter(
        (m) => !memberIds.includes(m.staffId)
      );

      // Find members to add (in new list but not in current)
      const membersToAdd = memberIds.filter(
        (id: string) => !currentStaffIds.includes(id)
      );

      // Remove members
      if (membersToRemove.length > 0) {
        await db.teamMember.deleteMany({
          where: {
            id: {
              in: membersToRemove.map((m) => m.id),
            },
          },
        });
      }

      // Add new members with appropriate roles
      if (membersToAdd.length > 0) {
        const memberCreations = membersToAdd.map((staffId: string) => {
          let role: "MANAGER" | "ADMIN" | "STAFF" | "CONTRACTOR" = "STAFF";

          // Assign roles based on managerIds and teamLeadIds arrays
          if (managerIds && managerIds.includes(staffId)) {
            role = "MANAGER";
          } else if (teamLeadIds && teamLeadIds.includes(staffId)) {
            role = "ADMIN";
          }

          return {
            teamId,
            staffId,
            role,
          };
        });

        await db.teamMember.createMany({
          data: memberCreations,
        });
      }

      // Update roles for existing members if managers or leads changed
      if (
        (managerIds && managerIds.length > 0) ||
        (teamLeadIds && teamLeadIds.length > 0)
      ) {
        const existingMembers = await db.teamMember.findMany({
          where: {
            teamId,
            staffId: {
              in: memberIds.filter((id: string) =>
                currentStaffIds.includes(id)
              ),
            },
          },
        });

        for (const member of existingMembers) {
          let newRole: "MANAGER" | "ADMIN" | "STAFF" | "CONTRACTOR" = "STAFF";

          if (managerIds && managerIds.includes(member.staffId)) {
            newRole = "MANAGER";
          } else if (teamLeadIds && teamLeadIds.includes(member.staffId)) {
            newRole = "ADMIN";
          }

          // Only update if role changed
          if (member.role !== newRole) {
            await db.teamMember.update({
              where: { id: member.id },
              data: { role: newRole },
            });
          }
        }
      }
    }

    // Create audit log
    await createAuditLog({
      userId,
      companyId: team.company.id,
      action: "TEAM_UPDATED",
      entityType: "Team",
      entityId: teamId,
      description: `Updated team: ${updatedTeam.name}`,
    });

    return NextResponse.json({
      success: true,
      team: updatedTeam,
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { teamId } = await params;

    // Get team with company info and check for existing projects
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        company: {
          select: {
            id: true,
            ownerId: true,
          },
        },
        members: {
          where: {
            staff: {
              userId,
            },
          },
          select: {
            role: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Check permissions: Company owner, Team ADMIN, or SUPER_ADMIN
    const isOwner = team.company.ownerId === userId;
    const isTeamAdmin =
      team.members.length > 0 && team.members[0].role === "ADMIN";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !isTeamAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this team" },
        { status: 403 }
      );
    }

    // Delete team (will cascade delete TeamMembers, projects will become unassigned)
    await db.team.delete({
      where: { id: teamId },
    });

    // Create audit log
    await createAuditLog({
      userId,
      companyId: team.company.id,
      action: "TEAM_DELETED",
      entityType: "Team",
      entityId: teamId,
      description: `Deleted team: ${team.name}${
        team._count.projects > 0
          ? ` (${team._count.projects} project(s) now unassigned)`
          : ""
      }`,
    });

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
      projectsUnassigned: team._count.projects,
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
