import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { Prisma, TaskStatus, TaskPriority } from "@/generated/prisma/client";
import { validateSessionForAPI } from "@/lib/validate-session";

// Type for task with includes
type TaskWithIncludes = Prisma.TaskGetPayload<{
  include: {
    createdBy: {
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
}>;

// GET /api/projects/[projectId]/tasks - List tasks for a project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
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

    // Get project to check access
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        companyId: true,
        teamId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access based on role
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

    // Additional check for COMPANY_MANAGER/COMPANY_STAFF/COMPANY_CONTRACTOR: Must be team member
    if (
      user.role === "COMPANY_MANAGER" ||
      user.role === "COMPANY_STAFF" ||
      user.role === "COMPANY_CONTRACTOR"
    ) {
      const staffRecord = await db.companyStaff.findFirst({
        where: { userId, companyId: project.companyId },
        select: { id: true },
      });

      if (staffRecord) {
        // If project has no team, deny access to non-admin roles
        if (!project.teamId) {
          return NextResponse.json(
            { error: "This project is not assigned to a team" },
            { status: 403 }
          );
        }

        // Check if user is a member of the project's team
        const teamMember = await db.teamMember.findFirst({
          where: {
            teamId: project.teamId,
            staffId: staffRecord.id,
          },
        });

        if (!teamMember) {
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
    // SUPER_ADMIN, ADMIN_OWNER: Full access if they have company access

    // Build where clause - filter private tasks for company customers
    const isCustomer =
      user.role === "COMPANY_CUSTOMER" || user.role === "ERP_CUSTOMER";
    const whereClause: any = { projectId };

    // Company customers can only see public tasks (isPrivate = false)
    if (isCustomer) {
      whereClause.isPrivate = false;
    }

    // Get tasks (filtered by privacy if customer)
    const tasks = (await db.task.findMany({
      where: whereClause,
      include: {
        createdBy: {
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
    })) as TaskWithIncludes[];

    // Log activity for tasks list view
    await createAuditLog({
      userId,
      companyId: project.companyId,
      action: "TASKS_VIEWED",
      entityType: "Task",
      entityId: null,
      description: `Viewed tasks list for project (${tasks.length} tasks)`,
      metadata: {
        projectId,
        taskCount: tasks.length,
      },
    });

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/tasks - Create a new task
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { projectId } = await params;
    const body = await req.json();

    const {
      title,
      description,
      status = "TODO",
      priority = "MEDIUM",
      createdById,
      assignedToId,
      dueDate,
      isPrivate = false,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!createdById) {
      return NextResponse.json(
        { error: "Task creator is required" },
        { status: 400 }
      );
    }

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get project to check access and company
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { companyId: true, teamId: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions (company owner, team admin/manager, or SUPER_ADMIN)
    const company = await db.company.findFirst({
      where: {
        id: project.companyId,
        OR: [{ ownerId: userId }],
      },
    });

    // If project has no team, only company owner or SUPER_ADMIN can create tasks
    const teamMembership = project.teamId
      ? await db.teamMember.findFirst({
          where: {
            teamId: project.teamId,
            staff: { userId },
            role: { in: ["ADMIN_OWNER", "COMPANY_MANAGER"] },
          },
        })
      : null;

    if (!company && !teamMembership && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions to create tasks" },
        { status: 403 }
      );
    }

    // Validate status
    if (
      !["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "BLOCKED"].includes(
        status
      )
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate priority
    if (!["URGENT", "HIGH", "MEDIUM", "LOW"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    // Validate task creator (required)
    const creator = await db.companyStaff.findFirst({
      where: { id: createdById, companyId: project.companyId },
    });
    if (!creator) {
      return NextResponse.json(
        { error: "Task creator not found in this company" },
        { status: 400 }
      );
    }

    // Validate assigned staff if provided (optional)
    if (assignedToId) {
      const staff = await db.companyStaff.findFirst({
        where: { id: assignedToId, companyId: project.companyId },
      });
      if (!staff) {
        return NextResponse.json(
          { error: "Assigned staff not found in this company" },
          { status: 400 }
        );
      }
    }

    // Get the highest order value for this project
    const lastTask = await db.task.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const order = lastTask ? lastTask.order + 1 : 0;

    // Create task
    const task = (await db.task.create({
      data: {
        title,
        description,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        projectId,
        createdById,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPrivate: Boolean(isPrivate),
        order,
      },
      include: {
        createdBy: {
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
    })) as TaskWithIncludes;

    // Create audit log
    await createAuditLog({
      userId,
      companyId: project.companyId,
      action: "TASK_CREATED",
      entityType: "task",
      entityId: task.id,
      description: `Created task "${title}" in project ${project.name}`,
      metadata: { projectId, taskId: task.id },
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
