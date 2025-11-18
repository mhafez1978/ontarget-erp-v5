import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { Prisma, TaskStatus, TaskPriority } from "@prisma/client";
import { validateSession } from "@/lib/session-manager";

// Type for task with includes
type TaskWithIncludes = Prisma.TaskGetPayload<{
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
    project: {
      select: {
        id: true;
        name: true;
        companyId: true;
        teamId: true;
      };
    };
  };
}>;

// GET /api/tasks/[taskId] - Get task details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
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

    const { taskId } = await params;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get task with project details
    const task = (await db.task.findUnique({
      where: { id: taskId },
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
        project: {
          select: {
            id: true,
            name: true,
            companyId: true,
            teamId: true,
          },
        },
      },
    })) as TaskWithIncludes | null;

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check access based on role
    const company = await db.company.findFirst({
      where: {
        id: task.project.companyId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { staff: { some: { userId } } },
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "You don't have access to this task" },
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
        where: { userId, companyId: task.project.companyId },
        select: { id: true },
      });

      if (staffRecord) {
        // If project has no team, deny access to non-admin roles
        if (!task.project.teamId) {
          return NextResponse.json(
            { error: "This task's project is not assigned to a team" },
            { status: 403 }
          );
        }

        // Check if user is a member of the project's team
        const teamMember = await db.teamMember.findFirst({
          where: {
            teamId: task.project.teamId,
            staffId: staffRecord.id,
          },
        });

        if (!teamMember) {
          return NextResponse.json(
            { error: "You don't have access to this task" },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "You don't have access to this task" },
          { status: 403 }
        );
      }
    }
    // SUPER_ADMIN, ADMIN: Full access if they have company access

    // Log activity for task detail view
    await createAuditLog({
      userId,
      companyId: task.project.companyId,
      action: "TASK_VIEWED",
      entityType: "Task",
      entityId: taskId,
      description: `Viewed task details: ${task.title}`,
      metadata: {
        taskTitle: task.title,
        projectId: task.project.id,
        projectName: task.project.name,
        status: task.status,
        priority: task.priority,
      },
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[taskId] - Update task
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
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

    const { taskId } = await params;
    const body = await req.json();

    const {
      title,
      description,
      status,
      priority,
      assignedToId,
      dueDate,
      order,
    } = body;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get task with project details
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        project: {
          select: {
            companyId: true,
            teamId: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check permissions (company owner, team admin/manager/staff, or SUPER_ADMIN)
    // Staff can update tasks assigned to them
    const company = await db.company.findFirst({
      where: {
        id: task.project.companyId,
        OR: [{ ownerId: userId }],
      },
    });

    // If project has no team, only company owner or SUPER_ADMIN can update tasks
    const teamMembership = task.project.teamId
      ? await db.teamMember.findFirst({
          where: {
            teamId: task.project.teamId,
            staff: { userId },
          },
        })
      : null;

    if (!company && !teamMembership && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions to update this task" },
        { status: 403 }
      );
    }

    // Validate status if provided
    if (
      status &&
      !["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "BLOCKED"].includes(
        status
      )
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Validate priority if provided
    if (priority && !["URGENT", "HIGH", "MEDIUM", "LOW"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    // Validate assigned staff if provided
    if (assignedToId !== undefined && assignedToId !== null) {
      const staff = await db.companyStaff.findFirst({
        where: { id: assignedToId, companyId: task.project.companyId },
      });
      if (!staff) {
        return NextResponse.json(
          { error: "Assigned staff not found in this company" },
          { status: 400 }
        );
      }
    }

    // Update task
    const updatedTask = (await db.task.update({
      where: { id: taskId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status: status as TaskStatus }),
        ...(priority && { priority: priority as TaskPriority }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(order !== undefined && { order }),
      },
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
        project: {
          select: {
            id: true,
            name: true,
            companyId: true,
            teamId: true,
          },
        },
      },
    })) as TaskWithIncludes;

    // Create audit log
    await createAuditLog({
      userId,
      companyId: task.project.companyId,
      action: "TASK_UPDATED",
      entityType: "task",
      entityId: taskId,
      description: `Updated task "${updatedTask.title}" in project ${task.project.name}`,
      metadata: { updates: body },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[taskId] - Delete task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
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

    const { taskId } = await params;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get task with project details
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        project: {
          select: {
            companyId: true,
            teamId: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check permissions (company owner, team admin/manager, or SUPER_ADMIN)
    const company = await db.company.findFirst({
      where: {
        id: task.project.companyId,
        OR: [{ ownerId: userId }],
      },
    });

    // If project has no team, only company owner or SUPER_ADMIN can delete tasks
    const teamMembership = task.project.teamId
      ? await db.teamMember.findFirst({
          where: {
            teamId: task.project.teamId,
            staff: { userId },
            role: { in: ["ADMIN", "MANAGER"] },
          },
        })
      : null;

    if (!company && !teamMembership && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions to delete this task" },
        { status: 403 }
      );
    }

    // Delete task
    await db.task.delete({
      where: { id: taskId },
    });

    // Create audit log
    await createAuditLog({
      userId,
      companyId: task.project.companyId,
      action: "TASK_DELETED",
      entityType: "task",
      entityId: taskId,
      description: `Deleted task "${task.title}" from project ${task.project.name}`,
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
