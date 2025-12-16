import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LocationType } from "@prisma/client";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/company/[id]/locations - Fetch all locations for a company
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;

    const companyId = params.id;

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

// POST /api/company/[id]/locations - Create a new location
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;

    const companyId = params.id;
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
