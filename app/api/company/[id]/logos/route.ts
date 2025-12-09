import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, unlink, readdir, mkdir } from "fs/promises";
import { join, extname } from "path";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";

/**
 * Check if cold storage is configured
 */
async function hasStorageConfigured(): Promise<boolean> {
  const globalStorage = await db.storageProvider.findFirst({
    where: {
      scope: "GLOBAL",
      isActive: true,
      isConnected: true,
    },
  });
  return !!globalStorage && globalStorage.provider !== "LOCAL";
}

/**
 * Convert file buffer to base64 data URL
 */
function bufferToDataURL(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

// POST - Upload multiple logos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

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

    // Check if cold storage is configured
    const storageConfigured = await hasStorageConfigured();
    const uploadedLogos = [];

    // Process each file
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      let logoUrl: string;
      let filename: string;

      if (storageConfigured) {
        // Storage configured → save to filesystem (will be migrated to cold storage later)
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = extname(file.name);
        filename = `logo-${uniqueSuffix}${extension}`;

        // Create company-specific directory
        const uploadDir = join(process.cwd(), "public", "uploads", "logos", id);

        // Ensure directory exists
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch {
          // Directory might already exist, ignore error
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        logoUrl = `/uploads/logos/${id}/${filename}`;
      } else {
        // No storage configured → convert to base64 and store in DB
        logoUrl = bufferToDataURL(buffer, file.type);
        filename = file.name;
      }

      uploadedLogos.push({ url: logoUrl, filename });
    }

    // If using base64 storage, save to uploadedLogos JSON field for preview
    if (!storageConfigured && uploadedLogos.length > 0) {
      const company = await db.company.findUnique({
        where: { id },
        select: { uploadedLogos: true },
      });

      const existingLogos =
        (company?.uploadedLogos as { url: string; filename: string }[]) || [];
      const updatedLogos = [...existingLogos, ...uploadedLogos];

      await db.company.update({
        where: { id },
        data: {
          uploadedLogos: updatedLogos,
        },
      });
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
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

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

    // Check if storage is configured
    const storageConfigured = await hasStorageConfigured();
    let logos: { url: string; filename: string }[] = [];

    if (storageConfigured) {
      // Storage configured → read from filesystem
      const uploadDir = join(process.cwd(), "public", "uploads", "logos", id);

      try {
        const files = await readdir(uploadDir);
        logos = files
          .filter((file) => file !== ".gitkeep")
          .map((filename) => ({
            url: `/uploads/logos/${id}/${filename}`,
            filename,
          }));
      } catch {
        // Directory doesn't exist or is empty
        logos = [];
      }
    } else {
      // No storage → logos are stored as base64 in the database
      const company = await db.company.findUnique({
        where: { id },
        select: {
          logo: true,
          logoLight: true,
          logoDark: true,
          uploadedLogos: true,
        },
      });

      if (company) {
        // Start with uploaded logos from JSON field
        const uploadedFromJson =
          (company.uploadedLogos as { url: string; filename: string }[]) || [];
        logos = [...uploadedFromJson];

        // Also add assigned logos that aren't already in the list
        const assignedUrls = logos.map((l) => l.url);

        if (
          company.logoLight &&
          company.logoLight.startsWith("data:") &&
          !assignedUrls.includes(company.logoLight)
        ) {
          logos.push({
            url: company.logoLight,
            filename: "logo-light",
          });
        }
        if (
          company.logoDark &&
          company.logoDark.startsWith("data:") &&
          !assignedUrls.includes(company.logoDark)
        ) {
          logos.push({ url: company.logoDark, filename: "logo-dark" });
        }
        if (
          company.logo &&
          company.logo.startsWith("data:") &&
          !assignedUrls.includes(company.logo)
        ) {
          logos.push({ url: company.logo, filename: "logo" });
        }
      }
    }

    return NextResponse.json({
      success: true,
      logos,
    });
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
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

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

    // Check if this is a filesystem logo or base64
    const isBase64Logo = logoUrl.startsWith("data:");
    let filename = "base64-logo";

    if (!isBase64Logo) {
      // Extract filename from URL (handle company-specific path)
      const urlParts = logoUrl.split("/");
      const extractedFilename = urlParts.pop();
      if (!extractedFilename) {
        return NextResponse.json(
          { error: "Invalid logo URL" },
          { status: 400 }
        );
      }
      filename = extractedFilename;

      // Delete file from company-specific directory
      const filepath = join(
        process.cwd(),
        "public",
        "uploads",
        "logos",
        id,
        filename
      );

      try {
        await unlink(filepath);
      } catch (error) {
        console.error("File deletion error:", error);
        // File might not exist, continue anyway
      }
    }

    // Check if this logo is assigned to any company and unassign it
    const companies = await db.company.findMany({
      where: {
        OR: [{ logoLight: logoUrl }, { logoDark: logoUrl }, { logo: logoUrl }],
      },
      select: {
        id: true,
        logo: true,
        logoLight: true,
        logoDark: true,
        uploadedLogos: true,
      },
    });

    for (const company of companies) {
      const updateData: {
        logoLight?: null;
        logoDark?: null;
        logo?: null;
        uploadedLogos?: { url: string; filename: string }[];
      } = {};

      if (company.logoLight === logoUrl) updateData.logoLight = null;
      if (company.logoDark === logoUrl) updateData.logoDark = null;
      if (company.logo === logoUrl) updateData.logo = null;

      // Also remove from uploadedLogos JSON field if it's there
      if (company.uploadedLogos) {
        const uploadedLogos = company.uploadedLogos as {
          url: string;
          filename: string;
        }[];
        const filteredLogos = uploadedLogos.filter(
          (logo) => logo.url !== logoUrl
        );
        if (filteredLogos.length !== uploadedLogos.length) {
          updateData.uploadedLogos = filteredLogos;
        }
      }

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
