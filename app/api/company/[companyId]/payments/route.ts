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

    // Permission: SUPER_ADMIN or company owner or company ADMIN member
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
      status?: import("@prisma/client").PaymentTransactionStatus;
    } = { companyId };
    const status = url.searchParams.get("status");
    if (status)
      where.status =
        status.toUpperCase() as import("@prisma/client").PaymentTransactionStatus;

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.payment.count({ where }),
    ]);

    return NextResponse.json({ payments, total, page, pageSize });
  } catch (error) {
    console.error("GET /api/company/:companyId/payments error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
