import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await db.service.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}

// PATCH/PUT - Update service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { id } = await params;
    const body = await request.json();

    // Check if service exists
    const existingService = await db.service.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check authorization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompanies: {
          where: { id: existingService.companyId },
        },
      },
    });

    const isOwner = user?.ownedCompanies.some(
      (c) => c.id === existingService.companyId
    );
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update service
    const updatedService = await db.service.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        duration: body.duration,
        category: body.category,
        isActive: body.isActive,
        isPublished: body.isPublished,
        isFeatured: body.isFeatured,
        addressLine1: body.address?.addressLine1,
        addressLine2: body.address?.addressLine2,
        city: body.address?.city,
        state: body.address?.state,
        country: body.address?.country,
        countryCode: body.address?.countryCode,
        postalCode: body.address?.postalCode,
        latitude: body.address?.latitude,
        longitude: body.address?.longitude,
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Handle images if provided
    if (body.images) {
      // Delete existing images
      await db.serviceImage.deleteMany({
        where: { serviceId: id },
      });

      // Create new images
      if (body.images.length > 0) {
        await db.serviceImage.createMany({
          data: body.images.map(
            (img: { url: string; isFeatured: boolean; order: number }) => ({
              serviceId: id,
              url: img.url,
              isFeatured: img.isFeatured,
              order: img.order,
            })
          ),
        });
      }
    }

    return NextResponse.json({ success: true, service: updatedService });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// DELETE service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;

    const { id } = await params;

    // Check if service exists
    const existingService = await db.service.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check authorization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompanies: {
          where: { id: existingService.companyId },
        },
      },
    });

    const isOwner = user?.ownedCompanies.some(
      (c) => c.id === existingService.companyId
    );
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete service (images will cascade delete)
    await db.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
