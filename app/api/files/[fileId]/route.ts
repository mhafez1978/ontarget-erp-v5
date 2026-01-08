import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { downloadDocument, deleteDocument } from "@/lib/storage-service";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET - Download file
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params;

    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user: sessionUser } = validation;

    // Get user with company memberships
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        companyMemberships: true,
        ownedCompanies: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get file record
    const file = await db.fileRecord.findUnique({
      where: { id: fileId },
      include: {
        folder: {
          include: {
            company: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check user permissions
    const companyId = file.folder.companyId;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    const membership = user.companyMemberships.find(
      (m) => m.companyId === companyId
    );

    if (!isSuperAdmin && !ownsCompany && !membership) {
      return NextResponse.json(
        { error: "You do not have access to this file" },
        { status: 403 }
      );
    }

    // For EMPLOYEE/CONTRACTOR folders, check ownership
    if (
      (file.folder.type === "EMPLOYEE" || file.folder.type === "CONTRACTOR") &&
      file.folder.ownerId
    ) {
      if (
        !isSuperAdmin &&
        !ownsCompany &&
        file.folder.ownerId !== user.id &&
        membership?.role !== "ADMIN" &&
        membership?.role !== "MANAGER"
      ) {
        return NextResponse.json(
          { error: "You do not have permission to access this file" },
          { status: 403 }
        );
      }
    }

    // Download file from storage
    const fileBuffer = await downloadDocument(
      file.primaryPath,
      file.storageProvider
    );

    // Return file with appropriate headers
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
        "Content-Length": file.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete file
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params;

    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user: sessionUser } = validation;

    // Get user with company memberships
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        companyMemberships: true,
        ownedCompanies: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get file record
    const file = await db.fileRecord.findUnique({
      where: { id: fileId },
      include: {
        folder: {
          include: {
            company: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check user permissions - stricter for delete
    const companyId = file.folder.companyId;
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    const membership = user.companyMemberships.find(
      (m) => m.companyId === companyId
    );
    const isFileOwner = file.uploadedById === user.id;

    // Permission rules for delete:
    // - SUPER_ADMIN: Can delete any file
    // - Company owner (ADMIN role in User model): Can delete any file in their company
    // - ADMIN in CompanyMember: Can delete any file in their company
    // - MANAGER in CompanyMember: Can delete any file in their company
    // - STAFF/CONTRACTOR: Can only delete files they uploaded
    const canDelete =
      isSuperAdmin ||
      ownsCompany ||
      membership?.role === "ADMIN" ||
      membership?.role === "MANAGER" ||
      isFileOwner;

    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to delete this file. Staff members can only delete files they uploaded.",
        },
        { status: 403 }
      );
    }

    // Delete file from storage
    await deleteDocument(file.primaryPath, file.storageProvider);

    // Delete backup if exists
    if (file.backupPath) {
      try {
        await deleteDocument(file.backupPath, file.storageProvider);
      } catch (error) {
        console.error("Failed to delete backup file:", error);
        // Continue even if backup deletion fails
      }
    }

    // Delete file record from database
    await db.fileRecord.delete({
      where: { id: fileId },
    });

    // Update folder file count
    await db.fileFolder.update({
      where: { id: file.folderId },
      data: {
        fileCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
