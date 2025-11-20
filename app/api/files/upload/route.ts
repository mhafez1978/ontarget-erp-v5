import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadDocument } from "@/lib/storage-service";
import { validateSessionForAPI } from "@/lib/validate-session";
import { PLAN_LIMITS, calculateExtraStorageCost } from "@/lib/plan-limits";

export const runtime = "nodejs";

// Maximum file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;

    // Get user with company memberships
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        companyMemberships: {
          include: {
            company: true,
          },
        },
        ownedCompanies: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string | null;
    const companyId = formData.get("companyId") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 100MB" },
        { status: 400 }
      );
    }

    // Get folder and validate access
    const folder = await db.fileFolder.findUnique({
      where: { id: folderId },
      include: {
        company: {
          include: {
            owner: true,
            subscriberSubscriptions: {
              where: { status: { in: ["TRIAL", "ACTIVE"] } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder.companyId !== companyId) {
      return NextResponse.json(
        { error: "Folder does not belong to specified company" },
        { status: 400 }
      );
    }

    // Check storage limit (skip for SUPER_USER)
    if (folder.company.owner.plan !== "SUPER_USER") {
      const plan =
        folder.company.subscriberSubscriptions[0]?.plan || "ESSENTIAL";
      const planLimits = PLAN_LIMITS[plan];
      const fileSizeGB = file.size / (1024 * 1024 * 1024);
      const currentStorageGB = folder.company.storageUsedGB || 0;
      const newTotalGB = currentStorageGB + fileSizeGB;

      if (
        planLimits.storageGB !== Infinity &&
        newTotalGB > planLimits.storageGB
      ) {
        const { overageGB, monthlyCost } = calculateExtraStorageCost(
          newTotalGB,
          plan
        );

        return NextResponse.json(
          {
            error: `Storage limit exceeded. Your ${plan} plan includes ${
              planLimits.storageGB
            } GB. This upload would use ${newTotalGB.toFixed(
              2
            )} GB (${overageGB.toFixed(
              2
            )} GB over limit). Extra storage costs $${monthlyCost.toFixed(
              2
            )}/month. Please upgrade your plan or purchase additional storage.`,
            limit: planLimits.storageGB,
            current: currentStorageGB,
            newTotal: newTotalGB,
            overageCost: monthlyCost,
          },
          { status: 403 }
        );
      }
    }

    // Check user permissions
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    const isMember = user.companyMemberships.some(
      (m) => m.companyId === companyId
    );

    if (!isSuperAdmin && !ownsCompany && !isMember) {
      return NextResponse.json(
        { error: "You do not have access to this company" },
        { status: 403 }
      );
    }

    // For EMPLOYEE/CONTRACTOR folders, verify ownership
    if (
      (folder.type === "EMPLOYEE" || folder.type === "CONTRACTOR") &&
      folder.ownerId
    ) {
      const membership = user.companyMemberships.find(
        (m) => m.companyId === companyId
      );

      // Only super admin, company owner, or folder owner can upload
      if (
        !isSuperAdmin &&
        !ownsCompany &&
        folder.ownerId !== user.id &&
        membership?.role !== "ADMIN"
      ) {
        return NextResponse.json(
          { error: "You do not have permission to upload to this folder" },
          { status: 403 }
        );
      }
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine category based on folder path
    const pathParts = folder.path.split("/");
    let category: "HR-Docs" | "Invoices" | "Contracts" | "Other" = "Other";

    if (pathParts.length > 1) {
      const folderCategory = pathParts[1];
      if (
        folderCategory === "HR-Docs" ||
        folderCategory === "Invoices" ||
        folderCategory === "Contracts"
      ) {
        category = folderCategory;
      }
    }

    // Upload to storage service
    const uploadResult = await uploadDocument(
      companyId,
      category,
      file.name,
      buffer,
      file.type || "application/octet-stream"
    );

    // Create file record in database
    const fileRecord = await db.fileRecord.create({
      data: {
        folderId: folderId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        primaryPath: uploadResult.primaryPath,
        backupPath: uploadResult.backupPath || null,
        storageProvider: uploadResult.storageProvider,
        uploadedById: user.id,
        description: description || null,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    // Update folder file count
    await db.fileFolder.update({
      where: { id: folderId },
      data: {
        fileCount: {
          increment: 1,
        },
      },
    });

    // Update company storage usage
    const fileSizeGB = file.size / (1024 * 1024 * 1024);
    await db.company.update({
      where: { id: companyId },
      data: {
        storageUsedGB: {
          increment: fileSizeGB,
        },
      },
    });

    return NextResponse.json({
      success: true,
      file: fileRecord,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
