import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    const cartItem = await db.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { isFeatured: true },
                      take: 1,
                    },
                  },
                },
                service: {
                  include: {
                    images: {
                      where: { isFeatured: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      item: cartItem,
      cart: cartItem.cart,
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    // Get cart info before deleting
    const cartItem = await db.cartItem.findUnique({
      where: { id: itemId },
      select: { cartId: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found" },
        { status: 404 }
      );
    }

    // Delete item
    await db.cartItem.delete({
      where: { id: itemId },
    });

    // Fetch updated cart
    const cart = await db.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isFeatured: true },
                  take: 1,
                },
              },
            },
            service: {
              include: {
                images: {
                  where: { isFeatured: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return NextResponse.json(
      { error: "Failed to delete cart item" },
      { status: 500 }
    );
  }
}
