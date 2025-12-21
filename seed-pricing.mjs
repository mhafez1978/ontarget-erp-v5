import { db } from "@/lib/db";

async function seedPricing() {
  try {
    console.log("Seeding plan pricing...");

    // Find a SUPER_ADMIN user to use as creator
    const superAdmin = await db.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (!superAdmin) {
      console.error("❌ No SUPER_ADMIN user found. Cannot seed pricing.");
      console.log("Please create a SUPER_ADMIN user first.");
      return;
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
        createdBy: superAdmin.id,
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
        createdBy: superAdmin.id,
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
        createdBy: superAdmin.id,
      },
    ];

    for (const pricing of defaultPricing) {
      await db.planPricing.upsert({
        where: { plan: pricing.plan },
        update: pricing,
        create: pricing,
      });
      console.log(
        `✅ ${pricing.plan} pricing configured: $${pricing.monthlyPrice}/mo`
      );
    }

    console.log("\n✅ All pricing data seeded successfully!");
  } catch (error) {
    console.error("Error seeding pricing:", error);
  } finally {
    await db.$disconnect();
  }
}

seedPricing();
