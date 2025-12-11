import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ type: string; companyId: string; filename: string }>;
  }
) {
  try {
    const { type, companyId, filename } = await params;

    // Get active storage provider
    const storageProvider = await db.storageProvider.findFirst({
      where: {
        scope: "GLOBAL",
        isActive: true,
        isConnected: true,
      },
    });

    if (!storageProvider) {
      return NextResponse.json(
        { error: "No storage provider configured" },
        { status: 404 }
      );
    }

    const config = JSON.parse(storageProvider.config || "{}");
    const basePath =
      storageProvider.provider === "LOCAL"
        ? config.path || "../var/storage/cold"
        : "";

    if (!basePath) {
      return NextResponse.json(
        { error: "Storage path not configured" },
        { status: 404 }
      );
    }

    // Read file from temp folder
    const filepath = join(basePath, "temp", type, companyId, filename);
    const fileBuffer = await readFile(filepath);

    // Determine content type from filename
    const ext = filename.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : ext === "gif"
        ? "image/gif"
        : "image/jpeg";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving temp image:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
