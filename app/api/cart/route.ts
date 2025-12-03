import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { validateSession } from "@/lib/session-manager";

// GET - Fetch user's cart
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("sessionToken")?.value;
    const sessionId = request.cookies.get("cartSessionId")?.value;

    let cart;
    let userId;

    if (sessionToken) {
      // Logged-in user
      const validation = await validateSession(sessionToken);
      if (validation.valid && validation.user) {
        userId = validation.user.id;
      }
    }

    if (userId) {
      // Logged-in user
      cart = await db.cart.findFirst({
        where: { userId },
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
    } else if (sessionId) {
      // Guest user
      cart = await db.cart.findUnique({
        where: { sessionId },
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
    }

    return NextResponse.json({
      success: true,
      cart: cart || null,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("sessionToken")?.value;
    let sessionId = request.cookies.get("cartSessionId")?.value;

    let userId;
    if (sessionToken) {
      const validation = await validateSession(sessionToken);
      if (validation.valid && validation.user) {
        userId = validation.user.id;
      }
    }

    const body = await request.json();
    const { companyId, productId, serviceId, quantity = 1 } = body;

    if (!companyId || (!productId && !serviceId)) {
      return NextResponse.json(
        { error: "Company ID and either product ID or service ID required" },
        { status: 400 }
      );
    }

    // Get price from product or service
    let price: number;
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { price: true },
      });
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      price = Number(product.price);
    } else {
      const service = await db.service.findUnique({
        where: { id: serviceId },
        select: { price: true },
      });
      if (!service) {
        return NextResponse.json(
          { error: "Service not found" },
          { status: 404 }
        );
      }
      price = Number(service.price);
    }

    // Find or create cart
    let cart;
    let newSessionId: string | null = null;

    if (userId) {
      // Logged-in user
      cart = await db.cart.findFirst({
        where: { userId, companyId },
      });

      if (!cart) {
        cart = await db.cart.create({
          data: {
            userId,
            companyId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }
    } else {
      // Guest user
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        newSessionId = sessionId;
      }

      cart = await db.cart.findUnique({
        where: { sessionId },
      });

      if (!cart) {
        cart = await db.cart.create({
          data: {
            sessionId,
            companyId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }
    }

    // Check if item already in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        ...(productId ? { productId } : { serviceId }),
      },
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      cartItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      // Create new cart item
      cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          serviceId,
          quantity,
          price,
        },
      });
    }

    // Fetch updated cart
    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
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

    const response = NextResponse.json({
      success: true,
      cart: updatedCart,
      item: cartItem,
    });

    // Set session cookie for guest users if new session was created
    if (newSessionId) {
      response.cookies.set("cartSessionId", newSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}
