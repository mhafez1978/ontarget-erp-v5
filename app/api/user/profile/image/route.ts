import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import { join } from "path";
import { createAuditLog } from "@/lib/audit-log";
import { validateSession } from "@/lib/session-manager";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Profile image uploaded successfully",
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
