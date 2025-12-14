import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import type { StorefrontOrderStatus, PaymentStatus } from "@prisma/client";

export type OrdersDb = {
  user: {
    findUnique: (args: unknown) => Promise<{
      id: string;
      role: string;
      companyMemberships: Array<{ companyId: string; role: string }>;
    } | null>;
  };
  storefrontOrder: {
    findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
  };
};

export async function listOrdersForUser(
  userId: string | undefined,
  searchParams: URLSearchParams,
  dbClient: OrdersDb = db as unknown as OrdersDb
): Promise<{ status: number; body: unknown }> {
  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  // Get user with company membership
  const user = await dbClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      companyMemberships: {
        select: {
          companyId: true,
          role: true,
        },
        take: 1,
      },
    },
  });

  if (!user || user.companyMemberships.length === 0) {
    return {
      status: 403,
      body: { error: "User not associated with a company" },
    };
  }

  const companyId = user.companyMemberships[0].companyId;

  // Check if user has permission to view orders
  const canViewOrders = ["STAFF", "MANAGER", "ADMIN", "SUPER_ADMIN"].includes(
    user.role
  );

  if (!canViewOrders) {
    return { status: 403, body: { error: "Insufficient permissions" } };
  }

  // Get query parameters for filtering
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const search = searchParams.get("search");

  // Build where clause
  const where: Record<string, unknown> = {
    companyId,
  };

  if (status) {
    where.status = status as StorefrontOrderStatus;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus as PaymentStatus;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { customerName: { contains: search } },
      { customerEmail: { contains: search } },
    ];
  }

  // Fetch orders
  const orders = await dbClient.storefrontOrder.findMany({
    where,
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: true } },
          service: { select: { id: true, name: true, images: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { status: 200, body: { orders } };
}

// GET /api/orders - Fetch orders for current user's company
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { status, body } = await listOrdersForUser(
      validation.user.id,
      request.nextUrl.searchParams
    );
    return NextResponse.json(body, { status });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const body = await request.json();
    const {
      companyId,
      customerId,
      items,
      customerNotes,
      internalNotes,
      shippingAddress,
      billingAddress,
      paymentMethod,
      customerPhone: providedCustomerPhone,
    } = body;

    // Validate required fields
    if (!companyId || !customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Company, customer, and at least one item are required" },
        { status: 400 }
      );
    }

    // Check user permissions
    const user = await db.user.findUnique({
      where: { id: validation.user.id },
      select: { role: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to create orders" },
        { status: 403 }
      );
    }

    // Get customer details
    const customer = await db.user.findUnique({
      where: { id: customerId },
      select: { name: true, email: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Generate order number
    const orderCount = await db.storefrontOrder.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, "0")}`;

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { productId, serviceId, quantity, unitPrice } = item;

      if (!quantity || quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid quantity for item" },
          { status: 400 }
        );
      }

      const total = unitPrice * quantity;
      subtotal += total;

      orderItems.push({
        productId: productId || null,
        serviceId: serviceId || null,
        // Snapshot fields required by StorefrontOrderItem schema
        itemName: item.itemName || productId || serviceId || "Unknown",
        itemSku: item.itemSku || null,
        quantity,
        price: unitPrice,
        total,
      });
    }

    const tax = subtotal * 0.1; // 10% tax (adjust as needed)
    const shipping = 0; // Can be calculated based on shipping method
    const discount = 0; // Can be applied if needed
    const totalAmount = subtotal + tax + shipping - discount;

    // Create the order
    const order = await db.storefrontOrder.create({
      data: {
        orderNumber,
        companyId,
        userId: customerId,
        customerName: customer.name || "Unknown",
        customerEmail: customer.email || "",
        customerPhone: providedCustomerPhone ?? null,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal,
        tax,
        shipping,
        discount,
        total: totalAmount,
        paymentMethod: paymentMethod || null,
        customerNotes: customerNotes || null,
        internalNotes: internalNotes || null,
        shippingAddress: shippingAddress || null,
        billingAddress: billingAddress || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: true } },
            service: { select: { id: true, name: true, images: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      { message: "Order created successfully", order },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
