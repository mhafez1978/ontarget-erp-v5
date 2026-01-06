import { NextRequest, NextResponse } from "next/server";
import { createStorefrontPaymentIntent } from "@/lib/storefront-payment";

/**
 * Create payment intent for storefront checkout
 * POST /api/store/[slug]/create-payment-intent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const {
      amountCents,
      currency,
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      companyId,
    } = body;

    if (!amountCents || !companyId) {
      return NextResponse.json(
        { error: "Amount and company ID are required" },
        { status: 400 }
      );
    }

    const paymentIntent = await createStorefrontPaymentIntent({
      companyId,
      amountCents,
      currency,
      orderId,
      orderNumber,
      customerEmail,
      customerName,
      metadata: {
        slug,
      },
    });

    return NextResponse.json(paymentIntent);
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
