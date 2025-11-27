import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";
import { canUseAiStorefront } from "@/lib/billing/plan-gating";
import { getAiStorefrontMonthlyLimit } from "@/lib/ai/ai-limits";
import type { SubscriptionPlan } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const userId = validation.user.id;
    const userRole = validation.user.role;
    const userPlan = validation.user.plan as SubscriptionPlan | null;

    // Enforce plan gating for AI storefront config, except for SUPER_ADMIN.
    if (userRole !== "SUPER_ADMIN" && !canUseAiStorefront(userPlan)) {
      return NextResponse.json(
        {
          error:
            "AI storefront is only available for Growth and Enterprise plans.",
        },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        ownedCompanies: {
          where: { id: companyId },
          select: { id: true },
        },
        companyMemberships: {
          where: { companyId },
          select: { companyId: true, role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwner = user.ownedCompanies.length > 0;
    const isMember = user.companyMemberships.length > 0;
    const isAdminOrManager = user.companyMemberships.some(
      (m) => m.role === "ADMIN" || m.role === "MANAGER"
    );

    const hasAccess =
      userRole === "SUPER_ADMIN" || isOwner || (isMember && isAdminOrManager);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to this company" },
        { status: 403 }
      );
    }

    // Enforce plan gating for AI storefront config, except for SUPER_ADMIN.
    if (userRole !== "SUPER_ADMIN" && !canUseAiStorefront(userPlan)) {
      return NextResponse.json(
        {
          error:
            "AI storefront is only available for Growth and Enterprise plans.",
        },
        { status: 403 }
      );
    }

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        aiStorefrontEnabled: true,
        aiStorefrontSpec: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Compute monthly AI usage for this user/plan
    const planLimit = getAiStorefrontMonthlyLimit(userPlan);
    let usedThisMonth: number | null = null;

    if (planLimit !== "unlimited") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      usedThisMonth = await db.aiStorefrontGenerationLog.count({
        where: {
          userId,
          plan: userPlan ?? undefined,
          createdAt: { gte: monthStart },
        },
      });
    }

    return NextResponse.json({
      enabled: company.aiStorefrontEnabled,
      spec: company.aiStorefrontSpec,
      usage: {
        limit: planLimit,
        used: usedThisMonth,
      },
    });
  } catch (error) {
    console.error("[AI Storefront] Config fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI storefront config" },
      { status: 500 }
    );
  }
}
