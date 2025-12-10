import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";

/**
 * GET - Serve service images from cold storage
 * Route: /uploads/services/[companyId]/[serviceId]/images/[filename]
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      companyId: string;
      serviceId: string;
      filename: string;
    }>;
  }
) {
  try {
    const { companyId, serviceId, filename } = await params;

    // Get storage configuration
    const storage = await db.storageProvider.findFirst({
      where: {
        scope: "GLOBAL",
        isActive: true,
        isConnected: true,
      },
    });

    if (!storage) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 404 }
      );
    }

    const config = JSON.parse(storage.config || "{}");
    const basePath =
      storage.provider === "LOCAL"
        ? config.path || "../var/storage/cold"
        : "";

    if (!basePath) {
      return NextResponse.json(
        { error: "Storage path not configured" },
        { status: 404 }
      );
    }

    // Construct file path: /services/{companyId}/{serviceId}/images/{filename}
    const filePath = path.join(
      basePath,
      "services",
      companyId,
      serviceId,
      "images",
      filename
    );

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

      // Return file with proper headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      console.error("File read error:", error);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Service image serving error:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
