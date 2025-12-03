import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";

// GET /api/projects/[projectId]/notes - Get all notes for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const { projectId } = await params;

    // Verify user has access to this project
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        companyId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user belongs to the company
    const userStaff = await db.companyStaff.findFirst({
      where: {
        userId,
        companyId: project.companyId,
      },
    });

    if (!userStaff && validation.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all notes for the project
    const notes = await db.projectNote.findMany({
      where: { projectId },
      include: {
        author: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching project notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/notes - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const { projectId } = await params;
    const body = await request.json();
    const { content, timeEntry = 0 } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        companyId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get user's staff record
    const userStaff = await db.companyStaff.findFirst({
      where: {
        userId,
        companyId: project.companyId,
      },
    });

    if (!userStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create the note
    const note = await db.projectNote.create({
      data: {
        content,
        timeEntry: Math.max(0, Math.floor(timeEntry)),
        projectId,
        authorId: userStaff.id,
      },
      include: {
        author: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Create audit log for note creation
    await createAuditLog({
      userId,
      companyId: project.companyId,
      action: AUDIT_ACTIONS.NOTE_CREATED,
      entityType: ENTITY_TYPES.NOTE,
      entityId: note.id,
      description: `Created note in project (${content.substring(0, 50)}${
        content.length > 50 ? "..." : ""
      })`,
      metadata: {
        noteId: note.id,
        projectId,
        contentPreview: content.substring(0, 100),
        timeEntry: note.timeEntry,
      },
    });

    // If time was tracked, create time entry audit log
    if (note.timeEntry > 0) {
      await createAuditLog({
        userId,
        companyId: project.companyId,
        action: AUDIT_ACTIONS.TIME_ENTRY_CREATED,
        entityType: ENTITY_TYPES.NOTE,
        entityId: note.id,
        description: `Tracked ${note.timeEntry} minutes on project note`,
        metadata: {
          noteId: note.id,
          projectId,
          timeEntry: note.timeEntry,
          contentPreview: content.substring(0, 100),
        },
      });
    }

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating project note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
