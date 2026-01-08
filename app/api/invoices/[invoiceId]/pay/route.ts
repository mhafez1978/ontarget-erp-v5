import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { getGatewayForCompany, getRootGateway } from "@/lib/payments/service";

/**
 * POST /api/invoices/[invoiceId]/pay
 * Process payment for an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const { invoiceId } = await params;

    // Only allow customers to access this endpoint
    const allowedRoles = ["ERP_CUSTOMER", "COMPANY_CUSTOMER"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch the invoice
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        company: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify the invoice belongs to the user
    if (invoice.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if invoice is already paid
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    // Check if invoice is payable
    if (invoice.status !== "SENT" && invoice.status !== "OVERDUE") {
      return NextResponse.json(
        { error: "Invoice is not payable" },
        { status: 400 }
      );
    }

    // Get payment gateway (company-specific or fallback to global)
    let paymentGateway = await getGatewayForCompany(invoice.companyId);

    if (!paymentGateway) {
      paymentGateway = await getRootGateway();
    }

    if (!paymentGateway || !paymentGateway.isEnabled) {
      return NextResponse.json(
        { error: "Payment gateway not available" },
        { status: 400 }
      );
    }

    // TODO: In production, integrate with actual payment provider (Stripe, PayPal, etc.)
    // For now, we'll create a payment record and mark invoice as pending payment

    // If invoice has externalInvoiceUrl (Stripe hosted invoice), redirect to it
    if (invoice.externalInvoiceUrl) {
      return NextResponse.json({
        paymentUrl: invoice.externalInvoiceUrl,
      });
    }

    // For custom invoices, you would:
    // 1. Create a payment intent with the payment provider
    // 2. Return a payment URL or client secret
    // 3. Handle webhook to mark invoice as paid

    // For now, simulate payment processing
    await db.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: "card",
      },
    });

    // Create a payment record
    await db.payment.create({
      data: {
        amount: invoice.total,
        currency: "USD",
        status: "SUCCEEDED",
        paymentMethod: "card",
        invoiceId: invoice.id,
        companyId: invoice.companyId,
        customerEmail: invoice.customerEmail || undefined,
        customerName: invoice.customerName || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
