import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { processPayrollForCompany } from "@/lib/payroll/process-payroll";

export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const { companyId: requestedCompanyId, payDate: requestedPayDate } =
      (await req.json()) || {};

    let companyId: string | null = null;

    if (user.role === "SUPER_ADMIN") {
      if (requestedCompanyId) {
        const company = await db.company.findFirst({
          where: {
            id: requestedCompanyId,
            ownerId: user.id,
          },
          select: { id: true },
        });

        if (!company) {
          return NextResponse.json(
            { error: "Access Denied: You do not own this company" },
            { status: 403 }
          );
        }

        companyId = company.id;
      } else {
        const company = await db.company.findFirst({
          where: { ownerId: user.id },
          select: { id: true },
        });
        companyId = company?.id || null;
      }
    } else if (user.role === "ADMIN_OWNER" || user.role === "ADMIN_NONOWNER") {
      const staffRecord = await db.companyStaff.findFirst({
        where: {
          userId: user.id,
          role: { in: ["ADMIN_OWNER", "ADMIN_NONOWNER"] },
        },
        select: { companyId: true },
      });

      if (!staffRecord) {
        return NextResponse.json(
          { error: "Access Denied: Admin company not found" },
          { status: 403 }
        );
      }

      if (requestedCompanyId && requestedCompanyId !== staffRecord.companyId) {
        return NextResponse.json(
          { error: "Access Denied: Cannot process payroll for other company" },
          { status: 403 }
        );
      }

      companyId = staffRecord.companyId;
    } else {
      return NextResponse.json(
        { error: "Forbidden: Payroll processing is restricted" },
        { status: 403 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "No company found for payroll processing" },
        { status: 404 }
      );
    }

    let payDate: Date | undefined;
    if (requestedPayDate) {
      const parsed = new Date(requestedPayDate);
      if (!Number.isNaN(parsed.getTime())) {
        payDate = parsed;
      }
    }

    const result = await processPayrollForCompany(companyId, {
      payDate,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Payroll processing error:", error);
    return NextResponse.json(
      { error: "Failed to process payroll" },
      { status: 500 }
    );
  }
}
