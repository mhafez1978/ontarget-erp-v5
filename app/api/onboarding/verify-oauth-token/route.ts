import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const onboarding = await db.oAuthOnboarding.findUnique({
      where: { token },
      include: {
        user: {
          select: { id: true, name: true, email: true, plan: true },
        },
      },
    });

    if (!onboarding) {
      return NextResponse.json(
        { error: "Invalid onboarding token" },
        { status: 404 }
      );
    }

    if (new Date() > onboarding.expiresAt) {
      await createAuditLog({
        action: AUDIT_ACTIONS.ONBOARDING_EXPIRED,
        userId: onboarding.userId,
        description: `Expired OAuth onboarding token accessed for ${onboarding.user.email}`,
        metadata: { token: onboarding.token, expired: true },
      }).catch(console.error);

      return NextResponse.json(
        { error: "Onboarding token expired", expired: true },
        { status: 400 }
      );
    }

    if (onboarding.isUsed) {
      return NextResponse.json(
        { error: "Onboarding already completed", alreadyCompleted: true },
        { status: 400 }
      );
    }

    // Return token info for frontend to pre-fill and allow completion
    await createAuditLog({
      action: AUDIT_ACTIONS.ONBOARDING_TOKEN_VIEWED,
      userId: onboarding.userId,
      description: `OAuth onboarding token verified for ${onboarding.user.email}`,
      metadata: {
        token: onboarding.token,
        requestedPlan: onboarding.requestedPlan,
      },
    }).catch(console.error);

    return NextResponse.json({
      valid: true,
      user: onboarding.user,
      requestedPlan: onboarding.requestedPlan,
      token: onboarding.token,
    });
  } catch (error) {
    console.error("Error verifying OAuth onboarding token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
