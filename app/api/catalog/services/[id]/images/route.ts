import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { validateSession } from "@/lib/session-manager";

// POST - Upload multiple service images
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
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

    // Check if service exists
    const service = await db.service.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Authorization check
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isManager = user.role === "MANAGER";
    const ownsCompany = user.ownedCompanies.some(
      (c) => c.id === service.companyId
    );

    if (!isSuperAdmin && !ownsCompany && !isManager) {
      return NextResponse.json(
        { error: "Unauthorized to upload images for this service" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

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

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        return NextResponse.json(
          { error: `${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }
    }

    const uploadedImages = [];

    // Get resize preferences from form data
    const shouldResize = formData.get("resize") === "true";
    const resizePreset = (formData.get("resizePreset") as string) || "post";

    // Define resize presets
    const resizePresets: Record<
      string,
      {
        width: number;
        height: number;
        fit: "cover" | "contain" | "fill" | "inside" | "outside";
      }
    > = {
      mobile: { width: 480, height: 480, fit: "cover" },
      thumbnail: { width: 300, height: 300, fit: "cover" },
      post: { width: 800, height: 600, fit: "cover" },
      banner: { width: 1200, height: 400, fit: "cover" },
      large: { width: 1920, height: 1080, fit: "cover" },
    };

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "services");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Process each file
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process with Sharp (optimize and resize if needed)
      let sharpInstance = sharp(buffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();

      // Apply custom resize if enabled
      if (shouldResize && resizePresets[resizePreset]) {
        const preset = resizePresets[resizePreset];
        sharpInstance = sharpInstance.resize(preset.width, preset.height, {
          fit: preset.fit,
          position: "center",
        });
      } else {
        // Default behavior: Resize if image is too large (max 2000px on longest side)
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
      }

      // Optimize image
      sharpInstance = sharpInstance.jpeg({
        quality: 90,
        progressive: true,
      });

      // Process image
      const processedBuffer = await sharpInstance.toBuffer();

      // Generate unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const filename = `service-${uniqueSuffix}.jpg`; // Always save as JPEG after Sharp processing

      const filepath = join(uploadDir, filename);
      await writeFile(filepath, processedBuffer);

      const imageUrl = `/uploads/services/${filename}`;

      // Get current max order for this service
      const existingImages = await db.serviceImage.findMany({
        where: { serviceId: id },
        orderBy: { order: "desc" },
        take: 1,
      });

      const nextOrder =
        existingImages.length > 0 ? existingImages[0].order + 1 : 0;

      // Save to database
      const savedImage = await db.serviceImage.create({
        data: {
          serviceId: id,
          url: imageUrl,
          isFeatured: false, // Set manually in UI
          order: nextOrder,
        },
      });

      uploadedImages.push({
        id: savedImage.id,
        url: savedImage.url,
        isFeatured: savedImage.isFeatured,
        order: savedImage.order,
      });
    }

    return NextResponse.json({
      success: true,
      images: uploadedImages,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("Service image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}
