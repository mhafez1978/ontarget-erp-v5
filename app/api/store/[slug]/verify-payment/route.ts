import { NextRequest, NextResponse } from "next/server";
import { verifyAndCompletePayment } from "@/lib/storefront-payment";

/**
 * Verify payment completion and update order
 * POST /api/store/[slug]/verify-payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await request.json();
    const { paymentIntentId, orderId, companyId } = body;

    if (!paymentIntentId || !orderId || !companyId) {
      return NextResponse.json(
        { error: "Payment intent ID, order ID, and company ID are required" },
        { status: 400 }
      );
    }

    const result = await verifyAndCompletePayment({
      paymentIntentId,
      orderId,
      companyId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
