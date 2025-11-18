import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
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
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    const { status, body } = await listOrdersForUser(
      userId,
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
