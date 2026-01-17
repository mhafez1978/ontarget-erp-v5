import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { downloadDocument } from "@/lib/storage-service";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(
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

    // Check if user has access (owns the file, is admin of company, or is super admin)
    let hasAccess = false;

    if (fileRecord.staff.userId === userId) {
      // User is the owner of the document
      hasAccess = true;
    } else if (
      user.role === "SUPER_ADMIN" ||
      user.role === "ADMIN_OWNER" ||
      user.role === "ADMIN_NONOWNER"
    ) {
      // Check if user has access to the company
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

      hasAccess = !!company;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this file" },
        { status: 403 }
      );
    }

    // Download file from storage
    const fileBuffer = await downloadDocument(
      fileRecord.primaryPath,
      fileRecord.storageProvider
    );

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": fileRecord.mimeType,
        "Content-Disposition": `attachment; filename="${fileRecord.fileName}"`,
        "Content-Length": fileRecord.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("[Download File Error]:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
