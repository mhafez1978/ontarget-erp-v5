import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import sharp from "sharp";
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

    const contentType = request.headers.get("content-type") || "";

    // Allow two modes:
    // 1) multipart/form-data upload with `image` (and optional `userId` to target another user)
    // 2) application/json body with { userId?, imageUrl } used by clients that assign an image URL to a user
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        userId?: string | null;
        imageUrl?: string | null;
      };

      if (!body.imageUrl) {
        const response = NextResponse.json(
          { error: "imageUrl is required for JSON assignments" },
          { status: 400 }
        );
        response.headers.set("Cache-Control", "no-store, max-age=0");
        return response;
      }

      const targetUserId = body.userId || validation.user.id;

      // only allow assigning to other users if the current user has an admin role
      if (targetUserId !== validation.user.id) {
        const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
        if (!allowedRoles.includes(validation.user.role)) {
          const response = NextResponse.json(
            {
              error:
                "Forbidden - insufficient permissions to assign images to other users",
            },
            { status: 403 }
          );
          response.headers.set("Cache-Control", "no-store, max-age=0");
          return response;
        }
      }

      const imageUrl = body.imageUrl;

      await db.user.update({
        where: { id: targetUserId },
        data: { image: imageUrl },
      });

      await createAuditLog({
        userId: validation.user.id,
        action: "PROFILE_IMAGE_ASSIGNED",
        entityType: "USER",
        entityId: targetUserId,
        metadata: { imageUrl },
      });

      const origin = getRequestOrigin(request);
      const absoluteImageUrl = new URL(imageUrl, origin).toString();

      const response = NextResponse.json({
        success: true,
        imageUrl: absoluteImageUrl,
        message: "Profile image assigned successfully",
      });
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

    // Validate file type (tighten to common allowed types)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!file.type || !allowedTypes.includes(file.type)) {
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

    // Convert file to buffer and log details for diagnosis
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log(
      "Profile image upload: file name=",
      file.name,
      "size=",
      file.size,
      "type=",
      file.type
    );

    // Check for optional target user in form data (admins may upload for other users)
    const targetUserIdFromForm =
      (formData.get("userId") as string | null) || null;
    const effectiveUserId =
      targetUserIdFromForm && targetUserIdFromForm !== ""
        ? targetUserIdFromForm
        : userId;

    // only allow assigning uploads to other users if the current user has an admin role
    if (effectiveUserId !== userId) {
      const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
      if (!allowedRoles.includes(validation.user.role)) {
        const response = NextResponse.json(
          {
            error:
              "Forbidden - insufficient permissions to upload images for other users",
          },
          { status: 403 }
        );
        response.headers.set("Cache-Control", "no-store, max-age=0");
        return response;
      }
    }

    // Build sanitized username to store under per-user folder (fallback to id)
    const rawName = (await db.user.findUnique({
      where: { id: effectiveUserId },
      select: { name: true, email: true },
    })) || { name: user.name, email: user.email };
    const nameSource = rawName?.name || rawName?.email || effectiveUserId;
    // sanitize: lowercase, replace spaces with '-', allow alphanum, dash and underscore
    const sanitized =
      String(nameSource)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "")
        .slice(0, 60) || effectiveUserId;

    // Process and compress image into a small webp data URL and store in DB
    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(buffer)
        .resize(200, 200, { fit: "cover", position: "center" })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (err) {
      // Log stack for diagnosis
      console.error(
        "Image processing error:",
        err?.message || err,
        err?.stack || "no-stack"
      );
      const response = NextResponse.json(
        { error: "Failed to process image" },
        { status: 500 }
      );
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    // Convert processed image to base64 data URL
    const base64Image = processedBuffer.toString("base64");
    const imageDataUrl = `data:image/webp;base64,${base64Image}`;

    // Limit the size of stored base64 string to avoid huge DB payload
    if (imageDataUrl.length > 500000) {
      const response = NextResponse.json(
        { error: "Processed image is too large. Please use a smaller image." },
        { status: 400 }
      );
      response.headers.set("Cache-Control", "no-store, max-age=0");
      return response;
    }

    // Persist the data URL to the user's image column (safe for runtime/static concerns)
    await db.user.update({
      where: { id: effectiveUserId },
      data: { image: imageDataUrl },
    });

    // Log the audit action
    await createAuditLog({
      userId: user.id,
      action:
        effectiveUserId === userId
          ? "PROFILE_IMAGE_UPDATED"
          : "PROFILE_IMAGE_ASSIGNED",
      entityType: "USER",
      entityId: effectiveUserId,
      metadata: {
        storage: "DB_BASE64",
        fileName: file.name,
        fileSize: file.size,
      },
    });

    const origin = getRequestOrigin(request);
    // For base64 stored avatars we'll return the data URL directly
    const absoluteImageUrl = imageDataUrl?.startsWith("data:")
      ? imageDataUrl
      : new URL(imageDataUrl || "", origin).toString();

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
