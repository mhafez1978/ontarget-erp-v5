import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

// DELETE - Delete a service image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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
        { error: "Unauthorized to delete images for this service" },
        { status: 403 }
      );
    }

    // Get image details
    const image = await db.serviceImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.serviceId !== id) {
      return NextResponse.json(
        { error: "Image does not belong to this service" },
        { status: 400 }
      );
    }

    // Delete from database
    await db.serviceImage.delete({
      where: { id: imageId },
    });

    // Delete file from filesystem
    try {
      const filename = image.url.split("/").pop();
      if (filename) {
        const filepath = join(
          process.cwd(),
          "public",
          "uploads",
          "services",
          filename
        );
        await unlink(filepath);
      }
    } catch {
      // File might not exist or already deleted
      console.log("Could not delete file, continuing...");
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Service image deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
