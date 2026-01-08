import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * GET /api/invoices/my-invoices
 * Fetch invoices for the authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;

    // Only allow customers to access this endpoint
    const allowedRoles = ["ERP_CUSTOMER", "COMPANY_CUSTOMER"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch invoices for this user
    const invoices = await db.invoice.findMany({
      where: {
        userId,
        status: {
          notIn: ["DRAFT"], // Don't show draft invoices to customers
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        amount: true,
        tax: true,
        discount: true,
        total: true,
        issueDate: true,
        dueDate: true,
        paidAt: true,
        externalInvoiceUrl: true,
        items: true,
        notes: true,
        paymentMethod: true,
      },
    });

    // Check for overdue invoices and update status
    const now = new Date();
    for (const invoice of invoices) {
      if (invoice.status === "SENT" && new Date(invoice.dueDate) < now) {
        await db.invoice.update({
          where: { id: invoice.id },
          data: { status: "OVERDUE" },
        });
        invoice.status = "OVERDUE";
      }
    }

    return NextResponse.json({
      invoices,
      count: invoices.length,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
