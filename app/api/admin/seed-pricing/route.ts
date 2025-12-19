import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(req: NextRequest) {
  try {
    // Validate session and check for SUPER_ADMIN
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Super Admin only" },
        { status: 403 }
      );
    }

    const defaultPricing = [
      {
        plan: "ESSENTIAL",
        monthlyPrice: 29.0,
        monthlyPromoPrice: null,
        annualPrice: 290.0,
        annualPriceMonthly: 24.17,
        transactionFeePercent: 2.9,
        transactionFeeFixed: 0.3,
        baseStorageGB: 10,
        extraStoragePricePer100GB: 10.0,
        extraStoragePricePerGB: 0.1,
        isPopular: false,
        createdBy: user.id,
      },
      {
        plan: "GROWTH",
        monthlyPrice: 79.0,
        monthlyPromoPrice: null,
        annualPrice: 790.0,
        annualPriceMonthly: 65.83,
        transactionFeePercent: 2.7,
        transactionFeeFixed: 0.3,
        baseStorageGB: 50,
        extraStoragePricePer100GB: 8.0,
        extraStoragePricePerGB: 0.08,
        isPopular: true,
        createdBy: user.id,
      },
      {
        plan: "ENTERPRISE",
        monthlyPrice: 199.0,
        monthlyPromoPrice: null,
        annualPrice: 1990.0,
        annualPriceMonthly: 165.83,
        transactionFeePercent: 2.5,
        transactionFeeFixed: 0.3,
        baseStorageGB: 200,
        extraStoragePricePer100GB: 5.0,
        extraStoragePricePerGB: 0.05,
        isPopular: false,
        createdBy: user.id,
      },
    ];

    const results = [];
    for (const pricing of defaultPricing) {
      const result = await db.planPricing.upsert({
        where: { plan: pricing.plan },
        update: pricing,
        create: pricing,
      });
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      message: "Pricing seeded successfully",
      pricing: results,
    });
  } catch (error) {
    console.error("Error seeding pricing:", error);
    return NextResponse.json(
      { error: "Failed to seed pricing" },
      { status: 500 }
    );
  }
}
