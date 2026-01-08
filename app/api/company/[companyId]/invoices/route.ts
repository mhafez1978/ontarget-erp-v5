import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const { user } = validation;
    const { companyId } = await params;

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        ownedCompanies: { select: { id: true } },
        companyMemberships: { select: { companyId: true, role: true } },
      },
    });

    if (!dbUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    let hasAccess = false;
    if (user.role === "SUPER_ADMIN") hasAccess = true;
    if (dbUser.ownedCompanies.some((c) => c.id === companyId)) hasAccess = true;
    const membership = dbUser.companyMemberships.find(
      (m) => m.companyId === companyId
    );
    if (
      membership &&
      (membership.role === "ADMIN" || membership.role === "MANAGER")
    )
      hasAccess = true;

    if (!hasAccess)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("pageSize") || "20"))
    );

    const where: {
      companyId: string;
      status?: import("@prisma/client").InvoiceStatus;
    } = { companyId };
    const status = url.searchParams.get("status");
    if (status)
      where.status =
        status.toUpperCase() as import("@prisma/client").InvoiceStatus;

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({ invoices, total, page, pageSize });
  } catch (error) {
    console.error("GET /api/company/:companyId/invoices error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const { user } = validation;
    const { companyId } = await params;

    // Check user has access to this company
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        ownedCompanies: { select: { id: true } },
        companyMemberships: { select: { companyId: true, role: true } },
      },
    });

    if (!dbUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    let hasAccess = false;
    if (user.role === "SUPER_ADMIN") hasAccess = true;
    if (dbUser.ownedCompanies.some((c) => c.id === companyId)) hasAccess = true;
    const membership = dbUser.companyMemberships.find(
      (m) => m.companyId === companyId
    );
    if (
      membership &&
      (membership.role === "ADMIN" || membership.role === "MANAGER")
    )
      hasAccess = true;

    if (!hasAccess)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const { customerId, items, dueDate, notes, status = "DRAFT" } = body;

    // Validate required fields
    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Customer and at least one item are required" },
        { status: 400 }
      );
    }

    // Fetch customer details
    const customer = await db.user.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, email: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Calculate totals from items
    let subtotal = 0;
    const invoiceItems = [];

    for (const item of items) {
      if (item.type === "product") {
        const product = await db.product.findUnique({
          where: { id: item.id },
          select: { id: true, name: true, price: true },
        });
        if (product) {
          const itemTotal = Number(product.price) * item.quantity;
          subtotal += itemTotal;
          invoiceItems.push({
            name: product.name,
            quantity: item.quantity,
            unitPrice: Number(product.price),
            total: itemTotal,
          });
        }
      } else if (item.type === "service") {
        const service = await db.service.findUnique({
          where: { id: item.id },
          select: { id: true, name: true, price: true },
        });
        if (service) {
          const itemTotal = Number(service.price) * item.quantity;
          subtotal += itemTotal;
          invoiceItems.push({
            name: service.name,
            quantity: item.quantity,
            unitPrice: Number(service.price),
            total: itemTotal,
          });
        }
      }
    }

    const tax = subtotal * 0.08; // 8% tax
    const discount = 0;
    const total = subtotal + tax - discount;

    // Generate invoice number
    const invoiceCount = await db.invoice.count({ where: { companyId } });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, "0")}`;

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        companyId,
        userId: customerId,
        invoiceNumber,
        type: "CUSTOM",
        status: status as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED",
        customerEmail: customer.email || "",
        amount: subtotal,
        tax,
        discount,
        total,
        issueDate: new Date(),
        dueDate: dueDate
          ? new Date(dueDate)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        items: invoiceItems,
        notes: notes || null,
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

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("POST /api/company/:companyId/invoices error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
