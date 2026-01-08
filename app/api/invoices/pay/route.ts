import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db as prisma } from "@/lib/db";
import Stripe from "stripe";

// Lazy Stripe initialization to avoid build-time errors
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover",
  });
}

/**
 * Pay Invoice API Endpoint
 * Processes payment for a trial subscription invoice and reactivates company
 */
export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user } = validation;
    const body = await request.json();
    const { invoiceId, paymentMethodId } = body;

    if (!invoiceId || !paymentMethodId) {
      return NextResponse.json(
        { error: "Invoice ID and payment method are required" },
        { status: 400 }
      );
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: true,
        user: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify user owns this invoice or is company owner
    if (invoice.userId !== user.id && invoice.company.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to pay this invoice" },
        { status: 403 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let stripeCustomerId: string;
    const stripe = getStripeClient();

    const existingCustomer = await prisma.customerPaymentProvider.findFirst({
      where: {
        userId: user.id,
        provider: "STRIPE",
      },
    });

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.externalId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
          companyId: invoice.companyId,
        },
      });

      stripeCustomerId = customer.id;

      // Save customer ID
      await prisma.customerPaymentProvider.create({
        data: {
          userId: user.id,
          provider: "STRIPE",
          externalId: stripeCustomerId,
        },
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(invoice.total.toString()) * 100), // Convert to cents
      currency: "usd",
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        userId: user.id,
        companyId: invoice.companyId,
      },
      description: `Payment for invoice ${invoice.invoiceNumber}`,
    });

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        {
          error: "Payment failed",
          status: paymentIntent.status,
          paymentIntentId: paymentIntent.id,
        },
        { status: 400 }
      );
    }

    // Update invoice status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: "STRIPE",
        externalInvoiceId: paymentIntent.id,
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        companyId: invoice.companyId,
        invoiceId: invoice.id,
        amount: invoice.total,
        processedAt: new Date(),
        paymentMethod: "STRIPE",
        gatewayReference: paymentIntent.id,
        status: "SUCCEEDED",
      },
    });

    // Reactivate company if it was disabled
    if (!invoice.company.isActive) {
      await prisma.company.update({
        where: { id: invoice.companyId },
        data: { isActive: true },
      });

      // Create audit log for company reactivation
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "COMPANY_REACTIVATED",
          entityId: invoice.companyId,
          description: `Company reactivated after payment of invoice ${invoice.invoiceNumber}`,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          companyId: invoice.companyId,
        },
      });
    }

    // Create audit log for payment
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "INVOICE_PAID",
        entityId: invoice.id,
        description: `Invoice ${invoice.invoiceNumber} paid via Stripe`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        companyId: invoice.companyId,
      },
    });

    // Send confirmation email
    const rootCompany = await prisma.company.findFirst({
      where: { isRoot: true },
    });

    if (invoice.user?.email && rootCompany) {
      // Import sendEmail dynamically to avoid circular dependencies
      const { sendEmail } = await import("@/lib/email-service");

      try {
        await sendEmail(
          {
            to: invoice.user.email,
            subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4caf50;">Payment Received!</h2>
              <p>Hi ${invoice.user.name || "there"},</p>
              <p>Thank you for your payment. Your invoice has been marked as paid and your company account has been reactivated.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Amount Paid:</strong> $${invoice.total.toString()}</p>
                <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> Stripe</p>
                <p><strong>Transaction ID:</strong> ${paymentIntent.id}</p>
              </div>
              
              <p>Your company and all team members now have full access to OnTarget ERP.</p>
              
              <div style="margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to Dashboard
                </a>
              </div>
              
              <p>Thank you for being a valued customer!</p>
              <p>The OnTarget Team</p>
            </div>
          `,
          },
          rootCompany.id
        );
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment successful",
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: "PAID",
        paidAt: new Date(),
      },
      companyReactivated: !invoice.company.isActive,
    });
  } catch (error) {
    console.error("Invoice payment error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: "Payment processing failed",
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
