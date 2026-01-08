import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { fileId } = await params;

    // Fetch file record
    const fileRecord = await db.employmentDocument.findUnique({
      where: { id: fileId },
      include: {
        staff: {
          include: {
            company: true,
            user: true,
          },
        },
      },
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check access rights
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only SUPER_ADMIN can delete files
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admins can delete files" },
        { status: 403 }
      );
    }

    // Verify user owns the company
    const company = await db.company.findFirst({
      where: {
        id: fileRecord.staff.companyId,
        OR: [
          { ownerId: user.id },
          {
            subscriberSubscriptions: {
              some: {
                rootCompany: {
                  ownerId: user.id,
                },
                status: {
                  in: ["ACTIVE", "TRIAL"],
                },
              },
            },
          },
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // TODO: Delete physical file from storage
    // await deleteDocument(fileRecord.primaryPath, fileRecord.storageProvider);
    // if (fileRecord.backupPath) {
    //   await deleteDocument(fileRecord.backupPath, fileRecord.storageProvider);
    // }

    // Delete database record
    await db.employmentDocument.delete({
      where: { id: fileId },
    });

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("[Delete File Error]:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
