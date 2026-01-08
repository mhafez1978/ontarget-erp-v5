import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; invoiceId: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response as NextResponse;

    const { user } = validation;
    const { companyId, invoiceId } = await params;

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

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });
    if (!invoice)
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error(
      "GET /api/company/:companyId/invoices/:invoiceId error:",
      error
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
