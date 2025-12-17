import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const gateway = await paymentsService.getRootGateway();
    if (!gateway) return NextResponse.json({ error: "No gateway configured" }, { status: 400 });

    const provider = paymentsService.instantiateStripeProviderFromGateway(gateway);

    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    const verify = await (provider as any).verifyWebhook(payload, signature);
    if (!verify.isValid) {
      console.warn("Invalid webhook signature", verify.errorMessage);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = verify.event as any;

    // Handle common events
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string | undefined;
        // Create Payment record and mark subscription active
        if (subscriptionId && invoice.amount_paid != null) {
          try {
            // Create Payment
            await db.payment.create({
              data: {
                companyId: gateway.companyId,
                gatewayId: gateway.id,
                amount: (invoice.amount_paid || 0) / 100,
                currency: (invoice.currency || "USD").toUpperCase(),
                status: "succeeded",
                gatewayReference: invoice.payment_intent || invoice.id,
                gatewayResponse: invoice,
                customerEmail: invoice.customer_email || undefined,
                description: `Invoice ${invoice.id}`,
              },
            });

            // Update subscription status to ACTIVE if exists
            await db.subscription.updateMany({
              where: { /* find any subscription that matches stripe id - we need to store stripe id later */ },
              data: { status: "ACTIVE" },
            });
          } catch (err) {
            console.error("Failed to persist payment/webhook handling:", err);
          }
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string | undefined;

        try {
          await db.subscription.updateMany({ where: { /* stripe id mapping to implement */ }, data: { status: "PAST_DUE" } });
        } catch (err) {
          console.error("Failed to update subscription on payment_failed:", err);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        try {
          await db.subscription.updateMany({ where: { /* stripe id mapping to implement */ }, data: { status: "CANCELLED" } });
        } catch (err) {
          console.error("Failed to mark subscription cancelled:", err);
        }
        break;
      }

      default:
        console.info("Unhandled stripe event:", event.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/payments/webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
