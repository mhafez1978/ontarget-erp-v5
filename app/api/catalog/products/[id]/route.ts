import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
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

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH/PUT - Update product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const { id } = await params;
    const body = await request.json();

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check authorization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompanies: {
          where: { id: existingProduct.companyId },
        },
      },
    });

    const isOwner = user?.ownedCompanies.some(
      (c) => c.id === existingProduct.companyId
    );
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update product
    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        sku: body.sku,
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
      await db.productImage.deleteMany({
        where: { productId: id },
      });

      // Create new images
      if (body.images.length > 0) {
        await db.productImage.createMany({
          data: body.images.map(
            (img: { url: string; isFeatured: boolean; order: number }) => ({
              productId: id,
              url: img.url,
              isFeatured: img.isFeatured,
              order: img.order,
            })
          ),
        });
      }
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const { id } = await params;

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check authorization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedCompanies: {
          where: { id: existingProduct.companyId },
        },
      },
    });

    const isOwner = user?.ownedCompanies.some(
      (c) => c.id === existingProduct.companyId
    );
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete product (images will cascade delete)
    await db.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
