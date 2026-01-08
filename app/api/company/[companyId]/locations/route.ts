import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LocationType } from "@prisma/client";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

// GET /api/company/[companyId]/locations - Fetch all locations for a company
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user: sessionUser } = validation;

    const { params } = context;
    const companyId = (await params).companyId;

    // Verify user owns this company
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { id: true, role: true },
    });

    if (!user || (user.id !== company.ownerId && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all locations
    const locations = await db.companyLocation.findMany({
      where: { companyId },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      success: true,
      locations,
    });
  } catch (error) {
    console.error("[Locations API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}

// POST /api/company/[companyId]/locations - Create a new location
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user: sessionUser } = validation;

    const { params } = context;
    const companyId = (await params).companyId;
    const body = await request.json();

    // Validate required fields
    const {
      name,
      type = "BRANCH",
      latitude,
      longitude,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      hours,
      notes,
      isMain,
    } = body;

    if (
      !name ||
      latitude === undefined ||
      longitude === undefined ||
      !addressLine1 ||
      !city ||
      !country
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, latitude, longitude, addressLine1, city, country",
        },
        { status: 400 }
      );
    }

    // Verify user owns this company
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

    // If this is marked as main, unset any other main locations
    if (isMain) {
      await db.companyLocation.updateMany({
        where: { companyId, isMain: true },
        data: { isMain: false },
      });
    }

    // Create the location
    const location = await db.companyLocation.create({
      data: {
        companyId,
        name,
        type: type as LocationType,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        phone,
        email,
        hours,
        notes,
        isMain: isMain || false,
      },
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

    // Create audit log for location creation
    try {
      await createAuditLog({
        action: AUDIT_ACTIONS.LOCATION_CREATED,
        userId: sessionUser.id,
        companyId,
        entityType: "Location",
        entityId: location.id,
        description: `Location "${location.name}" created in company (${location.type})`,
        metadata: {
          locationName: location.name,
          locationType: location.type,
          address: `${addressLine1}${
            addressLine2 ? " " + addressLine2 : ""
          }, ${city}, ${state || ""} ${country}`,
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          isMain: location.isMain,
          phone: location.phone,
          email: location.email,
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
      console.error("Failed to create audit log for location:", auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error) {
    console.error("[Locations API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
