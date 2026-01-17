import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/projects/[projectId]/progress - Get real-time project progress
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
        id: true,
        name: true,
        companyId: true,
        teamId: true,
        status: true,
        startDate: true,
        endDate: true,
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

    // Get all tasks for progress calculation
    const tasks = await db.task.findMany({
      where: { projectId },
      select: {
        id: true,
        status: true,
        priority: true,
        dueDate: true,
      },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate task breakdowns
    const tasksByStatus = {
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      inReview: tasks.filter((t) => t.status === "IN_REVIEW").length,
      completed: completedTasks,
      blocked: tasks.filter((t) => t.status === "BLOCKED").length,
    };

    const tasksByPriority = {
      urgent: tasks.filter((t) => t.priority === "URGENT").length,
      high: tasks.filter((t) => t.priority === "HIGH").length,
      medium: tasks.filter((t) => t.priority === "MEDIUM").length,
      low: tasks.filter((t) => t.priority === "LOW").length,
    };

    // Calculate overdue tasks (if dueDate < today and status != COMPLETED)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== "COMPLETED"
    ).length;

    // Calculate time progress (if project has dates)
    let timeProgress = null;
    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate).getTime();
      const end = new Date(project.endDate).getTime();
      const now = Date.now();

      if (now >= end) {
        timeProgress = 100;
      } else if (now <= start) {
        timeProgress = 0;
      } else {
        timeProgress = ((now - start) / (end - start)) * 100;
      }
    }

    // Log activity for progress view
    await createAuditLog({
      userId,
      companyId: project.companyId,
      action: "PROJECT_PROGRESS_VIEWED",
      entityType: "Project",
      entityId: projectId,
      description: `Viewed progress for project: ${project.name}`,
      metadata: {
        projectName: project.name,
        percentage: Math.round(percentage),
        totalTasks,
        completedTasks,
        overdueTasks,
      },
    });

    return NextResponse.json({
      success: true,
      progress: {
        percentage: Math.round(percentage),
        totalTasks,
        completedTasks,
        remainingTasks: totalTasks - completedTasks,
        overdueTasks,
        tasksByStatus,
        tasksByPriority,
        timeProgress: timeProgress ? Math.round(timeProgress) : null,
        projectStatus: project.status,
        projectName: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
      },
    });
  } catch (error) {
    console.error("Error fetching project progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch project progress" },
      { status: 500 }
    );
  }
}
