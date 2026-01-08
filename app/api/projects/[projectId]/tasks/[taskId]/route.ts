import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";

// DELETE /api/projects/[projectId]/tasks/[taskId] - Delete a task
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const { projectId, taskId } = await params;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get task with project and permissions info
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            companyId: true,
            teamId: true,
            projectManagerId: true,
            teamLeadId: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.projectId !== projectId) {
      return NextResponse.json(
        { error: "Task does not belong to this project" },
        { status: 400 }
      );
    }

    // Get user's staff record
    const staffRecord = await db.companyStaff.findFirst({
      where: { userId, companyId: task.project.companyId },
      select: { id: true },
    });

    // Check permissions:
    // 1. SUPER_ADMIN can delete any task
    // 2. Task creator can delete their own task
    // 3. Project manager can delete any task in their project
    // 4. Team lead can delete any task in their project
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isTaskCreator = task.createdBy.userId === userId;
    const isProjectManager = task.project.projectManagerId === staffRecord?.id;
    const isTeamLead = task.project.teamLeadId === staffRecord?.id;

    if (!isSuperAdmin && !isTaskCreator && !isProjectManager && !isTeamLead) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only the task creator, project manager, or team lead can delete this task.",
        },
        { status: 403 }
      );
    }

    // Delete the task
    await db.task.delete({
      where: { id: taskId },
    });

    // Create audit log
    await createAuditLog({
      userId,
      companyId: task.project.companyId,
      action: "TASK_DELETED",
      entityType: "Task",
      entityId: taskId,
      description: `Deleted task "${task.title}" from project ${task.project.name}`,
      metadata: {
        taskId,
        taskTitle: task.title,
        projectId: task.projectId,
        projectName: task.project.name,
        deletedBy: user.role,
        wasCreator: isTaskCreator,
        wasProjectManager: isProjectManager,
        wasTeamLead: isTeamLead,
      },
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
