import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { Prisma, ProjectStatus } from "@prisma/client";
import { validateSession } from "@/lib/session-manager";
import { canEditProject, canViewProject } from "@/lib/project-permissions";

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

    // Check view permissions using the permission system
    const permissionCheck = await canViewProject({
      userId,
      projectId,
      userRole: user.role,
    });

    if (!permissionCheck.canEdit) {
      // Log unauthorized view attempt
      await createAuditLog({
        userId,
        companyId: project.companyId,
        action: AUDIT_ACTIONS.PROJECT_VIEWED,
        entityType: ENTITY_TYPES.PROJECT,
        entityId: projectId,
        description: `Unauthorized attempt to view project: ${project.name}`,
        metadata: {
          reason: permissionCheck.reason,
          projectName: project.name,
        },
      });

      return NextResponse.json(
        {
          error:
            permissionCheck.reason || "You don't have access to this project",
        },
        { status: 403 }
      );
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

    // Get existing project data before updates for audit logging
    const existingProject = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        companyId: true,
        teamId: true,
        projectManagerId: true,
        teamLeadId: true,
        projectManager: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
          },
        },
        teamLead: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
          },
        },
        team: {
          select: { id: true, name: true },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check edit permissions using the new permission system
    const permissionCheck = await canEditProject({
      userId,
      projectId,
      userRole: user.role,
    });

    if (!permissionCheck.canEdit) {
      // Log unauthorized attempt
      await createAuditLog({
        userId,
        companyId: existingProject.companyId,
        action: AUDIT_ACTIONS.PROJECT_UPDATED,
        entityType: ENTITY_TYPES.PROJECT,
        entityId: projectId,
        description: `Unauthorized attempt to update project: ${existingProject.name}`,
        metadata: {
          reason: permissionCheck.reason,
          attemptedUpdates: body,
        },
      });

      return NextResponse.json(
        {
          error:
            permissionCheck.reason ||
            "Insufficient permissions to update this project",
        },
        { status: 403 }
      );
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
        where: { id: projectManagerId, companyId: existingProject.companyId },
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
        where: { id: teamLeadId, companyId: existingProject.companyId },
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

    // Create detailed audit logs for specific changes
    const auditLogs: Array<{
      action: string;
      description: string;
      metadata: any;
    }> = [];

    // Track status changes with specific actions
    if (status && status !== existingProject.status) {
      let statusAction = AUDIT_ACTIONS.PROJECT_UPDATED;
      let statusDescription = `Project status changed from ${existingProject.status} to ${status}`;

      if (status === "COMPLETED") {
        statusAction = AUDIT_ACTIONS.PROJECT_CLOSED;
        statusDescription = `Project completed: ${updatedProject.name}`;
      } else if (status === "CANCELLED") {
        statusAction = AUDIT_ACTIONS.PROJECT_CANCELLED;
        statusDescription = `Project cancelled: ${updatedProject.name}`;
      } else if (
        (existingProject.status === "COMPLETED" ||
          existingProject.status === "CANCELLED") &&
        ["PLANNING", "IN_PROGRESS", "ON_HOLD", "BLOCKED"].includes(status)
      ) {
        statusAction = AUDIT_ACTIONS.PROJECT_REOPENED;
        statusDescription = `Project reopened: ${updatedProject.name}`;
      }

      auditLogs.push({
        action: statusAction,
        description: statusDescription,
        metadata: {
          oldStatus: existingProject.status,
          newStatus: status,
          projectName: updatedProject.name,
        },
      });
    }

    // Track team assignment changes
    if (body.teamId !== undefined && body.teamId !== existingProject.teamId) {
      auditLogs.push({
        action: AUDIT_ACTIONS.PROJECT_TEAM_CHANGED,
        description: `Project team assignment changed: ${updatedProject.name}`,
        metadata: {
          oldTeamId: existingProject.teamId,
          oldTeamName: existingProject.team?.name,
          newTeamId: body.teamId,
          newTeamName: updatedProject.team?.name,
          projectName: updatedProject.name,
        },
      });
    }

    // Track project manager changes
    if (
      projectManagerId !== undefined &&
      projectManagerId !== existingProject.projectManagerId
    ) {
      auditLogs.push({
        action: AUDIT_ACTIONS.PROJECT_MANAGER_CHANGED,
        description: `Project manager changed: ${updatedProject.name}`,
        metadata: {
          oldManagerId: existingProject.projectManagerId,
          oldManagerName: existingProject.projectManager?.user?.name,
          oldManagerEmail: existingProject.projectManager?.user?.email,
          newManagerId: projectManagerId,
          newManagerName: updatedProject.projectManager?.user?.name,
          newManagerEmail: updatedProject.projectManager?.user?.email,
          projectName: updatedProject.name,
        },
      });
    }

    // Track team lead changes
    if (teamLeadId !== undefined && teamLeadId !== existingProject.teamLeadId) {
      auditLogs.push({
        action: AUDIT_ACTIONS.PROJECT_LEAD_CHANGED,
        description: `Project lead changed: ${updatedProject.name}`,
        metadata: {
          oldLeadId: existingProject.teamLeadId,
          oldLeadName: existingProject.teamLead?.user?.name,
          oldLeadEmail: existingProject.teamLead?.user?.email,
          newLeadId: teamLeadId,
          newLeadName: updatedProject.teamLead?.user?.name,
          newLeadEmail: updatedProject.teamLead?.user?.email,
          projectName: updatedProject.name,
        },
      });
    }

    // Create a general update log if there are other changes
    const otherChanges: Record<string, any> = {};
    if (name && name !== existingProject.name) {
      otherChanges.name = { old: existingProject.name, new: name };
    }
    if (description !== undefined) {
      otherChanges.description = { changed: true };
    }
    if (startDate) {
      otherChanges.startDate = { new: startDate };
    }
    if (endDate) {
      otherChanges.endDate = { new: endDate };
    }

    if (Object.keys(otherChanges).length > 0 || auditLogs.length === 0) {
      auditLogs.push({
        action: AUDIT_ACTIONS.PROJECT_UPDATED,
        description: `Updated project: ${updatedProject.name}`,
        metadata: {
          updates: otherChanges,
          projectName: updatedProject.name,
        },
      });
    }

    // Write all audit logs
    await Promise.all(
      auditLogs.map((log) =>
        createAuditLog({
          userId,
          companyId: existingProject.companyId,
          action: log.action,
          entityType: ENTITY_TYPES.PROJECT,
          entityId: projectId,
          description: log.description,
          metadata: log.metadata,
        })
      )
    );

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
