import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";

// GET /api/teams/[teamId]/members - Get team members
// POST /api/teams/[teamId]/members - Add member to team
// DELETE /api/teams/[teamId]/members - Remove member from team
// PATCH /api/teams/[teamId]/members - Update member role

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    // Get team members
    const members = await db.teamMember.findMany({
      where: { teamId },
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
    });

    return NextResponse.json({
      success: true,
      members: members.map((m) => ({
        id: m.id,
        staffId: m.staffId,
        role: m.role,
        joinedAt: m.createdAt,
        staff: {
          id: m.staff.id,
          jobTitle: m.staff.jobTitle,
          user: m.staff.user,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await req.json();
    const { staffId, role = "STAFF" } = body;

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["ADMIN", "MANAGER", "STAFF", "CONTRACTOR"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

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

    // Check permissions: Company owner, Team ADMIN/MANAGER, or SUPER_ADMIN
    const isOwner = team.company.ownerId === userId;
    const userTeamRole = team.members[0]?.role;
    const canAddMembers =
      userTeamRole === "ADMIN" || userTeamRole === "MANAGER";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !canAddMembers && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to add members to this team" },
        { status: 403 }
      );
    }

    // Verify staff member exists and belongs to same company
    const staffMember = await db.companyStaff.findFirst({
      where: {
        id: staffId,
        companyId: team.company.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!staffMember) {
      return NextResponse.json(
        { error: "Staff member not found in this company" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await db.teamMember.findFirst({
      where: {
        teamId,
        staffId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "Staff member is already in this team" },
        { status: 400 }
      );
    }

    // Add member to team
    const teamMember = await db.teamMember.create({
      data: {
        teamId,
        staffId,
        role,
      },
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
    });

    // Create audit log
    await createAuditLog({
      userId,
      companyId: team.company.id,
      action: "TEAM_MEMBER_ADDED",
      entityType: "TeamMember",
      entityId: teamMember.id,
      description: `Added ${staffMember.user.name} to team ${team.name} as ${role}`,
    });

    return NextResponse.json({
      success: true,
      member: teamMember,
      message: "Member added to team successfully",
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const { searchParams } = req.nextUrl;
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

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

    // Check permissions: Company owner, Team ADMIN/MANAGER, or SUPER_ADMIN
    const isOwner = team.company.ownerId === userId;
    const userTeamRole = team.members[0]?.role;
    const canRemoveMembers =
      userTeamRole === "ADMIN" || userTeamRole === "MANAGER";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !canRemoveMembers && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to remove members from this team" },
        { status: 403 }
      );
    }

    // Get member to delete
    const memberToDelete = await db.teamMember.findUnique({
      where: { id: memberId },
      include: {
        staff: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!memberToDelete || memberToDelete.teamId !== teamId) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Delete member
    await db.teamMember.delete({
      where: { id: memberId },
    });

    // Create audit log
    await createAuditLog({
      userId,
      companyId: team.company.id,
      action: "TEAM_MEMBER_REMOVED",
      entityType: "TeamMember",
      entityId: memberId,
      description: `Removed ${memberToDelete.staff.user.name} from team ${team.name}`,
    });

    return NextResponse.json({
      success: true,
      message: "Member removed from team successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await req.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "Member ID and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["ADMIN", "MANAGER", "STAFF", "CONTRACTOR"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

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

    // Check permissions: Only Company owner, Team ADMIN, or SUPER_ADMIN can change roles
    const isOwner = team.company.ownerId === userId;
    const isTeamAdmin =
      team.members.length > 0 && team.members[0].role === "ADMIN";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !isTeamAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to change member roles" },
        { status: 403 }
      );
    }

    // Update member role
    const updatedMember = await db.teamMember.update({
      where: { id: memberId },
      data: { role },
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
    });

    // Create audit log
    await createAuditLog({
      userId,
      companyId: team.company.id,
      action: "TEAM_MEMBER_ROLE_CHANGED",
      entityType: "TeamMember",
      entityId: memberId,
      description: `Changed ${updatedMember.staff.user.name}'s role to ${role} in team ${team.name}`,
    });

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Error updating team member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
