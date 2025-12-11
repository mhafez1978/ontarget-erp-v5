import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { validateSessionForAPI } from "@/lib/validate-session";

/**
 * Check if cold storage is configured
 */
async function hasStorageConfigured(): Promise<{
  configured: boolean;
  provider: string;
  basePath: string;
} | null> {
  const globalStorage = await db.storageProvider.findFirst({
    where: {
      scope: "GLOBAL",
      isActive: true,
      isConnected: true,
    },
  });

  if (!globalStorage) {
    return null;
  }

  const config = JSON.parse(globalStorage.config || "{}");
  const basePath =
    globalStorage.provider === "LOCAL"
      ? config.path || "../var/storage/cold"
      : "";

  return {
    configured: true,
    provider: globalStorage.provider,
    basePath,
  };
}

/**
 * Convert buffer to base64 data URL
 */
function bufferToDataURL(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

// POST - Upload images temporarily before product/service creation
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    // Get user and check permissions
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        ownedCompanies: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    const companyId = formData.get("companyId") as string | null;
    const type = formData.get("type") as string | null; // "product" or "service"

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    if (!type || !["product", "service"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'product' or 'service'" },
        { status: 400 }
      );
    }

    // Authorization check
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isManager = user.role === "MANAGER";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);

    if (!isSuperAdmin && !ownsCompany && !isManager) {
      return NextResponse.json(
        { error: "Unauthorized to upload images for this company" },
        { status: 403 }
      );
    }

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `${file.name} is not an image file` },
          { status: 400 }
        );
      }

      if (file.size > 25 * 1024 * 1024) {
        // 25MB limit
        return NextResponse.json(
          { error: `${file.name} exceeds 25MB limit` },
          { status: 400 }
        );
      }
    }

    const uploadedImages = [];

    // Check if cold storage is configured
    const storageConfig = await hasStorageConfigured();

    // Process each file
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process with Sharp (optimize)
      let sharpInstance = sharp(buffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();

      // Resize if image is too large (max 2000px on longest side)
      const maxDimension = 2000;
      if (
        metadata.width &&
        metadata.height &&
        (metadata.width > maxDimension || metadata.height > maxDimension)
      ) {
        sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Optimize image
      sharpInstance = sharpInstance.jpeg({
        quality: 90,
        progressive: true,
      });

      // Process image
      const processedBuffer = await sharpInstance.toBuffer();

      let imageUrl: string;
      let tempId: string;

      if (storageConfig) {
        // Cold storage configured → save to filesystem in temp folder
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const filename = `temp-${uniqueSuffix}.jpg`;
        tempId = `temp-${uniqueSuffix}`;

        // Create temp directory: /temp/{type}/{companyId}/
        const uploadDir = join(storageConfig.basePath, "temp", type, companyId);

        try {
          await mkdir(uploadDir, { recursive: true });
        } catch {
          // Directory might already exist
        }

        const filepath = join(uploadDir, filename);
        await writeFile(filepath, processedBuffer);

        // Return path for serving via /uploads route
        imageUrl = `/uploads/temp/${type}/${companyId}/${filename}`;
      } else {
        // No cold storage → convert to base64 and store in memory
        imageUrl = bufferToDataURL(processedBuffer, "image/jpeg");
        tempId = `base64-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      }

      uploadedImages.push({
        tempId,
        url: imageUrl,
        filename: file.name,
      });
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Temp image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
