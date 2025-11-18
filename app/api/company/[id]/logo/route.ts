import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";
import { createAuditLog } from "@/lib/audit-log";
import { validateSession } from "@/lib/session-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = validation.user;
    const userId = user.id;

    const { id: companyId } = await params;

    // Check if user owns the company or is super admin
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId },
          ...(user.role === "SUPER_ADMIN" ? [{ id: companyId }] : []),
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or insufficient permissions" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No logo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (2MB max for logos)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Logo size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const filename = `${companyId}-${timestamp}.${fileExtension}`;

    // Save to public/uploads/logos directory
    const uploadDir = join(process.cwd(), "public", "uploads", "logos");
    const filePath = join(uploadDir, filename);

    // Ensure directory exists
    const fs = await import("fs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filePath, buffer);

    // Update company's logo URL in database
    const logoUrl = `/uploads/logos/${filename}`;
    await db.company.update({
      where: { id: companyId },
      data: { logo: logoUrl },
    });

    // Log the audit action
    await createAuditLog({
      userId: user.id,
      action: "COMPANY_LOGO_UPDATED",
      entityType: "COMPANY",
      entityId: companyId,
      metadata: {
        logoUrl,
        fileName: filename,
        fileSize: file.size,
        companyName: company.name,
      },
    });

    return NextResponse.json({
      success: true,
      logoUrl,
      message: "Company logo uploaded successfully",
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}
