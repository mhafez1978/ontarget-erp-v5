import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { getStorageConfig } from "@/lib/storage-config";

/**
 * GET - Serve logo files from cold storage or database base64
 * Route: /uploads/logos/[companyId]/[filename]
 *
 * Handles both:
 * 1. Files stored in cold storage (after storage configuration)
 * 2. Base64 data URLs stored in database (before storage configuration)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; filename: string }> }
) {
  try {
    const { companyId, filename } = await params;

    // First, check if this is a request for a base64 logo stored in DB
    // (before cold storage was configured)
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        logo: true,
        logoLight: true,
        logoDark: true,
        uploadedLogos: true,
      },
    });

    if (company) {
      // Check if any of the logo fields contain a base64 data URL that matches this filename
      const checkBase64Logo = (logoUrl: string | null) => {
        if (!logoUrl || !logoUrl.startsWith("data:image/")) return null;
        // Base64 logos don't have real filenames, so we check if this is the assigned logo
        return logoUrl;
      };

      let base64Logo = checkBase64Logo(company.logo);
      if (!base64Logo) base64Logo = checkBase64Logo(company.logoLight);
      if (!base64Logo) base64Logo = checkBase64Logo(company.logoDark);

      // Also check uploadedLogos JSON field for base64 entries
      if (!base64Logo && company.uploadedLogos) {
        const uploadedLogos = company.uploadedLogos as Array<{
          url: string;
          filename: string;
        }>;
        const matchingLogo = uploadedLogos.find(
          (logo) =>
            logo.filename === filename && logo.url.startsWith("data:image/")
        );
        if (matchingLogo) {
          base64Logo = matchingLogo.url;
        }
      }

      if (base64Logo) {
        // Extract base64 data and mime type
        const matches = base64Logo.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          console.log(
            `[Logo Serve] Serving base64 logo for company ${companyId}, size: ${buffer.length} bytes`
          );

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }
    }

    // Get storage configuration using the helper
    const storageConfig = await getStorageConfig();

    if (!storageConfig) {
      console.log(
        `[Logo Serve] No storage configured and no base64 logo found for ${companyId}/${filename}`
      );
      return NextResponse.json(
        { error: "Storage not configured and logo not found in database" },
        { status: 404 }
      );
    }

    const basePath = storageConfig.basePath;

    if (!basePath) {
      return NextResponse.json(
        { error: "Storage path not configured" },
        { status: 404 }
      );
    }

    // Construct file path
    const filePath = path.join(basePath, "logos", companyId, filename);

    // Check if file exists and read it
    try {
      const fileBuffer = await fs.readFile(filePath);

      // Determine content type from extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
      };

      const contentType = contentTypeMap[ext] || "application/octet-stream";

      console.log(
        `[Logo Serve] Serving file logo for ${companyId}/${filename}, size: ${fileBuffer.length} bytes`
      );

      // Return file with proper headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      console.error(
        `[Logo Serve] File read error for ${companyId}/${filename}:`,
        error
      );
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Logo serving error:", error);
    return NextResponse.json(
      { error: "Failed to serve logo" },
      { status: 500 }
    );
  }
}
