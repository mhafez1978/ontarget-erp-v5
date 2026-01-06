import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Promo code is required" },
        { status: 400 }
      );
    }

    // Find promo code (case-insensitive by getting all and comparing)
    const allPromoCodes = await db.promoCode.findMany();
    const promoCode = allPromoCodes.find(
      (pc) => pc.code.toUpperCase() === code.trim().toUpperCase()
    );

    if (!promoCode) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code" },
        { status: 404 }
      );
    }

    // Check if promo is active
    if (!promoCode.isActive) {
      return NextResponse.json(
        { valid: false, error: "This promo code is no longer active" },
        { status: 400 }
      );
    }

    // Check expiration
    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, error: "This promo code has expired" },
        { status: 400 }
      );
    }

    // Check usage limit
    if (
      promoCode.maxUses !== null &&
      promoCode.timesUsed >= promoCode.maxUses
    ) {
      return NextResponse.json(
        { valid: false, error: "This promo code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Return valid promo code details
    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        flatFeeAmount: promoCode.flatFeeAmount?.toNumber(),
        percentageOff: promoCode.percentageOff,
        freeTrialDays: promoCode.freeTrialDays,
      },
    });
  } catch (error) {
    console.error("Error validating promo code:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate promo code" },
      { status: 500 }
    );
  }
}
