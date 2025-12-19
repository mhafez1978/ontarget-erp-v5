import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPricing() {
  console.log("Seeding plan pricing...");

  const pricingData = [
    {
      plan: "ESSENTIAL",
      monthlyPrice: 49.99,
      monthlyPromoPrice: 45.99,
      annualPrice: 509.88,
      annualPriceMonthly: 42.49,
      transactionFeePercent: 3.9,
      transactionFeeFixed: 0.99,
      baseStorageGB: 50,
      extraStoragePricePer100GB: 10,
      extraStoragePricePerGB: 0.45,
      isPopular: false,
    },
    {
      plan: "GROWTH",
      monthlyPrice: 299.99,
      monthlyPromoPrice: null,
      annualPrice: 3479.88,
      annualPriceMonthly: 289.99,
      transactionFeePercent: 3.2,
      transactionFeeFixed: 0.49,
      baseStorageGB: 250,
      extraStoragePricePer100GB: 35,
      extraStoragePricePerGB: 0.32,
      isPopular: true,
    },
    {
      plan: "ENTERPRISE",
      monthlyPrice: 999.99,
      monthlyPromoPrice: null,
      annualPrice: 11639.88,
      annualPriceMonthly: 969.99,
      transactionFeePercent: 2.9,
      transactionFeeFixed: 0.2,
      baseStorageGB: 1000,
      extraStoragePricePer100GB: 100,
      extraStoragePricePerGB: 0.25,
      isPopular: false,
    },
  ];

  for (const pricing of pricingData) {
    await prisma.planPricing.upsert({
      where: { plan: pricing.plan },
      update: pricing,
      create: pricing,
    });
    console.log(`✓ Seeded pricing for ${pricing.plan}`);
  }

  console.log("Plan pricing seeding complete!");
}

seedPricing()
  .catch((error) => {
    console.error("Error seeding pricing:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
