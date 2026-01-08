import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET /api/catalog/products?companyId=xxx
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
      // Super admin can access any company's products
      const products = await db.product.findMany({
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
        products,
      });
    } else if (
      user.role === "ADMIN" ||
      user.role === "MANAGER" ||
      user.role === "ERP_CUSTOMER" ||
      user.role === "COMPANY_CUSTOMER"
    ) {
      // ADMIN/MANAGER/ERP_CUSTOMER/COMPANY_CUSTOMER can access products from companies they're members of
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

      const products = await db.product.findMany({
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
        products,
      });
    } else {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/catalog/products
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
      sku,
      category,
      companyId,
      address,
      images,
      quantity,
      lowStockAlert,
      trackInventory,
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
      // Super admin can add products to any company
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
      // Admin can only add products to companies they own or are admin members of
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

    // Create product with images
    const product = await db.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        sku,
        category,
        companyId,
        quantity: quantity !== undefined ? parseInt(quantity) : 0,
        lowStockAlert:
          lowStockAlert !== undefined ? parseInt(lowStockAlert) : 10,
        trackInventory: trackInventory !== undefined ? trackInventory : true,
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
      product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
