import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const orderSchema = z.object({
  companyId: z.string(),
  companySlug: z.string(),
  companyName: z.string(),
  companyEmail: z.string().email(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      quantity: z.number(),
      image: z.string().optional(),
      type: z.enum(["product", "service"]),
    })
  ),
  customer: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  billing: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = orderSchema.parse(body);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Create order in database
    // Note: You'll need to add Order and OrderItem tables to your Prisma schema
    // For now, we'll just return a mock order ID
    const orderId = `order-${Date.now()}`;

    // TODO: Save to database when Order/OrderItem tables are added to Prisma schema
    // const order = await db.order.create({
    //   data: {
    //     orderNumber,
    //     companyId: validatedData.companyId,
    //     customerName: validatedData.customer.fullName,
    //     customerEmail: validatedData.customer.email,
    //     customerPhone: validatedData.customer.phone,
    //     billingAddress: validatedData.billing.address,
    //     billingCity: validatedData.billing.city,
    //     billingState: validatedData.billing.state,
    //     billingZipCode: validatedData.billing.zipCode,
    //     billingCountry: validatedData.billing.country,
    //     subtotal: validatedData.subtotal,
    //     tax: validatedData.tax,
    //     total: validatedData.total,
    //     status: "PENDING",
    //     items: {
    //       create: validatedData.items.map((item) => ({
    //         productId: item.id,
    //         name: item.name,
    //         description: item.description,
    //         price: item.price,
    //         quantity: item.quantity,
    //         image: item.image,
    //         type: item.type,
    //       })),
    //     },
    //   },
    // });

    // TODO: Send confirmation email to customer and company

    console.log("Order received:", {
      orderNumber,
      companyName: validatedData.companyName,
      customer: validatedData.customer,
      items: validatedData.items.length,
      total: validatedData.total,
    });

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid order data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
