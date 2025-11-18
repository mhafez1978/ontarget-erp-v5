import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export type CheckoutDb = {
  company: {
    findUnique: (
      args: unknown
    ) => Promise<{ id: string; isStoreEnabled: boolean } | null>;
  };
  cart: {
    findFirst: (
      args: unknown
    ) => Promise<
      | ({ id: string; companyId: string; items: Array<CartItem> } & Record<
          string,
          unknown
        >)
      | null
    >;
    findUnique: (
      args: unknown
    ) => Promise<
      | ({ id: string; companyId: string; items: Array<CartItem> } & Record<
          string,
          unknown
        >)
      | null
    >;
    delete: (args: unknown) => Promise<unknown>;
  };
  cartItem: {
    deleteMany: (args: unknown) => Promise<unknown>;
  };
  storefrontOrder: {
    count: () => Promise<number>;
    create: (args: unknown) => Promise<{ id: string }>;
    findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
  };
  storefrontOrderItem: {
    create: (args: unknown) => Promise<unknown>;
  };
  $transaction: <T>(cb: (tx: CheckoutDb) => Promise<T>) => Promise<T>;
};

type CartItem = {
  productId: string | null;
  serviceId: string | null;
  product?: { name?: string | null; sku?: string | null } | null;
  service?: { name?: string | null } | null;
  quantity: number;
  price: number | string;
};

export function computeTotals(items: Array<CartItem>) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const tax = subtotal * 0.1; // 10% tax (adjust as needed)
  const shipping = 0;
  const discount = 0;
  const total = subtotal + tax + shipping - discount;
  return { subtotal, tax, shipping, discount, total };
}

export async function processCheckout(
  slug: string,
  userId: string | undefined,
  sessionId: string | undefined,
  payload: {
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string | null;
    shippingAddress?: unknown;
    billingAddress?: unknown;
    paymentMethod?: string | null;
    customerNotes?: string | null;
  },
  dbClient: CheckoutDb = db as unknown as CheckoutDb
): Promise<{ status: number; body: unknown; clearGuestSession?: boolean }> {
  const {
    customerEmail,
    customerName,
    customerPhone,
    shippingAddress,
    billingAddress,
    paymentMethod,
    customerNotes,
  } = payload;

  if (!customerEmail || !customerName) {
    return {
      status: 400,
      body: { error: "Customer email and name are required" },
    };
  }

  // Find company
  const company = await dbClient.company.findUnique({
    where: { slug },
    select: { id: true, isStoreEnabled: true },
  });

  if (!company || !company.isStoreEnabled) {
    return { status: 404, body: { error: "Store not found or not enabled" } };
  }

  // Find cart
  let cart:
    | ({ id: string; companyId: string; items: Array<CartItem> } & Record<
        string,
        unknown
      >)
    | null = null;
  if (userId) {
    cart = await dbClient.cart.findFirst({
      where: { userId, companyId: company.id },
      include: { items: { include: { product: true, service: true } } },
    });
  } else if (sessionId) {
    cart = await dbClient.cart.findUnique({
      where: { sessionId },
      include: { items: { include: { product: true, service: true } } },
    });
  }

  if (!cart || cart.items.length === 0) {
    return { status: 400, body: { error: "Cart is empty" } };
  }

  // Calculate totals
  const { subtotal, tax, shipping, discount, total } = computeTotals(
    cart.items
  );

  // Generate order number
  const orderCount = await dbClient.storefrontOrder.count();
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(
    orderCount + 1
  ).padStart(6, "0")}`;

  // Create order in transaction
  const order = await dbClient.$transaction(async (tx) => {
    const newOrder = await tx.storefrontOrder.create({
      data: {
        orderNumber,
        companyId: company.id,
        userId: userId || null,
        customerEmail,
        customerName,
        customerPhone,
        shippingAddress,
        billingAddress,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        tax,
        shipping,
        discount,
        total,
        paymentMethod,
        customerNotes,
      },
    });

    for (const item of cart!.items) {
      await tx.storefrontOrderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          serviceId: item.serviceId,
          itemName: item.product?.name || item.service?.name || "Unknown",
          itemSku: item.product?.sku || null,
          quantity: item.quantity,
          price: item.price,
          total: Number(item.price) * item.quantity,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart!.id } });
    await tx.cart.delete({ where: { id: cart!.id } });

    return newOrder;
  });

  const clearGuest = !userId && !!sessionId;

  const completeOrder = await dbClient.storefrontOrder.findUnique({
    where: { id: order.id },
    include: {
      items: {
        include: {
          product: {
            include: { images: { where: { isFeatured: true }, take: 1 } },
          },
          service: {
            include: { images: { where: { isFeatured: true }, take: 1 } },
          },
        },
      },
    },
  });

  return {
    status: 200,
    body: {
      success: true,
      order: completeOrder,
      message: "Order placed successfully",
      totals: { subtotal, tax, shipping, discount, total },
    },
    clearGuestSession: clearGuest,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const sessionId = cookieStore.get("cartSessionId")?.value;

    const body = await request.json();
    const result = await processCheckout(slug, userId, sessionId, body);

    if (result.clearGuestSession) {
      cookieStore.delete("cartSessionId");
    }

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 }
    );
  }
}
