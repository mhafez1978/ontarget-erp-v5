import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, plan, paymentMethodId } = body;
    if (!customerId || !plan || !paymentMethodId) {
      return NextResponse.json(
        { error: "customerId, plan, and paymentMethodId are required" },
        { status: 400 }
      );
    }

    // Rate limiting: 10 subscription attempts per 15 minutes per customer
    const rateLimit = checkRateLimit(
      customerId,
      RATE_LIMITS.PAYMENT_INTENT_CREATE
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Too many subscription attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const gateway = await paymentsService.getRootGateway();
    if (!gateway) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 400 }
      );
    }

    const priceId = paymentsService.getPriceIdForPlan(gateway, plan);
    if (!priceId) {
      return NextResponse.json(
        { error: "Price mapping not configured for plan" },
        { status: 400 }
      );
    }

    const provider =
      paymentsService.instantiateStripeProviderFromGateway(gateway);

    // Type guard to ensure we have a Stripe provider with required methods
    if (!("stripe" in provider) || !("createSubscription" in provider)) {
      return NextResponse.json(
        { error: "Provider does not support subscriptions" },
        { status: 400 }
      );
    }

    const stripeProvider = provider as any;

    // Attach payment method to customer and set as default
    try {
      await stripeProvider.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      await stripeProvider.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    } catch (err) {
      console.error("Failed to attach payment method:", err);
      return NextResponse.json(
        { error: "Failed to attach payment method" },
        { status: 500 }
      );
    }

    const subRes = await stripeProvider.createSubscription({
      customerId,
      priceId,
      trialDays: 30,
      defaultPaymentMethod: paymentMethodId,
    });

    if (!subRes.success) {
      return NextResponse.json(
        { error: subRes.error || "Failed to create subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subRes.subscriptionId,
      status: subRes.status,
    });
  } catch (error) {
    console.error("/api/payments/create-subscription error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
