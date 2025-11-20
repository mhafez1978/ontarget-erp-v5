import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";

// PATCH /api/projects/[projectId]/notes/[noteId] - Update a note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; noteId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = validation.user.id;
    const { projectId, noteId } = await params;
    const body = await request.json();
    const { content, timeEntry } = body;

    // Verify note exists and belongs to the project
    const note = await db.projectNote.findUnique({
      where: { id: noteId },
      include: {
        project: {
          select: {
            id: true,
            companyId: true,
          },
        },
        author: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!note || note.projectId !== projectId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Verify user has access (must be author or super admin)
    if (
      note.author.userId !== userId &&
      validation.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Store old values for audit logging
    const oldTimeEntry = note.timeEntry || 0;
    const oldContent = note.content;

    // Update the note
    const updateData: { content?: string; timeEntry?: number } = {};
    if (content !== undefined) updateData.content = content;
    if (timeEntry !== undefined)
      updateData.timeEntry = Math.max(0, Math.floor(timeEntry));

    const updatedNote = await db.projectNote.update({
      where: { id: noteId },
      data: updateData,
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

    // Create audit logs for changes
    const auditLogs: Array<{
      action: string;
      description: string;
      metadata: Record<string, unknown>;
    }> = [];

    // Log note content update
    if (content !== undefined && content !== oldContent) {
      auditLogs.push({
        action: AUDIT_ACTIONS.NOTE_UPDATED,
        description: `Updated note content (${content.substring(0, 50)}${
          content.length > 50 ? "..." : ""
        })`,
        metadata: {
          noteId,
          projectId,
          contentPreview: content.substring(0, 100),
        },
      });
    }

    // Log time entry change
    if (timeEntry !== undefined && timeEntry !== oldTimeEntry) {
      const newTimeEntry = Math.max(0, Math.floor(timeEntry));
      const minutesChanged = newTimeEntry - oldTimeEntry;

      auditLogs.push({
        action: AUDIT_ACTIONS.TIME_ENTRY_UPDATED,
        description: `Time entry updated for note: ${
          minutesChanged > 0 ? "+" : ""
        }${minutesChanged} minutes`,
        metadata: {
          noteId,
          projectId,
          oldTimeEntry,
          newTimeEntry,
          minutesChanged,
          contentPreview: updatedNote.content.substring(0, 100),
        },
      });
    }

    // Write all audit logs
    await Promise.all(
      auditLogs.map((log) =>
        createAuditLog({
          userId,
          companyId: note.project.companyId,
          action: log.action,
          entityType: ENTITY_TYPES.NOTE,
          entityId: noteId,
          description: log.description,
          metadata: log.metadata,
        })
      )
    );

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error updating project note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]/notes/[noteId] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; noteId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = validation.user.id;
    const { projectId, noteId } = await params;

    // Verify note exists and belongs to the project
    const note = await db.projectNote.findUnique({
      where: { id: noteId },
      include: {
        project: {
          select: {
            id: true,
            companyId: true,
          },
        },
        author: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!note || note.projectId !== projectId) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Verify user has access (must be author or super admin)
    if (
      note.author.userId !== userId &&
      validation.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Store time entry for audit logging
    const oldTimeEntry = note.timeEntry || 0;

    // Delete the note
    await db.projectNote.delete({
      where: { id: noteId },
    });

    // Create audit log for note deletion
    await createAuditLog({
      userId,
      companyId: note.project.companyId,
      action: AUDIT_ACTIONS.NOTE_DELETED,
      entityType: ENTITY_TYPES.NOTE,
      entityId: noteId,
      description: `Deleted note (${note.content.substring(0, 50)}${
        note.content.length > 50 ? "..." : ""
      })`,
      metadata: {
        noteId,
        projectId,
        contentPreview: note.content.substring(0, 100),
      },
    });

    // If time was tracked, log time entry deletion
    if (oldTimeEntry > 0) {
      await createAuditLog({
        userId,
        companyId: note.project.companyId,
        action: AUDIT_ACTIONS.TIME_ENTRY_DELETED,
        entityType: ENTITY_TYPES.NOTE,
        entityId: noteId,
        description: `Deleted time entry (${oldTimeEntry} minutes) with note`,
        metadata: {
          noteId,
          projectId,
          timeEntry: oldTimeEntry,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
