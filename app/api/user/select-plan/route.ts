import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit-log";
import { validateSessionForAPI } from "@/lib/validate-session";

const VALID_PLANS = ["ESSENTIAL", "GROWTH", "ENTERPRISE"];

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { success: false, message: "Invalid plan selected" },
        { status: 400 }
      );
    }

    // Validate session
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const { user: sessionUser } = validation;

    // Get user and check if they need to select a plan
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        plan: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // If user already has a non-GUEST plan, don't allow changing
    // (This prevents abuse - plan changes should go through settings/billing)
    if (user.plan && user.plan !== "GUEST") {
      return NextResponse.json(
        { success: false, message: "Plan already selected" },
        { status: 400 }
      );
    }

    // Update user's plan
    await db.user.update({
      where: { id: userId },
      data: {
        plan: plan,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: userId,
      action: "USER_PLAN_SELECTED",
      description: `User selected plan: ${plan}`,
    });

    return NextResponse.json({
      success: true,
      message: "Plan selected successfully",
      plan: plan,
    });
  } catch (error) {
    console.error("Error selecting plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to select plan" },
      { status: 500 }
    );
  }
}
