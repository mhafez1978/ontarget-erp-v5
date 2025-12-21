import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, readdir, mkdir } from "fs/promises";
import { extname, resolve } from "path";
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
 * Convert file buffer to base64 data URL
 */
function bufferToDataURL(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

// POST - Upload multiple logos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: id } = await params;
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
            `Failed to create storage directory: ${
              mkdirError instanceof Error ? mkdirError.message : "Unknown error"
            }. Check volume permissions (needs UID 1001 write access).`
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
            `Failed to write file: ${
              writeError instanceof Error ? writeError.message : "Unknown error"
            }. Check volume permissions (needs UID 1001 write access).`
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
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: id } = await params;
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
      const companyFallback = await db.company.findUnique({
        where: { id },
        select: { logo: true, logoLight: true, logoDark: true },
      });
      addLogoIfMissing(companyFallback?.logo, "logo");
      addLogoIfMissing(companyFallback?.logoLight, "logoLight");
      addLogoIfMissing(companyFallback?.logoDark, "logoDark");
    }

    return NextResponse.json({ success: true, logos });
  } catch (error) {
    console.error("GET logos failed:", error);
    return NextResponse.json(
      { error: "Failed to list logos" },
      { status: 500 }
    );
  }
}
