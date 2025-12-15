import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, unlink, readdir, mkdir } from "fs/promises";
import { join, extname, resolve } from "path";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getStorageConfig } from "@/lib/storage-config";

/**
 * Check if cold storage is configured
 * @deprecated Use getStorageConfig from @/lib/storage-config instead
 */
async function hasStorageConfigured(): Promise<{
  configured: boolean;
  provider: string;
  basePath: string;
} | null> {
  return getStorageConfig();
}
/**
 * Extract filename from common urls like /uploads/logos/{id}/{file} or full URLs
 */
function filenameFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const p = new URL(url).pathname;
      return p.split("/").pop() || null;
    }

    // Also handle data: urls
    if (url.startsWith("data:")) {
      return null;
    }

    // Fallback: path-like url
    const parts = url.split("/");
    return parts.pop() || null;
  } catch (error) {
    return null;
  }
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
    const storageConfig = await hasStorageConfigured();
    console.log("[POST Logos] Storage config:", storageConfig);
    console.log("[POST Logos] Company ID:", id);
    console.log("[POST Logos] Files to upload:", files.length);

    const uploadedLogos = [];

    // Process each file
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      console.log(
        `[POST Logos] Processing file: ${file.name}, size: ${buffer.length} bytes`
      );

      let logoUrl: string;
      let filename: string;

      if (storageConfig) {
        // Storage configured → save to cold storage
        console.log(
          `[POST Logos] Using cold storage: ${storageConfig.provider}`
        );
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = extname(file.name);
        filename = `logo-${uniqueSuffix}${extension}`;

        // Create company-specific directory in cold storage (resolve absolute path)
        const uploadDir = resolve(storageConfig.basePath, "logos", id);
        console.log(`[POST Logos] Upload directory: ${uploadDir}`);

        // Ensure directory exists
        try {
          await mkdir(uploadDir, { recursive: true });
          console.log(`[POST Logos] Directory created/verified: ${uploadDir}`);
        } catch (mkdirError) {
          console.error(
            `[POST Logos] Failed to create directory ${uploadDir}:`,
            mkdirError
          );
          throw new Error(
            `Failed to create storage directory: ${mkdirError instanceof Error ? mkdirError.message : "Unknown error"}. Check volume permissions (needs UID 1001 write access).`
          );
        }

        const filepath = resolve(uploadDir, filename);
        try {
          await writeFile(filepath, buffer);
          console.log(`[POST Logos] File written to: ${filepath}`);
        } catch (writeError) {
          console.error(
            `[POST Logos] Failed to write file ${filepath}:`,
            writeError
          );
          throw new Error(
            `Failed to write file: ${writeError instanceof Error ? writeError.message : "Unknown error"}. Check volume permissions (needs UID 1001 write access).`
          );
        }

        // Return path for serving via /uploads/logos route
        logoUrl = `/uploads/logos/${id}/${filename}`;
      } else {
        // No storage configured → convert to base64
        console.log(`[POST Logos] No storage configured, converting to base64`);
        logoUrl = bufferToDataURL(buffer, file.type);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        filename = `${file.name.replace(
          /\.[^/.]+$/,
          ""
        )}-${uniqueSuffix}${extname(file.name)}`;
        console.log(
          `[POST Logos] Base64 URL length: ${logoUrl.length}, filename: ${filename}`
        );
      }

      uploadedLogos.push({ url: logoUrl, filename });
    }

    console.log(`[POST Logos] Total logos processed: ${uploadedLogos.length}`);

    // If no storage, save base64 logos to Company.uploadedLogos JSON field
    if (!storageConfig) {
      console.log(`[POST Logos] Saving to DB uploadedLogos field`);
      const company = await db.company.findUnique({
        where: { id },
        select: { uploadedLogos: true },
      });

      console.log(`[POST Logos] Existing logos in DB:`, company?.uploadedLogos);

      const existingLogos =
        (company?.uploadedLogos as Array<{ url: string; filename: string }>) ||
        [];
      const updatedLogos = [...existingLogos, ...uploadedLogos];

      console.log(
        `[POST Logos] Updating DB with ${updatedLogos.length} total logos`
      );

      await db.company.update({
        where: { id },
        data: { uploadedLogos: updatedLogos },
      });

      console.log(`[POST Logos] DB updated successfully`);
    } else {
      console.log(
        `[POST Logos] Storage configured, logos saved to filesystem, skipping DB update`
      );
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
        storageType: storageConfig
          ? `COLD_STORAGE_${storageConfig.provider}`
          : "DB_BASE64_FALLBACK",
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
    const storageConfig = await hasStorageConfigured();
    let logos: { url: string; filename: string }[] = [];

    console.log("[GET Logos] Storage config:", storageConfig);
    console.log("[GET Logos] Company ID:", id);

    if (storageConfig) {
      // Storage configured → read from filesystem
      const uploadDir = resolve(storageConfig.basePath, "logos", id);
      console.log("[GET Logos] Reading from directory:", uploadDir);

      try {
        const files = await readdir(uploadDir);
        console.log("[GET Logos] Files found:", files);
        logos = files
          .filter((file) => file !== ".gitkeep")
          .map((filename) => ({
            url: `/uploads/logos/${id}/${filename}`,
            filename,
          }));
        console.log("[GET Logos] Filtered logos:", logos);
      } catch (error) {
        // Directory doesn't exist or is empty
        console.log("[GET Logos] Directory read error:", error);
        logos = [];
      }
      // If storage is configured but no logos were found from the filesystem,
      // attempt to read the DB uploadedLogos and the assigned logo fields so
      // the UI can still show assigned logos (base64 or DB stored entries).
      if (logos.length === 0) {
        console.log(
          "[GET Logos] No files found in storage, reading DB uploadedLogos as fallback"
        );
        const companyFallback = await db.company.findUnique({
          where: { id },
          select: {
            uploadedLogos: true,
            logo: true,
            logoLight: true,
            logoDark: true,
          },
        });

        if (companyFallback?.uploadedLogos) {
          logos = companyFallback.uploadedLogos as Array<{
            url: string;
            filename: string;
          }>;
        } else {
          logos = [];
        }
        // Include assigned logo fields in the response as well so theme previews are deletable
        const addLogoIfMissing = (url?: string | null, label?: string) => {
          if (!url) return;
          if (!logos.some((l) => l.url === url)) {
            logos.push({
              url,
              filename: label || (url.split("/").pop() ?? "logo"),
            });
          }
        };
        addLogoIfMissing(companyFallback?.logo, "logo");
        addLogoIfMissing(companyFallback?.logoLight, "logoLight");
        addLogoIfMissing(companyFallback?.logoDark, "logoDark");
      }
    } else {
      // No storage → read from uploadedLogos JSON field
      console.log("[GET Logos] No storage configured, reading from DB");
      const company = await db.company.findUnique({
        where: { id },
        select: { uploadedLogos: true },
      });

      console.log(
        "[GET Logos] Company uploadedLogos field:",
        company?.uploadedLogos
      );

      if (company?.uploadedLogos) {
        logos = company.uploadedLogos as Array<{
          url: string;
          filename: string;
        }>;
      } else {
        logos = [];
      }
      // Also include assigned theme logos if present
      const addLogoIfMissing = (url?: string | null, label?: string) => {
        if (!url) return;
        if (!logos.some((l) => l.url === url)) {
          logos.push({
            url,
            filename: label || (url.split("/").pop() ?? "logo"),
          });
        }
      };
      const companyRecord = await db.company.findUnique({
        where: { id },
        select: { logo: true, logoLight: true, logoDark: true },
      });
      addLogoIfMissing(companyRecord?.logo, "logo");
      addLogoIfMissing(companyRecord?.logoLight, "logoLight");
      addLogoIfMissing(companyRecord?.logoDark, "logoDark");
    }

    console.log("[GET Logos] Returning logos:", logos);

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

    // Check authorization: SUPER_ADMIN can delete logos from any company
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

    // SUPER_ADMIN bypass: no further ownership check needed
    // Non-super-admins must own the company (already verified above)

    const { searchParams } = new URL(request.url);
    let logoUrl = searchParams.get("url");

    // If no url param was provided (or it's a very long base64), accept JSON body { url }
    if (!logoUrl) {
      try {
        const body = await request.json();
        logoUrl = body?.url;
        console.log("[DELETE Logos] Read logo URL from request body");
      } catch (err) {
        console.log(
          "[DELETE Logos] No URL in query params and failed to parse request body",
          err
        );
      }
    }

    if (!logoUrl) {
      return NextResponse.json(
        { error: "Logo URL is required" },
        { status: 400 }
      );
    }

    // Check if storage is configured
    const storageConfig = await hasStorageConfigured();
    const isBase64Logo = logoUrl.startsWith("data:");
    let filename = "base64-logo";

    // Try to delete from storage (prefer cold storage if configured), then
    // always clear any references from the DB uploadedLogos JSON field so the
    // UI no longer shows the logo.
    const storageBasePath = storageConfig?.basePath ?? "";
    const isFilenameUrl = !isBase64Logo;
    let fileDeletedFromStorage = false;
    let dbRemovedFromUploadedLogos = false;

    if (isFilenameUrl) {
      // Extract filename safely
      try {
        const extractedFilename = filenameFromUrl(logoUrl);
        filename = extractedFilename || filename;

        // Prefer deletion from configured storage base path
        if (storageBasePath) {
          const filepath = join(storageBasePath, "logos", id, filename);
          try {
            await unlink(filepath);
            fileDeletedFromStorage = true;
            console.log(
              "[DELETE Logos] Removed file from storage basePath:",
              filepath
            );
          } catch (error) {
            console.log(
              "[DELETE Logos] Failed to delete from storage basePath:",
              filepath,
              error
            );
          }
        }

        // Fallback to public uploads path (if it exists)
        if (!fileDeletedFromStorage) {
          const publicPath = resolve(
            process.cwd(),
            "public",
            "uploads",
            "logos",
            id,
            filename
          );
          try {
            await unlink(publicPath);
            fileDeletedFromStorage = true;
            console.log(
              "[DELETE Logos] Removed file from public uploads path:",
              publicPath
            );
          } catch (error) {
            console.log(
              "[DELETE Logos] Failed to delete from public path:",
              publicPath,
              error
            );
          }
        }
      } catch (err) {
        console.error("[DELETE Logos] Error extracting filename:", err);
      }
    }

    // Always remove any references from the uploadedLogos DB JSON field, this
    // works both for base64 data urls and for path urls recorded in the DB.
    try {
      const company = await db.company.findUnique({
        where: { id },
        select: { uploadedLogos: true },
      });
      const existingLogos =
        (company?.uploadedLogos as Array<{ url: string; filename: string }>) ||
        [];
      const updatedLogos = existingLogos.filter((l) => l.url !== logoUrl);

      dbRemovedFromUploadedLogos = updatedLogos.length !== existingLogos.length;
      if (dbRemovedFromUploadedLogos) {
        await db.company.update({
          where: { id },
          data: { uploadedLogos: updatedLogos },
        });
        console.log(
          "[DELETE Logos] Removed logo entry from DB uploadedLogos field for company:",
          id
        );
      }
    } catch (err) {
      console.error(
        "[DELETE Logos] Error removing logo from DB uploadedLogos field:",
        err
      );
    }

    // Check if this logo is assigned to any company and unassign it
    console.log(
      "[DELETE Logos] Unassigning theme logo if present for URL:",
      logoUrl
    );
    const companies = await db.company.findMany({
      where: {
        OR: [{ logoLight: logoUrl }, { logoDark: logoUrl }, { logo: logoUrl }],
      },
    });

    for (const company of companies) {
      const updateData: {
        logoLight?: null;
        logoDark?: null;
        logo?: null;
      } = {};

      if (company.logoLight === logoUrl) updateData.logoLight = null;
      if (company.logoDark === logoUrl) updateData.logoDark = null;
      if (company.logo === logoUrl) updateData.logo = null;

      await db.company.update({
        where: { id: company.id },
        data: updateData,
      });
      console.log(
        "[DELETE Logos] Unassigned logo fields for company:",
        company.id,
        updateData
      );
    }

    // Create audit log
    await createAuditLog({
      userId,
      action: "DELETE",
      entityType: "COMPANY",
      entityId: companies[0]?.id || id,
      metadata: {
        field: "logo",
        action: "delete",
        filename,
        deletedFromStorage: fileDeletedFromStorage,
        removedFromUploadedLogos: dbRemovedFromUploadedLogos,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Logo deleted successfully",
    });
  } catch (error) {
    console.error("Delete logo error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete logo";
    return NextResponse.json(
      { error: "Failed to delete logo", details: errorMessage },
      { status: 500 }
    );
  }
}

// OPTIONS - CORS preflight for cross-origin DELETE requests (if deployed behind cross-origin frontends)
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Useful to log the request origin for debugging CORS issues
    console.log("[OPTIONS Logos] Received CORS preflight for:", request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };

    return NextResponse.json({ success: true }, { headers });
  } catch (err) {
    console.error("[OPTIONS Logos] Error handling preflight:", err);
    return NextResponse.json({ error: "Preflight failed" }, { status: 500 });
  }
}
