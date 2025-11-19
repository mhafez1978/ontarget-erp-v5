import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { Prisma, ProjectStatus } from "@prisma/client";
import { validateSession } from "@/lib/session-manager";

// Type for project with full includes
type ProjectWithFullDetails = Prisma.ProjectGetPayload<{
  include: {
    team: {
      include: {
        members: {
          include: {
            staff: {
              include: {
                user: {
                  select: {
                    id: true;
                    name: true;
                    email: true;
                    image: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    projectManager: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            image: true;
          };
        };
      };
    };
    teamLead: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            image: true;
          };
        };
      };
    };
    tasks: {
      include: {
        assignedTo: {
          include: {
            user: {
              select: {
                id: true;
                name: true;
                email: true;
                image: true;
              };
            };
          };
        };
      };
    };
    company: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

// GET /api/projects/[projectId] - Get project details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const { projectId } = await params;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get project with full details
    const project = (await db.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
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
        },
        projectManager: {
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
        teamLead: {
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
        tasks: {
          include: {
            assignedTo: {
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
            order: "asc",
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })) as ProjectWithFullDetails | null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access based on role - SUPER_ADMIN has full access
    if (user.role !== "SUPER_ADMIN") {
      const company = await db.company.findFirst({
        where: {
          id: project.companyId,
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
            { staff: { some: { userId } } },
          ],
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "You don't have access to this project" },
          { status: 403 }
        );
      }

      // Additional check for MANAGER/STAFF/CONTRACTOR: Must be team member
      if (
        user.role === "MANAGER" ||
        user.role === "STAFF" ||
        user.role === "CONTRACTOR"
      ) {
        const staffRecord = await db.companyStaff.findFirst({
          where: { userId, companyId: project.companyId },
          select: { id: true },
        });

        if (staffRecord) {
          // If project has no team, deny access to non-admin roles
          if (!project.team) {
            return NextResponse.json(
              { error: "This project is not assigned to a team" },
              { status: 403 }
            );
          }

          // Check if user is a member of the project's team
          const isTeamMember = project.team.members.some(
            (member) => member.staffId === staffRecord.id
          );

          if (!isTeamMember) {
            return NextResponse.json(
              { error: "You don't have access to this project" },
              { status: 403 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "You don't have access to this project" },
            { status: 403 }
          );
        }
      }
      // SUPER_ADMIN, ADMIN: Full access if they have company access
    }

    // Calculate progress
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === "COMPLETED"
    ).length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Log activity for project detail view
    await createAuditLog({
      userId,
      companyId: project.companyId,
      action: "PROJECT_VIEWED",
      entityType: "Project",
      entityId: projectId,
      description: `Viewed project details: ${project.name}`,
      metadata: {
        projectName: project.name,
        teamId: project.team?.id ?? null,
        progress: Math.round(progress),
        taskCount: totalTasks,
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        progress: Math.round(progress),
        _count: {
          tasks: totalTasks,
        },
        taskCount: totalTasks,
        tasksByStatus: {
          todo: project.tasks.filter((t) => t.status === "TODO").length,
          inProgress: project.tasks.filter((t) => t.status === "IN_PROGRESS")
            .length,
          inReview: project.tasks.filter((t) => t.status === "IN_REVIEW")
            .length,
          completed: completedTasks,
          blocked: project.tasks.filter((t) => t.status === "BLOCKED").length,
        },
        tasksByPriority: {
          urgent: project.tasks.filter((t) => t.priority === "URGENT").length,
          high: project.tasks.filter((t) => t.priority === "HIGH").length,
          medium: project.tasks.filter((t) => t.priority === "MEDIUM").length,
          low: project.tasks.filter((t) => t.priority === "LOW").length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId] - Update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const { projectId } = await params;
    const body = await req.json();

    console.log("PATCH /api/projects/[projectId] - Body:", body);
    console.log("PATCH /api/projects/[projectId] - ProjectId:", projectId);

    const {
      name,
      description,
      status,
      startDate,
      endDate,
      projectManagerId,
      teamLeadId,
    } = body;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get project to check company
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { companyId: true, teamId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions (company owner/member, team admin/manager, or SUPER_ADMIN)
    // SUPER_ADMIN can update any project
    // ADMIN can update projects in companies they own or are members of
    if (user.role === "SUPER_ADMIN") {
      // SUPER_ADMIN has full access, skip other checks
    } else if (user.role === "ADMIN") {
      // ADMIN: Check if they own or are a member of the company
      const company = await db.company.findFirst({
        where: {
          id: project.companyId,
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
            { staff: { some: { userId } } },
          ],
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Insufficient permissions to update this project" },
          { status: 403 }
        );
      }
    } else {
      // MANAGER/STAFF/CONTRACTOR: Must be company owner or team admin/manager
      const company = await db.company.findFirst({
        where: {
          id: project.companyId,
          OR: [{ ownerId: userId }],
        },
      });

      // If project has no team, only company owner can update
      const teamMembership = project.teamId
        ? await db.teamMember.findFirst({
            where: {
              teamId: project.teamId,
              staff: { userId },
              role: { in: ["ADMIN", "MANAGER"] },
            },
          })
        : null;

      if (!company && !teamMembership) {
        return NextResponse.json(
          { error: "Insufficient permissions to update this project" },
          { status: 403 }
        );
      }
    }

    // Validate status if provided
    if (
      status &&
      ![
        "PLANNING",
        "IN_PROGRESS",
        "ON_HOLD",
        "BLOCKED",
        "COMPLETED",
        "CANCELLED",
      ].includes(status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate manager and lead are in the same company if provided
    if (projectManagerId) {
      const manager = await db.companyStaff.findFirst({
        where: { id: projectManagerId, companyId: project.companyId },
      });
      if (!manager) {
        return NextResponse.json(
          { error: "Project manager not found in this company" },
          { status: 400 }
        );
      }
    }

    if (teamLeadId) {
      const lead = await db.companyStaff.findFirst({
        where: { id: teamLeadId, companyId: project.companyId },
      });
      if (!lead) {
        return NextResponse.json(
          { error: "Team lead not found in this company" },
          { status: 400 }
        );
      }
    }

    // Update project
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status: status as ProjectStatus }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(projectManagerId !== undefined && { projectManagerId }),
        ...(teamLeadId !== undefined && { teamLeadId }),
      },
      include: {
        team: true,
        projectManager: {
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
        teamLead: {
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
      companyId: project.companyId,
      action: "PROJECT_UPDATED",
      entityType: "project",
      entityId: projectId,
      description: `Updated project: ${updatedProject.name}`,
      metadata: { updates: body },
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update project";
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const { projectId } = await params;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get project to check company and get name for audit log
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { companyId: true, teamId: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions (company owner, team admin, or SUPER_ADMIN)
    // SUPER_ADMIN can delete any project
    if (user.role === "SUPER_ADMIN") {
      // SUPER_ADMIN has full access, skip other checks
    } else {
      const company = await db.company.findFirst({
        where: {
          id: project.companyId,
          OR: [{ ownerId: userId }],
        },
      });

      // If project has no team, only company owner can delete
      const teamMembership = project.teamId
        ? await db.teamMember.findFirst({
            where: {
              teamId: project.teamId,
              staff: { userId },
              role: "ADMIN",
            },
          })
        : null;

      if (!company && !teamMembership) {
        return NextResponse.json(
          { error: "Insufficient permissions to delete this project" },
          { status: 403 }
        );
      }
    }

    // Delete project (tasks will be cascade deleted)
    await db.project.delete({
      where: { id: projectId },
    });

    // Create audit log
    await createAuditLog({
      userId,
      companyId: project.companyId,
      action: "PROJECT_DELETED",
      entityType: "project",
      entityId: projectId,
      description: `Deleted project: ${project.name}`,
    });

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
