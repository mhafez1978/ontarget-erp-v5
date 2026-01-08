import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// PATCH - Set image as featured (unset all others)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: productId, imageId } = await params;
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

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { companyId: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Authorization check
    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isManager = user.role === "MANAGER";
    const ownsCompany = user.ownedCompanies.some(
      (c) => c.id === product.companyId
    );

    if (!isSuperAdmin && !ownsCompany && !isManager) {
      return NextResponse.json(
        { error: "Unauthorized to modify this product" },
        { status: 403 }
      );
    }

    // Check if image exists and belongs to this product
    const image = await db.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.productId !== productId) {
      return NextResponse.json(
        { error: "Image not found or does not belong to this product" },
        { status: 404 }
      );
    }

    // Use transaction to unset all other featured images and set this one
    await db.$transaction([
      // Unset all featured images for this product
      db.productImage.updateMany({
        where: { productId },
        data: { isFeatured: false },
      }),
      // Set this image as featured
      db.productImage.update({
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
