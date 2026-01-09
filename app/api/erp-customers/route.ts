import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const currentUser = validation.user;
    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - SUPER_ADMIN only" },
        { status: 403 }
      );
    }

    // Fetch ERP customers (individual signups) who have the ERP_CUSTOMER plan only
    // Paying customers (TRIAL, ESSENTIAL, GROWTH, ENTERPRISE) are shown in Subscriber Directory
    const customers = await db.user.findMany({
      where: {
        role: "ERP_CUSTOMER",
        plan: "ERP_CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        billingCycle: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const result = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      plan: c.plan,
      billingCycle: c.billingCycle,
      createdAt: c.createdAt.toISOString(),
      emailVerified: !!c.emailVerified,
    }));

    return NextResponse.json({ customers: result, count: result.length });
  } catch (error) {
    console.error("Error fetching ERP customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch ERP customers" },
      { status: 500 }
    );
  }
}
