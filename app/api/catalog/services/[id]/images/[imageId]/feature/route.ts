import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// PATCH - Set image as featured (unset all others)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: serviceId, imageId } = await params;
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
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
      where: { id: serviceId },
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
        { error: "Unauthorized to modify this service" },
        { status: 403 }
      );
    }

    // Check if image exists and belongs to this service
    const image = await db.serviceImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.serviceId !== serviceId) {
      return NextResponse.json(
        { error: "Image not found or does not belong to this service" },
        { status: 404 }
      );
    }

    // Use transaction to unset all other featured images and set this one
    await db.$transaction([
      // Unset all featured images for this service
      db.serviceImage.updateMany({
        where: { serviceId },
        data: { isFeatured: false },
      }),
      // Set this image as featured
      db.serviceImage.update({
        where: { id: imageId },
        data: { isFeatured: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Featured image updated",
    });
  } catch (error) {
    console.error("Error updating featured image:", error);
    return NextResponse.json(
      { error: "Failed to update featured image" },
      { status: 500 }
    );
  }
}
