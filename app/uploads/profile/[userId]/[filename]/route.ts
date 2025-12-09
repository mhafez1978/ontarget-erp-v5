import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; filename: string }> }
) {
  try {
    const { userId, filename } = await params;

    // Get storage configuration
    const globalStorage = await db.storageProvider.findFirst({
      where: {
        scope: "GLOBAL",
        isActive: true,
        isConnected: true,
      },
    });

    if (!globalStorage || globalStorage.provider !== "LOCAL") {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 404 }
      );
    }

    const config = JSON.parse(globalStorage.config || "{}");
    const basePath = config.path || "../var/storage/cold";

    // Build file path
    const filepath = path.join(basePath, "profile", userId, filename);

    // Read file
    const fileBuffer = await fs.readFile(filepath);

    // Determine content type from filename
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      {
        ".webp": "image/webp",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
      }[ext] || "application/octet-stream";

    // Return image with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving profile image:", error);
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
