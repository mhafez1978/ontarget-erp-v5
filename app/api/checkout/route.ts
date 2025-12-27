import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getGatewayForCompany } from "@/lib/payments/service";

/**
 * POST /api/checkout
 * Process customer checkout with payment gateway
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const userId = validation.user.id;
    const body = await request.json();
    const { items, shipping, payment, subtotal, tax, total, notes } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (
      !shipping ||
      !shipping.fullName ||
      !shipping.email ||
      !shipping.addressLine1 ||
      !shipping.city ||
      !shipping.state ||
      !shipping.postalCode
    ) {
      return NextResponse.json(
        { error: "Complete shipping information is required" },
        { status: 400 }
      );
    }

    // Get the company ID from the first item (all items should be from same company)
    const companyId = items[0].companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found in cart items" },
        { status: 400 }
      );
    }

    // Verify all items are from the same company
    const allSameCompany = items.every(
      (item: { companyId: string }) => item.companyId === companyId
    );
    if (!allSameCompany) {
      return NextResponse.json(
        { error: "All items must be from the same company" },
        { status: 400 }
      );
    }

    // Check if company has payment gateway configured
    const paymentGateway = await getGatewayForCompany(companyId);

    if (!paymentGateway) {
      return NextResponse.json(
        {
          error: "Payment gateway not configured",
          details:
            "The company has not configured a payment gateway. Please contact support.",
        },
        { status: 400 }
      );
    }

    if (!paymentGateway.isEnabled) {
      return NextResponse.json(
        {
          error: "Payment gateway disabled",
          details:
            "The company's payment gateway is currently disabled. Please contact support.",
        },
        { status: 400 }
      );
    }

    // Get user details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate order number
    const orderCount = await db.storefrontOrder.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, "0")}`;

    // TODO: Process payment through gateway
    // For now, we'll create the order with PENDING payment status
    // In production, you would:
    // 1. Create payment intent with Stripe/PayPal/etc
    // 2. Process the payment
    // 3. Only create order if payment succeeds

    const paymentStatus = "PENDING"; // Will be "PAID" after actual payment processing

    // Prepare order items
    const orderItems = items.map(
      (item: {
        type: string;
        itemId: string;
        name: string;
        price: number;
        quantity: number;
      }) => ({
        productId: item.type === "product" ? item.itemId : null,
        serviceId: item.type === "service" ? item.itemId : null,
        itemName: item.name,
        itemSku: null,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })
    );

    // Create the order
    const order = await db.storefrontOrder.create({
      data: {
        orderNumber,
        companyId,
        userId,
        customerName: shipping.fullName,
        customerEmail: shipping.email,
        customerPhone: shipping.phone || null,
        status: "PENDING",
        paymentStatus,
        paymentMethod: payment?.method || "card",
        subtotal,
        tax,
        shipping: 0, // Can be calculated based on shipping method
        discount: 0,
        total,
        customerNotes: notes || null,
        internalNotes: null,
        shippingAddress: {
          line1: shipping.addressLine1,
          line2: shipping.addressLine2 || null,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country,
        },
        billingAddress: {
          line1: shipping.addressLine1,
          line2: shipping.addressLine2 || null,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country,
        },
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
      },
    });

    // TODO: Send order confirmation email

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { error: "Failed to process checkout. Please try again." },
      { status: 500 }
    );
  }
}
