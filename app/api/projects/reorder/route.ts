import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";
import { ProjectStatus } from "@prisma/client";

// PATCH /api/projects/reorder - Reorder projects within a status lane
export async function PATCH(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const body = await req.json();

    const { projectId, status, newOrder } = body;

    if (!projectId || !status || typeof newOrder !== "number") {
      return NextResponse.json(
        { error: "Project ID, status, and new order are required" },
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

    // Get the project
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        companyId: true,
        sortOrder: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this company
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
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // Get all projects in the same status lane for this company
    const projectsInLane = await db.project.findMany({
      where: {
        companyId: project.companyId,
        status: status as ProjectStatus,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        sortOrder: true,
      },
    });

    // Calculate new sort orders for all projects in the lane
    const updates: { id: string; sortOrder: number }[] = [];

    // Remove the dragged project from its current position
    const filteredProjects = projectsInLane.filter((p) => p.id !== projectId);

    // Insert it at the new position
    filteredProjects.splice(newOrder, 0, {
      id: projectId,
      sortOrder: project.sortOrder ?? 0,
    });

    // Assign new sort orders
    filteredProjects.forEach((p, index) => {
      updates.push({
        id: p.id,
        sortOrder: index,
      });
    });

    // Update all projects in a transaction
    await db.$transaction(
      updates.map((update) =>
        db.project.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );

    // Create audit log
    await createAuditLog({
      userId,
      companyId: project.companyId,
      action: AUDIT_ACTIONS.PROJECT_UPDATED,
      entityType: ENTITY_TYPES.PROJECT,
      entityId: projectId,
      description: `Reordered project: ${project.name} in ${status} lane`,
      metadata: {
        projectName: project.name,
        status,
        oldOrder: project.sortOrder,
        newOrder,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Project reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering project:", error);
    return NextResponse.json(
      { error: "Failed to reorder project" },
      { status: 500 }
    );
  }
}
