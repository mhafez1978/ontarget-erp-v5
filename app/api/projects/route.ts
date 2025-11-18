import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { Prisma, ProjectStatus } from "@prisma/client";

// Type for project with includes
type ProjectWithIncludes = Prisma.ProjectGetPayload<{
  include: {
    team: {
      select: {
        id: true;
        name: true;
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
      select: {
        id: true;
        status: true;
        priority: true;
      };
    };
    _count: {
      select: {
        tasks: true;
      };
    };
  };
}>;

// GET /api/projects - List all projects (with filtering)
// POST /api/projects - Create a new project
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query params for filtering
    const { searchParams } = req.nextUrl;
    const companyId = searchParams.get("companyId");
    const teamId = searchParams.get("teamId");
    const status = searchParams.get("status");
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this company
    // SUPER_ADMIN & ADMIN: Must own the company OR be a member/staff of the company
    // MANAGER/STAFF/CONTRACTOR: Must be in company staff (see projects via team membership)
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { staff: { some: { userId } } },
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // Build where clause based on role
    const where: Prisma.ProjectWhereInput = { companyId };

    // Apply role-based filtering
    if (
      user.role === "MANAGER" ||
      user.role === "STAFF" ||
      user.role === "CONTRACTOR"
    ) {
      // MANAGER/STAFF/CONTRACTOR: Only see projects where they are team members
      const staffRecord = await db.companyStaff.findFirst({
        where: { userId, companyId },
        select: { id: true },
      });

      if (staffRecord) {
        where.team = {
          members: {
            some: {
              staffId: staffRecord.id,
            },
          },
        };
      } else {
        // If not in company staff, return empty list
        return NextResponse.json({
          success: true,
          projects: [],
        });
      }
    }
    // SUPER_ADMIN, ADMIN: See all projects in the company (no additional filter needed)

    if (teamId) {
      where.teamId = teamId;
    }

    if (status) {
      where.status = status as ProjectStatus;
    }

    if (assignedToMe) {
      // Get user's staff ID
      const staffRecord = await db.companyStaff.findFirst({
        where: { userId, companyId },
        select: { id: true },
      });

      if (staffRecord) {
        // Filter for projects where user is manager, lead, or has tasks
        where.OR = [
          { projectManagerId: staffRecord.id },
          { teamLeadId: staffRecord.id },
          { tasks: { some: { assignedToId: staffRecord.id } } },
        ];
      }
    }

    // Get projects with related data
    const projects = (await db.project.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
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
          select: {
            id: true,
            status: true,
            priority: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as ProjectWithIncludes[];

    // Calculate progress for each project
    const projectsWithProgress = projects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(
        (t) => t.status === "COMPLETED"
      ).length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: Math.round(progress),
        team: project.team,
        projectManager: project.projectManager
          ? {
              id: project.projectManager.id,
              user: project.projectManager.user,
            }
          : null,
        teamLead: project.teamLead
          ? {
              id: project.teamLead.id,
              user: project.teamLead.user,
            }
          : null,
        _count: {
          tasks: project._count.tasks,
        },
        taskCount: project._count.tasks,
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
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });

    // Log activity for projects list view
    await createAuditLog({
      userId,
      companyId,
      action: "PROJECTS_VIEWED",
      entityType: "Project",
      entityId: null,
      description: `Viewed projects list for company (${projects.length} projects)`,
      metadata: {
        filters: { teamId, status, assignedToMe: !!assignedToMe },
        projectCount: projects.length,
      },
    });

    return NextResponse.json({
      success: true,
      projects: projectsWithProgress,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      description,
      teamId,
      companyId,
      projectManagerId,
      teamLeadId,
      status = "PLANNING",
      startDate,
      endDate,
    } = body;

    if (!name || !teamId || !companyId) {
      return NextResponse.json(
        { error: "Name, Team ID, and Company ID are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = [
      "PLANNING",
      "IN_PROGRESS",
      "ON_HOLD",
      "COMPLETED",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Get team and check if user can create projects
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

    if (team.companyId !== companyId) {
      return NextResponse.json(
        { error: "Team does not belong to this company" },
        { status: 400 }
      );
    }

    // Check permissions: Company owner, Team ADMIN/MANAGER, or SUPER_ADMIN
    const isOwner = team.company.ownerId === userId;
    const userTeamRole = team.members[0]?.role;
    const canCreateProjects =
      userTeamRole === "ADMIN" || userTeamRole === "MANAGER";
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    if (!isOwner && !canCreateProjects && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to create projects in this team" },
        { status: 403 }
      );
    }

    // Verify project manager and team lead exist if provided
    if (projectManagerId) {
      const pm = await db.companyStaff.findFirst({
        where: {
          id: projectManagerId,
          companyId,
        },
      });

      if (!pm) {
        return NextResponse.json(
          { error: "Project manager not found in this company" },
          { status: 404 }
        );
      }
    }

    if (teamLeadId) {
      const tl = await db.companyStaff.findFirst({
        where: {
          id: teamLeadId,
          companyId,
        },
      });

      if (!tl) {
        return NextResponse.json(
          { error: "Team lead not found in this company" },
          { status: 404 }
        );
      }
    }

    // Create project
    const project = await db.project.create({
      data: {
        name,
        description,
        teamId,
        companyId,
        projectManagerId,
        teamLeadId,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
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
      },
    });

    // Ensure a folder exists for this project under the company's store
    try {
      const company = await db.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      if (company?.name) {
        const sanitizedCompanyName = company.name.replace(
          /[^a-zA-Z0-9-]/g,
          "-"
        );
        const basePath = `/${sanitizedCompanyName}-store`;
        const projectsPath = `${basePath}/Projects`;

        // Find or create Projects parent
        let projectsFolder = await db.fileFolder.findFirst({
          where: { companyId, path: projectsPath },
          select: { id: true },
        });
        if (!projectsFolder) {
          projectsFolder = await db.fileFolder.create({
            data: {
              companyId,
              name: "Projects",
              path: projectsPath,
              type: "CUSTOM",
            },
            select: { id: true },
          });
        }

        // Create project folder if missing
        const sanitizedProjectName = project.name
          .replace(/[^a-zA-Z0-9-]/g, "-")
          .toLowerCase();
        const projectFolderPath = `${projectsPath}/${sanitizedProjectName}`;
        const existingProjectFolder = await db.fileFolder.findFirst({
          where: { companyId, path: projectFolderPath },
          select: { id: true },
        });
        if (!existingProjectFolder) {
          await db.fileFolder.create({
            data: {
              companyId,
              name: project.name,
              path: projectFolderPath,
              parentId: projectsFolder.id,
              type: "CUSTOM",
            },
          });
        }
      }
    } catch (e) {
      console.warn("[Project Folder] Failed to ensure project folder:", e);
    }

    // Create audit log
    await createAuditLog({
      userId,
      companyId,
      action: "PROJECT_CREATED",
      entityType: "Project",
      entityId: project.id,
      description: `Created project: ${name} in team ${team.name}`,
    });

    return NextResponse.json({
      success: true,
      project,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
