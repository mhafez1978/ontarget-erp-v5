import { NextResponse, NextRequest } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

// GET - List all files in company storage
export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;

    // Get user and verify they're ADMIN or SUPER_ADMIN
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Access Denied: Only admins can view files" },
        { status: 403 }
      );
    }

    // Get companyId from query
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const category = searchParams.get("category") || "All";

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID required" },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
                role: "ADMIN",
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        storageProvider: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 404 }
      );
    }

    // Get employment documents (HR-Docs category)
    const hrDocs = await db.employmentDocument.findMany({
      where: {
        staff: {
          companyId: companyId,
        },
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        primaryPath: true,
        storageProvider: true,
        uploadedAt: true,
        status: true,
        docType: true,
        staff: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    // Transform to file explorer format
    const files = hrDocs.map((doc) => ({
      id: doc.id,
      name: doc.fileName,
      size: doc.fileSize,
      type: doc.mimeType,
      path: doc.primaryPath,
      uploadedAt: doc.uploadedAt,
      category: "HR-Docs",
      status: doc.status,
      docType: doc.docType,
      employeeName: doc.staff.user.name,
      employeeEmail: doc.staff.user.email,
    }));

    // TODO: Add other categories (Invoices, Contracts, etc.)
    // For now, just return HR docs

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        storageProvider: company.storageProvider || "INHERIT",
      },
      files: category === "All" || category === "HR-Docs" ? files : [],
      totalSize: files.reduce((acc, file) => acc + file.size, 0),
      totalFiles: files.length,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
