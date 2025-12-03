import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { canUseAiStorefront } from "@/lib/billing/plan-gating";
import type { SubscriptionPlan } from "@prisma/client";

const disableSchema = z.object({
  companyId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const body = await request.json();
    const parsed = disableSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 400 }
      );
    }

    const { companyId } = parsed.data;
    const userId = validation.user.id;
    const userRole = validation.user.role;
    const userPlan = validation.user.plan as SubscriptionPlan | null;

    // Enforce plan gating for AI storefront disable, except for SUPER_ADMIN.
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

    await db.company.update({
      where: { id: companyId },
      data: {
        aiStorefrontEnabled: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AI Storefront] Disable error:", error);
    return NextResponse.json(
      { error: "Failed to disable AI storefront" },
      { status: 500 }
    );
  }
}
