import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getClientIp } from "@/lib/get-client-ip";
import Stripe from "stripe";

const VALID_PLANS = ["ESSENTIAL", "GROWTH", "ENTERPRISE"];

export async function POST(req: NextRequest) {
  try {
    const { plan, paymentMethodId, billingCycle, promoCodeId } =
      await req.json();

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { success: false, message: "Invalid plan selected" },
        { status: 400 }
      );
    }

    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, message: "Payment method is required" },
        { status: 400 }
      );
    }

    // Validate session
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;

    // Get user and check if they need to select a plan
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // If user already has a non-GUEST plan, don't allow changing
    // (This prevents abuse - plan changes should go through settings/billing)
    if (user.plan && user.plan !== "GUEST") {
      return NextResponse.json(
        { success: false, message: "Plan already selected" },
        { status: 400 }
      );
    }

    // Validate promo code if provided
    let promoCode = null;
    if (promoCodeId) {
      promoCode = await db.promoCode.findUnique({
        where: { id: promoCodeId },
      });

      if (!promoCode || !promoCode.isActive) {
        return NextResponse.json(
          { success: false, message: "Invalid or inactive promo code" },
          { status: 400 }
        );
      }

      // Check expiration
      if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, message: "Promo code has expired" },
          { status: 400 }
        );
      }

      // Check usage limit
      if (
        promoCode.maxUses !== null &&
        promoCode.timesUsed >= promoCode.maxUses
      ) {
        return NextResponse.json(
          { success: false, message: "Promo code usage limit reached" },
          { status: 400 }
        );
      }
    }

    // Calculate pricing
    const planPricing = await db.planPricing.findUnique({
      where: { plan: plan },
    });

    if (!planPricing) {
      return NextResponse.json(
        { success: false, message: "Plan pricing not found" },
        { status: 404 }
      );
    }

    let subscriptionAmount =
      billingCycle === "ANNUAL"
        ? planPricing.annualPrice
        : planPricing.monthlyPrice;

    // Apply promo code pricing
    if (
      promoCode &&
      promoCode.discountType === "FLAT_FEE" &&
      promoCode.flatFeeAmount
    ) {
      subscriptionAmount =
        billingCycle === "ANNUAL"
          ? promoCode.flatFeeAmount.toNumber() * 12
          : promoCode.flatFeeAmount.toNumber();
    }

    // Create Stripe subscription
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-10-29.clover",
    });

    // Get client IP for tax calculation
    const clientIp = getClientIp(req) || "127.0.0.1";

    // Create Stripe customer if not exists
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          userId: user.id,
          plan: plan,
        },
        // Enable tax ID collection for business customers
        tax_id_data: undefined, // Users can add tax ID later in billing portal
      });
      customerId = customer.id;
    }

    // Update customer with IP address for tax calculation
    await stripe.customers.update(customerId, {
      metadata: {
        last_ip: clientIp,
      },
    });

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create a price for the subscription
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: Math.round(subscriptionAmount * 100), // Convert to cents
      recurring: {
        interval: billingCycle === "ANNUAL" ? "year" : "month",
      },
      product_data: {
        name: `OnTarget ERP - ${plan} Plan`,
        metadata: {
          plan: plan,
          promoCode: promoCode?.code || "",
        },
      },
      // Enable tax calculation for this price
      tax_behavior: "exclusive", // Tax is added on top of the price
    });

    // Calculate tax before creating subscription
    let taxCalculation = null;
    try {
      taxCalculation = await stripe.tax.calculations.create({
        currency: "usd",
        line_items: [
          {
            amount: Math.round(subscriptionAmount * 100),
            reference: `${plan}_plan`,
            tax_code: "txcd_10000000", // SaaS tax code
          },
        ],
        customer_details: {
          address_source: "billing",
          ip_address: clientIp,
        },
        expand: ["line_items.data.tax_breakdown"],
      });

      console.log("Tax calculation:", {
        subtotal: taxCalculation.amount_total,
        tax: taxCalculation.tax_amount_exclusive,
        total: taxCalculation.amount_total + taxCalculation.tax_amount_exclusive,
        taxRate: taxCalculation.tax_breakdown?.[0]?.tax_rate_details?.percentage_decimal,
      });
    } catch (taxError) {
      console.error("Tax calculation failed (continuing without):", taxError);
      // Continue without tax if calculation fails
    }

    // Create subscription with the price and automatic tax
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: "default_incomplete",
      payment_settings: { payment_method_types: ["card"] },
      expand: ["latest_invoice.payment_intent"],
      // Enable automatic tax collection
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        userId: user.id,
        plan: plan,
        billingCycle: billingCycle || "MONTHLY",
        promoCodeId: promoCodeId || "",
        promoCode: promoCode?.code || "",
        clientIp: clientIp,
      },
    });

    // Update user's plan
    await db.user.update({
      where: { id: user.id },
      data: {
        plan: plan,
      },
    });

    // Increment promo code usage if used
    if (promoCode) {
      await db.promoCode.update({
        where: { id: promoCode.id },
        data: {
          timesUsed: { increment: 1 },
        },
      });
    }

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: "USER_PLAN_SELECTED",
      description: `User selected plan: ${plan} (${
        billingCycle || "MONTHLY"
      } billing)${promoCode ? ` with promo code: ${promoCode.code}` : ""}`,
      metadata: {
        plan,
        billingCycle,
        subscriptionAmount: subscriptionAmount.toString(),
        taxAmount: taxCalculation
          ? (taxCalculation.tax_amount_exclusive / 100).toString()
          : "0",
        totalAmount: taxCalculation
          ? (
              (taxCalculation.amount_total +
                taxCalculation.tax_amount_exclusive) /
              100
            ).toString()
          : subscriptionAmount.toString(),
        promoCode: promoCode?.code || null,
        stripeSubscriptionId: subscription.id,
        clientIp,
      },
    });
      },
    });

    return NextResponse.json({
      success: true,
      message: "Plan selected successfully",
      plan: plan,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Error selecting plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to select plan" },
      { status: 500 }
    );
  }
}
