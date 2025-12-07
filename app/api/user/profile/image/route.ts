import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getRequestOrigin } from "@/lib/request-origin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      const response = NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      const response = NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const response = NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 }
      );
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const filename = `${userId}-${timestamp}.${fileExtension}`;

    // Save to public/uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads", "profiles");
    const filePath = join(uploadDir, filename);

    // Ensure directory exists
    const fs = await import("fs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filePath, buffer);

    // Update user's image URL in database
    const imageUrl = `/uploads/profiles/${filename}`;
    await db.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    // Log the audit action
    await createAuditLog({
      userId: user.id,
      action: "PROFILE_IMAGE_UPDATED",
      entityType: "USER",
      entityId: userId,
      metadata: {
        imageUrl,
        fileName: filename,
        fileSize: file.size,
      },
    });

    const origin = getRequestOrigin(request);
    const absoluteImageUrl = new URL(imageUrl, origin).toString();

    const response = NextResponse.json({
      success: true,
      imageUrl: absoluteImageUrl,
      message: "Profile image uploaded successfully",
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch (error) {
    console.error("Image upload error:", error);
    const response = NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  }
}
