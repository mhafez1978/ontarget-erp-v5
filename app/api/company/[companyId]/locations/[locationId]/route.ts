import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LocationType, Prisma } from "@prisma/client";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

// PATCH /api/company/[companyId]/locations/[locationId] - Update a location
export async function PATCH(request: NextRequest, context: any) {
  const { params } = context;
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;

    const companyId = params.companyId;
    const locationId = params.locationId;
    const body = await request.json();

    // Verify company exists and user owns it
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true },
    });

    if (!user || (user.id !== company.ownerId && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify location belongs to this company
    const location = await db.companyLocation.findUnique({
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
      await db.companyLocation.updateMany({
        where: { companyId, isMain: true, id: { not: locationId } },
        data: { isMain: false },
      });
    }

    // Build update data
    const updateData: Prisma.CompanyLocationUpdateInput = {};

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

    // Get original location for comparison
    const originalLocation = await db.companyLocation.findUnique({
      where: { id: locationId },
    });

    // Update the location
    const updatedLocation = await db.companyLocation.update({
      where: { id: locationId },
      data: updateData,
    });

    // Get geo-location for audit log
    let geoData = null;
    try {
      const geoResponse = await fetch(
        `${request.nextUrl.origin}/api/get-location`,
        {
          headers: {
            "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
            "x-real-ip": request.headers.get("x-real-ip") || "",
          },
        }
      );
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
      }
    } catch (error) {
      console.error("Error fetching geolocation:", error);
    }

    // Build changed fields list
    const changedFields: Record<string, { before: unknown; after: unknown }> = {};
    if (originalLocation) {
      if (updateData.name && originalLocation.name !== updateData.name) {
        changedFields.name = { before: originalLocation.name, after: updateData.name };
      }
      if (updateData.latitude && originalLocation.latitude !== updateData.latitude) {
        changedFields.latitude = { before: originalLocation.latitude, after: updateData.latitude };
      }
      if (updateData.longitude && originalLocation.longitude !== updateData.longitude) {
        changedFields.longitude = { before: originalLocation.longitude, after: updateData.longitude };
      }
      if (updateData.addressLine1 && originalLocation.addressLine1 !== updateData.addressLine1) {
        changedFields.addressLine1 = { before: originalLocation.addressLine1, after: updateData.addressLine1 };
      }
      if (updateData.city && originalLocation.city !== updateData.city) {
        changedFields.city = { before: originalLocation.city, after: updateData.city };
      }
      if (updateData.country && originalLocation.country !== updateData.country) {
        changedFields.country = { before: originalLocation.country, after: updateData.country };
      }
    }

    // Create audit log for location update
    try {
      await createAuditLog({
        action: AUDIT_ACTIONS.LOCATION_UPDATED,
        userId: sessionUser.id,
        companyId,
        entityType: "Location",
        entityId: locationId,
        description: `Location "${updatedLocation.name}" updated`,
        metadata: {
          locationName: updatedLocation.name,
          locationType: updatedLocation.type,
          changedFields,
          newCoordinates: {
            latitude: updatedLocation.latitude,
            longitude: updatedLocation.longitude,
          },
        },
        ipAddress: geoData?.ip || null,
        ipv4: geoData?.ipv4 || null,
        ipv6: geoData?.ipv6 || null,
        city: geoData?.city || null,
        state: geoData?.region || null,
        country: geoData?.country_name || null,
        countryFlag: geoData?.flag || null,
      });
    } catch (auditError) {
      console.error("Failed to create audit log for location update:", auditError);
      // Don't fail the request if audit logging fails
    }

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

// DELETE /api/company/[companyId]/locations/[locationId] - Delete a location
export async function DELETE(request: NextRequest, context: any) {
  const { params } = context;
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;

    const companyId = params.companyId;
    const locationId = params.locationId;

    // Verify company exists and user owns it
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true },
    });

    if (!user || (user.id !== company.ownerId && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify location belongs to this company
    const location = await db.companyLocation.findUnique({
      where: { id: locationId },
    });

    if (!location || location.companyId !== companyId) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Check if this is the last location or main location
    const locationCount = await db.companyLocation.count({
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
      const nextLocation = await db.companyLocation.findFirst({
        where: { companyId, id: { not: locationId } },
      });

      if (nextLocation) {
        await db.companyLocation.update({
          where: { id: nextLocation.id },
          data: { isMain: true },
        });
      }
    }

    // Delete the location
    await db.companyLocation.delete({ where: { id: locationId } });

    // Get geo-location for audit log
    let geoData = null;
    try {
      const geoResponse = await fetch(
        `${request.nextUrl.origin}/api/get-location`,
        {
          headers: {
            "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
            "x-real-ip": request.headers.get("x-real-ip") || "",
          },
        }
      );
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
      }
    } catch (error) {
      console.error("Error fetching geolocation:", error);
    }

    // Create audit log for location deletion
    try {
      await createAuditLog({
        action: AUDIT_ACTIONS.LOCATION_DELETED,
        userId: sessionUser.id,
        companyId,
        entityType: "Location",
        entityId: locationId,
        description: `Location "${location.name}" deleted from company`,
        metadata: {
          locationName: location.name,
          locationType: location.type,
          address: `${location.addressLine1}${location.addressLine2 ? " " + location.addressLine2 : ""}, ${location.city}, ${location.state || ""} ${location.country}`,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          wasMain: location.isMain,
        },
        ipAddress: geoData?.ip || null,
        ipv4: geoData?.ipv4 || null,
        ipv6: geoData?.ipv6 || null,
        city: geoData?.city || null,
        state: geoData?.region || null,
        country: geoData?.country_name || null,
        countryFlag: geoData?.flag || null,
      });
    } catch (auditError) {
      console.error("Failed to create audit log for location deletion:", auditError);
      // Don't fail the request if audit logging fails
    }

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
