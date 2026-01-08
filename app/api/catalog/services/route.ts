import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/catalog/services?companyId=xxx
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Role-based access control
    if (user.role === "SUPER_ADMIN") {
      // Super admin can access any company's services
      const services = await db.service.findMany({
        where: { companyId },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        success: true,
        services,
      });
    } else if (
      user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      user.role === "ERP_CUSTOMER" ||
      user.role === "COMPANY_CUSTOMER"
    ) {
      // ADMIN/MANAGER/ERP_CUSTOMER/COMPANY_CUSTOMER can access services from companies they're members of
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
            {
              staff: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Access denied to this company" },
          { status: 403 }
        );
      }

      const services = await db.service.findMany({
        where: { companyId },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        success: true,
        services,
      });
    } else {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/catalog/services
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;

    // Get user with role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      price,
      duration,
      category,
      companyId,
      address,
      images,
    } = body;

    // Validation
    if (!name || !price || !companyId) {
      return NextResponse.json(
        { error: "Name, price, and company are required" },
        { status: 400 }
      );
    }

    // Role-based access control
    if (user.role === "SUPER_ADMIN") {
      // Super admin can add services to any company
      const company = await db.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    } else if (user.role === "ADMIN") {
      // Admin can only add services to companies they own or are admin members of
      const company = await db.company.findFirst({
        where: {
          id: companyId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId,
                  role: "ADMIN",
                },
              },
            },
          ],
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Access denied to this company" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Create service with images
    const service = await db.service.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        duration,
        category,
        companyId,
        addressLine1: address?.addressLine1,
        addressLine2: address?.addressLine2,
        city: address?.city,
        state: address?.state,
        country: address?.country,
        countryCode: address?.countryCode,
        postalCode: address?.postalCode,
        latitude: address?.latitude,
        longitude: address?.longitude,
        images: {
          create:
            images?.map(
              (
                img: { url: string; isFeatured?: boolean; order?: number },
                index: number
              ) => ({
                url: img.url,
                isFeatured: img.isFeatured || false,
                order: img.order !== undefined ? img.order : index,
              })
            ) || [],
        },
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
