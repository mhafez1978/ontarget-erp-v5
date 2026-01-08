import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }

    const user = validation.user;

    // Only SUPER_ADMIN can create promo codes
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - SUPER_ADMIN access required" },
        { status: 403 }
      );
    }

    // Create the OnTargetLove promo code
    const promoCode = await db.promoCode.upsert({
      where: { code: "OnTargetLove" },
      update: {
        isActive: true,
        flatFeeAmount: 0.99,
      },
      create: {
        code: "OnTargetLove",
        description: "Beta testing special - $0.99/month for the first year",
        discountType: "FLAT_FEE",
        flatFeeAmount: 0.99,
        percentageOff: null,
        freeTrialDays: null,
        isActive: true,
        expiresAt: null,
        maxUses: null,
        timesUsed: 0,
      },
    });

    return NextResponse.json({
      success: true,
      promoCode: {
        code: promoCode.code,
        description: promoCode.description,
        flatFeeAmount: promoCode.flatFeeAmount,
        isActive: promoCode.isActive,
      },
    });
  } catch (error) {
    console.error("Error creating promo code:", error);
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}
