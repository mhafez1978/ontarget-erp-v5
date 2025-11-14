import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and verify they are ADMIN
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        ownedCompanies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only ADMIN users can change subscription plans" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newPlan = body.plan || body.newPlan;

    // Validate plan
    const validPlans = ["ESSENTIAL", "GROWTH", "ENTERPRISE"];
    if (!validPlans.includes(newPlan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get current company count
    const companyCount = user.ownedCompanies.length;

    // Check if downgrade violates limits
    const PLAN_LIMITS = {
      ESSENTIAL: 1,
      GROWTH: 3,
      ENTERPRISE: Infinity,
    };

    const newLimit = PLAN_LIMITS[newPlan as keyof typeof PLAN_LIMITS];
    if (companyCount > newLimit) {
      return NextResponse.json(
        {
          error: `Cannot downgrade to ${newPlan}. You currently have ${companyCount} companies, but ${newPlan} plan only allows ${newLimit}. Please delete ${
            companyCount - newLimit
          } company/companies first.`,
        },
        { status: 400 }
      );
    }

    // Update user plan AND all owned companies' subscriptions to keep them in sync
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { plan: newPlan },
    });

    // Update all subscriptions for owned companies to match user plan
    if (user.ownedCompanies.length > 0) {
      await db.subscription.updateMany({
        where: {
          subscriberCompanyId: {
            in: user.ownedCompanies.map((c) => c.id),
          },
        },
        data: {
          plan: newPlan,
        },
      });

      // Create audit log
      await createAuditLog({
        companyId: user.ownedCompanies[0].id,
        userId: user.id,
        action: AUDIT_ACTIONS.SUBSCRIPTION_PLAN_CHANGED,
        description: `Plan changed from ${user.plan} to ${newPlan} for user and all owned companies`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${
        getPlanLevel(newPlan) > getPlanLevel(user.plan)
          ? "upgraded"
          : "downgraded"
      } to ${newPlan} plan`,
      plan: updatedUser.plan,
    });
  } catch (error) {
    console.error("Error changing plan:", error);
    return NextResponse.json(
      { error: "Failed to change plan" },
      { status: 500 }
    );
  }
}

function getPlanLevel(plan: string): number {
  const levels = { ESSENTIAL: 1, GROWTH: 2, ENTERPRISE: 3 };
  return levels[plan as keyof typeof levels] || 0;
}
