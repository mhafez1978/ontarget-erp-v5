import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, plan, paymentMethodId } = body;
    if (!customerId || !plan || !paymentMethodId) {
      return NextResponse.json({ error: "customerId, plan, and paymentMethodId are required" }, { status: 400 });
    }

    const gateway = await paymentsService.getRootGateway();
    if (!gateway) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 400 });
    }

    const priceId = paymentsService.getPriceIdForPlan(gateway, plan);
    if (!priceId) {
      return NextResponse.json({ error: "Price mapping not configured for plan" }, { status: 400 });
    }

    const provider = paymentsService.instantiateStripeProviderFromGateway(gateway);

    // Attach payment method to customer and set as default
    try {
      await (provider as any).stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await (provider as any).stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
    } catch (err) {
      console.error("Failed to attach payment method:", err);
      return NextResponse.json({ error: "Failed to attach payment method" }, { status: 500 });
    }

    const subRes = await (provider as any).createSubscription({
      customerId,
      priceId,
      trialDays: 30,
      defaultPaymentMethod: paymentMethodId,
    });

    if (!subRes.success) {
      return NextResponse.json({ error: subRes.error || "Failed to create subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscriptionId: subRes.subscriptionId, status: subRes.status });
  } catch (error) {
    console.error("/api/payments/create-subscription error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
