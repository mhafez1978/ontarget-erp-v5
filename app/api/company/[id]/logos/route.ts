import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { writeFile, unlink, readdir } from "fs/promises";
import { join, extname } from "path";
import { createAuditLog } from "@/lib/audit-log";

// POST - Upload multiple logos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user role and check ownership
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        ownedCompanies: {
          where: { id },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check authorization: SUPER_ADMIN can upload to any company, ADMIN can upload to their own companies
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.length > 0;

    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. You can only upload logos to companies you own.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("logos") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `${file.name} is not an image file` },
          { status: 400 }
        );
      }

      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: `${file.name} exceeds 2MB limit` },
          { status: 400 }
        );
      }
    }

    const uploadedLogos = [];

    // Process each file
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const extension = extname(file.name);
      const filename = `logo-${uniqueSuffix}${extension}`;

      const uploadDir = join(process.cwd(), "public", "uploads", "logos");
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);

      const logoUrl = `/uploads/logos/${filename}`;
      uploadedLogos.push({ url: logoUrl, filename });
    }

    // Create audit log
    await createAuditLog({
      userId,
      action: "UPDATE",
      entityType: "COMPANY",
      entityId: id,
      metadata: {
        field: "logos",
        action: "upload_multiple",
        count: uploadedLogos.length,
      },
    });

    return NextResponse.json({
      success: true,
      logos: uploadedLogos,
      message: `${uploadedLogos.length} logo(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Multiple logo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload logos" },
      { status: 500 }
    );
  }
}

// GET - List all uploaded logos for a company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user role and check ownership
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        ownedCompanies: {
          where: { id },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check authorization: SUPER_ADMIN can view any company logos, ADMIN can view their own company logos
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.length > 0;

    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json(
        {
          error: "Unauthorized. You can only view logos for companies you own.",
        },
        { status: 403 }
      );
    }

    // Read logos directory
    const uploadDir = join(process.cwd(), "public", "uploads", "logos");

    try {
      const files = await readdir(uploadDir);
      const logos = files
        .filter((file) => file !== ".gitkeep")
        .map((filename) => ({
          url: `/uploads/logos/${filename}`,
          filename,
        }));

      return NextResponse.json({
        success: true,
        logos,
      });
    } catch {
      // Directory doesn't exist or is empty
      return NextResponse.json({
        success: true,
        logos: [],
      });
    }
  } catch (error) {
    console.error("List logos error:", error);
    return NextResponse.json(
      { error: "Failed to list logos" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific logo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user role and check ownership
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        ownedCompanies: {
          where: { id },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check authorization: SUPER_ADMIN can delete any logo, ADMIN can delete their own company logos
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.length > 0;

    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. You can only delete logos for companies you own.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const logoUrl = searchParams.get("url");

    if (!logoUrl) {
      return NextResponse.json(
        { error: "Logo URL is required" },
        { status: 400 }
      );
    }

    // Extract filename from URL
    const filename = logoUrl.split("/").pop();
    if (!filename) {
      return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
    }

    // Delete file
    const filepath = join(
      process.cwd(),
      "public",
      "uploads",
      "logos",
      filename
    );

    try {
      await unlink(filepath);
    } catch (error) {
      console.error("File deletion error:", error);
      // File might not exist, continue anyway
    }

    // Check if this logo is assigned to any company and unassign it
    const companies = await db.company.findMany({
      where: {
        OR: [{ logoLight: logoUrl }, { logoDark: logoUrl }, { logo: logoUrl }],
      },
    });

    for (const company of companies) {
      const updateData: { logoLight?: null; logoDark?: null; logo?: null } = {};
      if (company.logoLight === logoUrl) updateData.logoLight = null;
      if (company.logoDark === logoUrl) updateData.logoDark = null;
      if (company.logo === logoUrl) updateData.logo = null;

      await db.company.update({
        where: { id: company.id },
        data: updateData,
      });
    }

    // Create audit log
    await createAuditLog({
      userId,
      action: "DELETE",
      entityType: "COMPANY",
      entityId: companies[0]?.id || "system",
      metadata: {
        field: "logo",
        action: "delete",
        filename,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Logo deleted successfully",
    });
  } catch (error) {
    console.error("Delete logo error:", error);
    return NextResponse.json(
      { error: "Failed to delete logo" },
      { status: 500 }
    );
  }
}
