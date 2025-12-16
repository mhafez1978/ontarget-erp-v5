import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import prisma from "@/lib/prisma";
import { LocationType } from "@prisma/client";

// PATCH /api/company/[id]/locations/[locationId] - Update a location
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = params.id;
    const locationId = params.locationId;
    const body = await request.json();

    // Verify company exists and user owns it
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.id !== company.ownerId && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify location belongs to this company
    const location = await prisma.companyLocation.findUnique({
      where: { id: locationId },
    });

    if (!location || location.companyId !== companyId) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // If marking as main, unset other main locations
    if (body.isMain === true && !location.isMain) {
      await prisma.companyLocation.updateMany({
        where: { companyId, isMain: true, id: { not: locationId } },
        data: { isMain: false },
      });
    }

    // Build update data
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type as LocationType;
    if (body.latitude !== undefined)
      updateData.latitude = parseFloat(body.latitude);
    if (body.longitude !== undefined)
      updateData.longitude = parseFloat(body.longitude);
    if (body.addressLine1 !== undefined)
      updateData.addressLine1 = body.addressLine1;
    if (body.addressLine2 !== undefined)
      updateData.addressLine2 = body.addressLine2;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.hours !== undefined) updateData.hours = body.hours;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.isMain !== undefined) updateData.isMain = body.isMain;

    // Update the location
    const updatedLocation = await prisma.companyLocation.update({
      where: { id: locationId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      location: updatedLocation,
    });
  } catch (error) {
    console.error("[Locations API] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

// DELETE /api/company/[id]/locations/[locationId] - Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = params.id;
    const locationId = params.locationId;

    // Verify company exists and user owns it
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.id !== company.ownerId && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify location belongs to this company
    const location = await prisma.companyLocation.findUnique({
      where: { id: locationId },
    });

    if (!location || location.companyId !== companyId) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if this is the last location or main location
    const locationCount = await prisma.companyLocation.count({
      where: { companyId },
    });

    if (locationCount === 1) {
      return NextResponse.json(
        { error: "Cannot delete the last location for a company" },
        { status: 400 }
      );
    }

    // If deleting main location, set another as main
    if (location.isMain) {
      await prisma.companyLocation.updateMany({
        where: { companyId, id: { not: locationId } },
        data: { isMain: true },
        take: 1,
      });
    }

    // Delete the location
    await prisma.companyLocation.delete({
      where: { id: locationId },
    });

    return NextResponse.json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("[Locations API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
