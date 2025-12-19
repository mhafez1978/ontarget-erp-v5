import { db } from "@/lib/db";
import { PLAN_LIMITS, type PlanType } from "@/lib/plan-limits";

// Cache for pricing to avoid excessive DB calls
let pricingCache: Map<string, any> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get pricing for a specific plan from database
 * Falls back to hardcoded values if database is unavailable
 */
export async function getPlanPricing(plan: PlanType) {
  try {
    // Check cache first
    const now = Date.now();
    if (pricingCache && now - cacheTimestamp < CACHE_TTL) {
      const cached = pricingCache.get(plan);
      if (cached) return cached;
    }

    // Fetch from database
    const pricing = await db.planPricing.findUnique({
      where: { plan },
    });

    if (pricing) {
      // Update cache
      if (!pricingCache) pricingCache = new Map();
      pricingCache.set(plan, pricing);
      cacheTimestamp = now;
      
      return {
        name: plan,
        monthlyPrice: pricing.monthlyPrice,
        monthlyPromoPrice: pricing.monthlyPromoPrice,
        annualPrice: pricing.annualPrice,
        annualPriceMonthly: pricing.annualPriceMonthly,
        transactionFee: `${pricing.transactionFeePercent}% + $${pricing.transactionFeeFixed}`,
        transactionFeePercent: pricing.transactionFeePercent,
        transactionFeeFixed: pricing.transactionFeeFixed,
        baseStorageGB: pricing.baseStorageGB,
        extraStoragePricePer100GB: pricing.extraStoragePricePer100GB,
        extraStoragePricePerGB: pricing.extraStoragePricePerGB,
        isPopular: pricing.isPopular,
      };
    }

    // Fallback to hardcoded if not found in DB
    return null;
  } catch (error) {
    console.error("Error fetching plan pricing:", error);
    return null;
  }
}

/**
 * Get all plan pricing from database
 */
export async function getAllPlanPricing() {
  try {
    const pricing = await db.planPricing.findMany({
      orderBy: { monthlyPrice: "asc" },
    });

    return pricing.map((p) => ({
      id: p.plan,
      name: p.plan,
      monthlyPrice: p.monthlyPrice,
      monthlyPromoPrice: p.monthlyPromoPrice,
      annualPrice: p.annualPrice,
      annualPriceMonthly: p.annualPriceMonthly,
      transactionFee: `${p.transactionFeePercent}% + $${p.transactionFeeFixed}`,
      transactionFeePercent: p.transactionFeePercent,
      transactionFeeFixed: p.transactionFeeFixed,
      baseStorageGB: p.baseStorageGB,
      extraStoragePricePer100GB: p.extraStoragePricePer100GB,
      extraStoragePricePerGB: p.extraStoragePricePerGB,
      isPopular: p.isPopular,
      limits: PLAN_LIMITS[p.plan as PlanType],
    }));
  } catch (error) {
    console.error("Error fetching all plan pricing:", error);
    return [];
  }
}

/**
 * Clear the pricing cache (call this after updating pricing)
 */
export function clearPricingCache() {
  pricingCache = null;
  cacheTimestamp = 0;
}
