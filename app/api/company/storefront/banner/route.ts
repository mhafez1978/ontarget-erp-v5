import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          select: { id: true },
        },
        companyMemberships: {
          select: { companyId: true, role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get first owned company or first admin/manager membership
    const companyId =
      user.ownedCompanies[0]?.id ||
      user.companyMemberships.find(
        (m) =>
          m.role === "ADMIN_OWNER" ||
          m.role === "ADMIN_NONOWNER" ||
          m.role === "COMPANY_MANAGER"
      )?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 404 }
      );
    }

    // Only company admins (owner/non-owner), COMPANY_MANAGER and SUPER_ADMIN can upload banners
    if (
      user.role !== "ADMIN_OWNER" &&
      user.role !== "ADMIN_NONOWNER" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "COMPANY_MANAGER"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("banner") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No banner file provided" },
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

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const filename = `banner-${timestamp}.${fileExtension}`;

    // Save to public/uploads/banners/{companyId} directory
    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      "banners",
      companyId
    );
    const filePath = join(uploadDir, filename);

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filePath, buffer);

    // Update company's banner URL in database
    const bannerUrl = `/uploads/banners/${companyId}/${filename}`;
    await db.company.update({
      where: { id: companyId },
      data: { storeBanner: bannerUrl },
    });

    return NextResponse.json({
      success: true,
      bannerUrl,
      message: "Banner uploaded successfully",
    });
  } catch (error) {
    console.error("Banner upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload banner" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          select: { id: true, storeBanner: true },
        },
        companyMemberships: {
          select: { companyId: true, role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get first owned company or first admin/manager membership
    const companyId =
      user.ownedCompanies[0]?.id ||
      user.companyMemberships.find(
        (m) =>
          m.role === "ADMIN_OWNER" ||
          m.role === "ADMIN_NONOWNER" ||
          m.role === "COMPANY_MANAGER"
      )?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 404 }
      );
    }

    // Only company admins (owner/non-owner), COMPANY_MANAGER and SUPER_ADMIN can delete banners
    if (
      user.role !== "ADMIN_OWNER" &&
      user.role !== "ADMIN_NONOWNER" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "COMPANY_MANAGER"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get current banner URL
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { storeBanner: true },
    });

    if (!company?.storeBanner) {
      return NextResponse.json(
        { error: "No banner to delete" },
        { status: 404 }
      );
    }

    // Delete the file from filesystem
    try {
      const filePath = join(process.cwd(), "public", company.storeBanner);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fsError) {
      console.error("Error deleting banner file:", fsError);
      // Continue even if file deletion fails
    }

    // Update company's banner URL to null in database
    await db.company.update({
      where: { id: companyId },
      data: { storeBanner: null },
    });

    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Banner delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
