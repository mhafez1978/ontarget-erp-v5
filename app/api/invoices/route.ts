import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db as prisma } from "@/lib/db";
import { InvoiceStatus, InvoiceType } from "@prisma/client";

/**
 * Get Invoices API Endpoint
 * Fetch invoices for a company with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const { user } = validation;
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user is company owner or member
    const isMember = await prisma.companyMember.findFirst({
      where: {
        companyId: companyId,
        userId: user.id,
      },
    });

    if (company.ownerId !== user.id && !isMember) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build where clause using Prisma types
    const where = {
      companyId,
      ...(status && { status: status as InvoiceStatus }),
      ...(type && { type: type as InvoiceType }),
    };

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: parseFloat(invoice.amount.toString()),
        tax: parseFloat(invoice.tax.toString()),
        total: parseFloat(invoice.total.toString()),
        status: invoice.status,
        type: invoice.type,
        dueDate: invoice.dueDate.toISOString(),
        issueDate: invoice.issueDate.toISOString(),
        paidAt: invoice.paidAt?.toISOString() || null,
        items: invoice.items,
        user: invoice.user,
      })),
    });
  } catch (error) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
