import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import prisma from "@/lib/prisma";
import { LocationType } from "@prisma/client";

// GET /api/company/[id]/locations - Fetch all locations for a company
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = params.id;

    // Verify user owns this company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || (user.id !== company.ownerId && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all locations
    const locations = await prisma.companyLocation.findMany({
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // If this is marked as main, unset any other main locations
    if (isMain) {
      await prisma.companyLocation.updateMany({
        where: { companyId, isMain: true },
        data: { isMain: false },
      });
    }

    // Create the location
    const location = await prisma.companyLocation.create({
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
