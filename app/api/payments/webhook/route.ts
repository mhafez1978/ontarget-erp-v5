import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const gateway = await paymentsService.getRootGateway();
    if (!gateway)
      return NextResponse.json(
        { error: "No gateway configured" },
        { status: 400 }
      );

    const provider =
      paymentsService.instantiateStripeProviderFromGateway(gateway);

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

            // Update subscription status to ACTIVE if we have a linked subscription
            const updated = await db.subscription.updateMany({
              where: { externalSubscriptionId: subscriptionId },
              data: { status: "ACTIVE" },
            });

            if (updated.count && updated.count > 0) {
              // Audit
              await db.auditLog.create({
                data: {
                  action: "INVOICE_PAID",
                  companyId: gateway.companyId,
                  entityType: "Subscription",
                  entityId: subscriptionId,
                  description: `Invoice ${invoice.id} paid for subscription ${subscriptionId}`,
                  metadata: JSON.stringify({
                    invoiceId: invoice.id,
                    amount: invoice.amount_paid,
                  }),
                },
              });
            }
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
          const updated = await db.subscription.updateMany({
            where: { externalSubscriptionId: subscriptionId },
            data: { status: "PAST_DUE" },
          });

          if (updated.count && updated.count > 0) {
            await db.auditLog.create({
              data: {
                action: "INVOICE_UPDATED",
                companyId: gateway.companyId,
                entityType: "Subscription",
                entityId: subscriptionId,
                description: `Invoice ${invoice.id} payment failed for subscription ${subscriptionId}`,
                metadata: JSON.stringify({ invoiceId: invoice.id }),
              },
            });
          }
        } catch (err) {
          console.error(
            "Failed to update subscription on payment_failed:",
            err
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        try {
          const updated = await db.subscription.updateMany({
            where: { externalSubscriptionId: sub.id },
            data: { status: "CANCELLED" },
          });

          if (updated.count && updated.count > 0) {
            await db.auditLog.create({
              data: {
                action: "SUBSCRIPTION_PLAN_CHANGED",
                companyId: gateway.companyId,
                entityType: "Subscription",
                entityId: sub.id,
                description: `Stripe subscription ${sub.id} was cancelled`,
                metadata: JSON.stringify({ stripeEvent: sub }),
              },
            });
          }
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
