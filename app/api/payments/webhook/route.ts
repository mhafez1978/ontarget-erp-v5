import { NextRequest, NextResponse } from "next/server";
import paymentsService from "@/lib/payments/service";
import { db } from "@/lib/db";
import type {
  PaymentWebhook,
  Invoice as PrismaInvoice,
  Payment as PrismaPayment,
} from "@prisma/client";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  // webhook audit record (declared outer so catch can reference it)
  let webhookRecord: PaymentWebhook | undefined = undefined;

  try {
    const gateway = await paymentsService.getRootGateway();
    if (!gateway) {
      console.warn("No root payment gateway configured for webhooks");
      return NextResponse.json(
        { error: "No gateway configured" },
        { status: 400 }
      );
    }

    const provider =
      paymentsService.instantiateStripeProviderFromGateway(gateway);

    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    const verify = await provider.verifyWebhook(payload, signature);
    if (!verify.isValid) {
      console.warn("Invalid webhook signature", verify.errorMessage);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = verify.event as Stripe.Event;

    // Record webhook payload for auditing (handle duplicate events idempotently)
    // Use upsert to atomically check and create/fetch to prevent race conditions
    try {
      // First, try to find existing webhook
      const existing = await db.paymentWebhook.findUnique({
        where: { eventId: event.id },
      });

      if (existing) {
        // If already exists and processed, skip immediately to prevent race condition
        if (existing.processed) {
          console.info("Skipping already-processed webhook event:", event.id);
          return NextResponse.json({ success: true });
        }
        webhookRecord = existing;
      } else {
        // Create new record only if it doesn't exist
        try {
          webhookRecord = await db.paymentWebhook.create({
            data: {
              provider: "stripe",
              eventType: event.type,
              eventId: event.id,
              payload: event as any,
              signature,
              ipAddress:
                request.headers.get("x-forwarded-for") ||
                request.headers.get("x-real-ip") ||
                undefined,
              userAgent: request.headers.get("user-agent") || undefined,
            },
          });
        } catch (createErr: unknown) {
          // If P2002 (unique constraint), another concurrent request created it
          if (
            createErr &&
            typeof createErr === "object" &&
            "code" in createErr &&
            createErr.code === "P2002"
          ) {
            // Fetch the record that was created by concurrent request
            const concurrentRecord = await db.paymentWebhook.findUnique({
              where: { eventId: event.id },
            });
            if (concurrentRecord?.processed) {
              console.info("Concurrent webhook already processed:", event.id);
              return NextResponse.json({ success: true });
            }
            webhookRecord = concurrentRecord ?? undefined;
          } else {
            throw createErr;
          }
        }
      }
    } catch (err: unknown) {
      throw err;
    }

    // Handle common events
    try {
      switch (event.type) {
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as any; // Stripe.Invoice with expanded properties
          const subscriptionId = invoice.subscription as string | undefined;
          // Upsert an Invoice record for this Stripe invoice
          let localInvoice: PrismaInvoice | undefined = undefined;
          try {
            const items = (invoice.lines?.data || []).map((ln: any) => ({
              description:
                ln.description || (ln.plan && ln.plan.nickname) || "",
              quantity: ln.quantity || 1,
              unitPrice: (ln.amount || 0) / 100 || 0,
              amount: ((ln.amount || 0) * (ln.quantity || 1)) / 100 || 0,
            }));

            // Try to find an existing invoice by externalInvoiceId (non-unique)
            const existingInv = await db.invoice.findFirst({
              where: { externalInvoiceId: invoice.id as string },
            });
            if (existingInv) {
              localInvoice = await db.invoice.update({
                where: { id: existingInv.id },
                data: {
                  status: invoice.paid ? "PAID" : "SENT",
                  paidAt: invoice.paid ? new Date() : undefined,
                  total: (invoice.total || invoice.amount_paid || 0) / 100,
                  items,
                  externalInvoiceUrl:
                    invoice.hosted_invoice_url ||
                    invoice.invoice_pdf ||
                    undefined,
                },
              });
            } else {
              localInvoice = await db.invoice.create({
                data: {
                  invoiceNumber: `STRIPE-${invoice.number || invoice.id}`,
                  companyId: gateway.companyId,
                  type: "SUBSCRIPTION",
                  status: invoice.paid ? "PAID" : "SENT",
                  customerEmail: invoice.customer_email || undefined,
                  amount: (invoice.subtotal || 0) / 100,
                  tax: 0,
                  discount: 0,
                  total: (invoice.total || invoice.amount_paid || 0) / 100,
                  items,
                  issueDate: new Date(
                    (invoice.created || Date.now() / 1000) * 1000
                  ),
                  dueDate: invoice.due_date
                    ? new Date(invoice.due_date * 1000)
                    : new Date(),
                  paidAt: invoice.paid ? new Date() : undefined,
                  paymentMethod: invoice.payment_method_types
                    ? invoice.payment_method_types[0]
                    : undefined,
                  externalInvoiceId: invoice.id,
                  externalInvoiceUrl:
                    invoice.hosted_invoice_url ||
                    invoice.invoice_pdf ||
                    undefined,
                  notes: invoice.description || undefined,
                },
              });
            }

            // Create Payment record and mark subscription active
            if (subscriptionId && invoice.amount_paid != null) {
              const gatewayRef = invoice.payment_intent || invoice.id;

              // avoid duplicate payments for the same gateway reference
              const existingPayment = await db.payment.findFirst({
                where: { gatewayReference: gatewayRef },
              });

              let payment: PrismaPayment | null = existingPayment;
              if (!existingPayment) {
                payment = await db.payment.create({
                  data: {
                    companyId: gateway.companyId,
                    gatewayId: gateway.id,
                    amount: (invoice.amount_paid || 0) / 100,
                    currency: (invoice.currency || "USD").toUpperCase(),
                    status: "SUCCEEDED",
                    gatewayReference: gatewayRef,
                    gatewayResponse: invoice as unknown as any,
                    customerEmail: invoice.customer_email || undefined,
                    description: `Invoice ${invoice.id}`,
                    invoiceId: localInvoice.id,
                    processedAt: new Date(),
                  },
                });
              }

              // Update subscription status to ACTIVE if we have a linked subscription
              const updated = await db.subscription.updateMany({
                where: { externalSubscriptionId: subscriptionId },
                data: { status: "ACTIVE" },
              });

              if (updated.count && updated.count > 0 && payment) {
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
                      paymentId: payment.id,
                    }),
                  },
                });
              }
            }
          } catch (err) {
            console.error(
              "Failed to persist invoice/payment webhook handling:",
              err
            );
          }

          break;
        }

        case "payment_intent.succeeded": {
          const pi = event.data.object as any; // Stripe.PaymentIntent with expanded properties
          try {
            const amount = (pi.amount_received || pi.amount || 0) / 100;
            const currency = (pi.currency || "USD").toUpperCase();
            const gatewayReference = pi.id;
            const customerEmail =
              pi.receipt_email ||
              pi.charges?.data?.[0]?.billing_details?.email ||
              undefined;

            // Try to associate with invoice if available
            let invoiceId: string | undefined = undefined;
            const piInvoiceId = (pi as any).invoice as string | undefined;
            if (piInvoiceId) {
              const localInv = await db.invoice.findFirst({
                where: { externalInvoiceId: piInvoiceId },
              });
              if (localInv) invoiceId = localInv.id;
            }

            // avoid duplicate payments
            const existing = await db.payment.findFirst({
              where: { gatewayReference },
            });
            if (!existing) {
              await db.payment.create({
                data: {
                  companyId: gateway.companyId,
                  gatewayId: gateway.id,
                  amount,
                  currency,
                  status: "SUCCEEDED",
                  gatewayReference,
                  gatewayResponse: pi as unknown as any,
                  customerEmail,
                  description: `PaymentIntent ${pi.id}`,
                  invoiceId,
                  processedAt: new Date(),
                },
              });
            }

            // If linked to a subscription via invoice or metadata, mark active
            const subscriptionId = pi.metadata?.subscription_id || undefined;
            if (subscriptionId) {
              await db.subscription.updateMany({
                where: { externalSubscriptionId: subscriptionId },
                data: { status: "ACTIVE" },
              });
            }
          } catch (err) {
            console.error("Failed to handle payment_intent.succeeded:", err);
          }

          break;
        }

        case "payment_intent.payment_failed": {
          const pi = event.data.object as any; // Stripe.PaymentIntent
          try {
            const subscriptionId = pi.metadata?.subscription_id || undefined;
            if (subscriptionId) {
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
                    description: `Payment intent ${pi.id} failed for subscription ${subscriptionId}`,
                    metadata: JSON.stringify({ paymentIntent: pi.id }),
                  },
                });
              }
            }
          } catch (err) {
            console.error(
              "Failed to handle payment_intent.payment_failed:",
              err
            );
          }
          break;
        }

        case "charge.refunded": {
          const ch = event.data.object as any; // Stripe.Charge
          try {
            // Find related payment by gatewayReference (payment_intent or charge id)
            const ref = ch.id || ch.payment_intent;
            const payments = await db.payment.findMany({
              where: {
                OR: [
                  { gatewayReference: ch.payment_intent as string },
                  { gatewayReference: ch.id },
                ],
              },
            });
            for (const p of payments) {
              const paymentAmountCents =
                typeof p.amount === "number"
                  ? p.amount * 100
                  : Number(p.amount) * 100;
              await db.payment.update({
                where: { id: p.id },
                data: {
                  refundedAt: new Date(),
                  refundAmount: (ch.amount_refunded || 0) / 100,
                  refundReference: ch.refunds?.data?.[0]?.id || undefined,
                  status:
                    ch.amount_refunded &&
                    ch.amount_refunded < paymentAmountCents
                      ? "PARTIALLY_REFUNDED"
                      : "REFUNDED",
                  gatewayResponse: ch as unknown as any,
                },
              });
            }
          } catch (err) {
            console.error("Failed to process charge.refunded:", err);
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as any; // Stripe.Invoice
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
          const sub = event.data.object as any; // Stripe.Subscription
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
        // Note: if a gateway is not available for the root company the webhook
        // cannot create payments/invoices. Keep processing minimal and log
        // for later investigation.
      }
    } catch (err) {
      console.error("Error handling stripe event:", err);
    }

    // mark webhook processed
    try {
      if (webhookRecord) {
        await db.paymentWebhook.update({
          where: { id: webhookRecord.id },
          data: { processed: true, processedAt: new Date() },
        });
      }
    } catch (err) {
      console.warn("Failed to mark webhook processed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/payments/webhook error:", error);
    try {
      if (webhookRecord) {
        await db.paymentWebhook.update({
          where: { id: (webhookRecord as PaymentWebhook).id },
          data: { processingError: String(error), processed: false },
        });
      }
    } catch (err) {
      console.warn("Failed to update webhook record on error:", err);
    }

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
