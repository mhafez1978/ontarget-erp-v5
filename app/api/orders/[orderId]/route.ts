import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import type { StorefrontOrderStatus, PaymentStatus } from "@prisma/client";

export type OrdersDetailDb = {
  user: {
    findUnique: (args: unknown) => Promise<{
      id: string;
      role: string;
      companyMemberships: Array<{ companyId: string; role: string }>;
    } | null>;
  };
  storefrontOrder: {
    findUnique: (
      args: unknown
    ) => Promise<
      (Record<string, unknown> & { id: string; companyId: string }) | null
    >;
    update: (args: unknown) => Promise<Record<string, unknown>>;
  };
};

export async function getOrderForUser(
  userId: string | undefined,
  orderId: string,
  dbClient: OrdersDetailDb = db as unknown as OrdersDetailDb
): Promise<{ status: number; body: unknown }> {
  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const user = await dbClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      companyMemberships: { select: { companyId: true, role: true }, take: 1 },
    },
  });

  if (!user || user.companyMemberships.length === 0) {
    return {
      status: 403,
      body: { error: "User not associated with a company" },
    };
  }

  const companyId = user.companyMemberships[0].companyId;

  const order = await dbClient.storefrontOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, images: true, sku: true },
          },
          service: { select: { id: true, name: true, images: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) {
    return { status: 404, body: { error: "Order not found" } };
  }

  if ((order as { companyId: string }).companyId !== companyId) {
    return { status: 404, body: { error: "Order not found" } };
  }

  return { status: 200, body: { order } };
}

export async function updateOrderForUser(
  userId: string | undefined,
  orderId: string,
  body: Record<string, unknown>,
  dbClient: OrdersDetailDb = db as unknown as OrdersDetailDb
): Promise<{ status: number; body: unknown }> {
  if (!userId) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const { status, paymentStatus, internalNotes, shippedAt, deliveredAt } =
    body as {
      status?: StorefrontOrderStatus;
      paymentStatus?: PaymentStatus;
      internalNotes?: string;
      shippedAt?: string | null;
      deliveredAt?: string | null;
    };

  const user = await dbClient.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      companyMemberships: { select: { companyId: true, role: true }, take: 1 },
    },
  });

  if (!user || user.companyMemberships.length === 0) {
    return {
      status: 403,
      body: { error: "User not associated with a company" },
    };
  }

  const companyId = user.companyMemberships[0].companyId;

  const canUpdateOrders = ["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(
    user.role
  );
  if (!canUpdateOrders) {
    return { status: 403, body: { error: "Insufficient permissions" } };
  }

  const order = await dbClient.storefrontOrder.findUnique({
    where: { id: orderId },
    select: { companyId: true },
  });

  if (!order || (order as { companyId: string }).companyId !== companyId) {
    return { status: 404, body: { error: "Order not found" } };
  }

  const updateData: Record<string, unknown> = {};
  if (status) {
    updateData.status = status as StorefrontOrderStatus;
    if (status === "CANCELED") {
      updateData.canceledAt = new Date();
    }
  }
  if (paymentStatus) updateData.paymentStatus = paymentStatus as PaymentStatus;
  if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
  if (shippedAt !== undefined) {
    updateData.shippedAt = shippedAt ? new Date(shippedAt) : null;
    if (shippedAt && !status) updateData.status = "SHIPPED";
  }
  if (deliveredAt !== undefined) {
    updateData.deliveredAt = deliveredAt ? new Date(deliveredAt) : null;
    if (deliveredAt && !status) updateData.status = "DELIVERED";
  }

  const updatedOrder = await dbClient.storefrontOrder.update({
    where: { id: orderId },
    data: updateData,
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

  return { status: 200, body: { order: updatedOrder } };
}

// GET /api/orders/[orderId] - Fetch single order details
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const { status, body } = await getOrderForUser(userId, params.orderId);
    return NextResponse.json(body, { status });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[orderId] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const body = await request.json();
    const result = await updateOrderForUser(userId, params.orderId, body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
