/**
 * V6 Pricing Section Generator
 *
 * Generates pricing section variants with plan tiers.
 * Queries Subscription/PricingPlan tables or generates industry-standard tiers.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/validate-session";
import { getCompanyContext } from "@/lib/frontstore/v6-data-service";

// ============================================================================
// TYPES
// ============================================================================

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  currency: string;
  features: string[];
  highlighted?: boolean;
  popular?: boolean;
  cta: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function generateFallbackPricing(
  industry: string,
  companyName: string
): PricingTier[] {
  const industryPlans: Record<string, PricingTier[]> = {
    saas: [
      {
        id: "starter",
        name: "Starter",
        description: "Perfect for individuals and small teams",
        price: 29,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "Up to 5 users",
          "10 GB storage",
          "Basic support",
          "Core features",
          "Mobile app access",
        ],
        cta: "Start Free Trial",
      },
      {
        id: "professional",
        name: "Professional",
        description: "For growing businesses",
        price: 79,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "Up to 25 users",
          "100 GB storage",
          "Priority support",
          "Advanced features",
          "Custom integrations",
          "Analytics dashboard",
        ],
        popular: true,
        highlighted: true,
        cta: "Start Free Trial",
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "For large organizations",
        price: 299,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "Unlimited users",
          "Unlimited storage",
          "24/7 dedicated support",
          "All features",
          "Custom development",
          "SLA guarantee",
          "Dedicated account manager",
        ],
        cta: "Contact Sales",
      },
    ],
    ecommerce: [
      {
        id: "basic",
        name: "Basic",
        description: "Start selling online",
        price: 19,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "Up to 50 products",
          "Basic store design",
          "Payment processing",
          "Order management",
          "Email support",
        ],
        cta: "Get Started",
      },
      {
        id: "growth",
        name: "Growth",
        description: "Scale your business",
        price: 49,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "Unlimited products",
          "Custom store design",
          "Advanced analytics",
          "Marketing tools",
          "Priority support",
          "Discount codes",
        ],
        popular: true,
        highlighted: true,
        cta: "Get Started",
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "For high-volume sellers",
        price: 299,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "Everything in Growth",
          "Dedicated account manager",
          "Custom integrations",
          "API access",
          "Priority phone support",
          "Advanced security",
        ],
        cta: "Contact Sales",
      },
    ],
    default: [
      {
        id: "basic",
        name: "Basic",
        description: "Essential features to get started",
        price: 29,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "Core features",
          "Email support",
          "Basic analytics",
          "Mobile access",
        ],
        cta: "Get Started",
      },
      {
        id: "professional",
        name: "Professional",
        description: "Advanced features for professionals",
        price: 79,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "All Basic features",
          "Priority support",
          "Advanced analytics",
          "Custom branding",
          "API access",
          "Team collaboration",
        ],
        popular: true,
        highlighted: true,
        cta: "Get Started",
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "Custom solutions for your business",
        price: 299,
        billingPeriod: "monthly",
        currency: "USD",
        features: [
          "All Professional features",
          "Unlimited everything",
          "24/7 dedicated support",
          "Custom integrations",
          "SLA guarantee",
          "Account manager",
        ],
        cta: "Contact Sales",
      },
    ],
  };

  return industryPlans[industry] || industryPlans.default;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    // 1. Validate session
    const session = await validateSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get section to verify ownership
    const section = await db.generatedSection.findUnique({
      where: { id: params.sectionId },
      include: {
        draft: {
          include: {
            company: {
              include: {
                members: {
                  where: { userId: session.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // 3. Verify user has access to company
    const isMember = section.draft.company.members.length > 0;
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Get company context
    const context = await getCompanyContext(section.draft.companyId);

    // 5. Query pricing plans (if exists) or generate fallbacks
    // Check if company has Subscription model with plans
    let pricingTiers: PricingTier[] = [];

    try {
      // Try to query existing pricing plans (assuming Subscription model exists)
      const subscriptions = await db.subscription.findMany({
        where: {
          companyId: section.draft.companyId,
        },
        select: {
          id: true,
          plan: true,
          status: true,
        },
        take: 3,
      });

      if (subscriptions.length > 0) {
        // Map subscriptions to pricing tiers (simplified)
        pricingTiers = subscriptions.map((sub, index) => ({
          id: sub.id,
          name: sub.plan || `Plan ${index + 1}`,
          description: `${sub.plan} subscription plan`,
          price: 0, // Would need actual pricing data
          billingPeriod: "monthly" as const,
          currency: "USD",
          features: [],
          popular: index === 1,
          highlighted: index === 1,
          cta: "Get Started",
        }));
      }
    } catch (error) {
      // Subscription model might not exist, use fallbacks
      console.log("Subscription query failed, using fallbacks");
    }

    // If no pricing data found, generate industry-specific fallbacks
    if (pricingTiers.length === 0) {
      const industry = context.company.industry?.toLowerCase() || "default";
      pricingTiers = generateFallbackPricing(industry, context.company.name);
    }

    // 6. Generate 4 design variants
    const variants = [
      // VARIANT 1: Material Design - Cards with Elevation
      {
        name: "Material Cards",
        schema: {
          headline: "Choose Your Plan",
          subheadline: `Select the perfect plan for your needs`,
          tiers: pricingTiers,
          showBillingToggle: true,
          showAnnualDiscount: true,
          layout: "cards",
          columns: 3,
        },
        meta: {
          designSystem: "material",
          typography: {
            headlineFont: "Roboto",
            headlineSize: "36px",
            headlineWeight: "500",
            subheadlineFont: "Roboto",
            subheadlineSize: "18px",
            priceFont: "Roboto",
            priceSize: "48px",
            priceWeight: "700",
          },
          spacing: {
            sectionPadding: "80px 24px",
            cardGap: "32px",
            cardPadding: "40px 32px",
          },
          colors: {
            background: "#FAFAFA",
            cardBackground: "#FFFFFF",
            highlightBackground: "#1976D2",
            highlightText: "#FFFFFF",
            priceColor: "#212121",
            featuresColor: "#616161",
          },
          effects: {
            cardElevation: "0 2px 8px rgba(0,0,0,0.1)",
            highlightElevation: "0 8px 24px rgba(25,118,210,0.3)",
            borderRadius: "8px",
          },
        },
      },

      // VARIANT 2: Apple HIG - Clean Minimalist
      {
        name: "Apple Minimal",
        schema: {
          headline: "Simple, Transparent Pricing",
          subheadline: `Choose the plan that's right for you`,
          tiers: pricingTiers,
          showBillingToggle: true,
          showAnnualDiscount: true,
          layout: "list",
          columns: 3,
        },
        meta: {
          designSystem: "apple",
          typography: {
            headlineFont: "SF Pro Display",
            headlineSize: "48px",
            headlineWeight: "600",
            subheadlineFont: "SF Pro Text",
            subheadlineSize: "21px",
            priceFont: "SF Pro Display",
            priceSize: "56px",
            priceWeight: "700",
          },
          spacing: {
            sectionPadding: "96px 20px",
            cardGap: "24px",
            cardPadding: "48px 40px",
          },
          colors: {
            background: "#FFFFFF",
            cardBackground: "#F5F5F7",
            highlightBackground: "#007AFF",
            highlightText: "#FFFFFF",
            priceColor: "#1D1D1F",
            featuresColor: "#6E6E73",
          },
          effects: {
            cardElevation: "none",
            highlightElevation: "0 4px 16px rgba(0,122,255,0.2)",
            borderRadius: "18px",
            hoverScale: "1.02",
          },
        },
      },

      // VARIANT 3: Minimalist - Text-Focused Comparison
      {
        name: "Minimalist Table",
        schema: {
          headline: "Pricing Plans",
          subheadline: `All plans include 14-day free trial`,
          tiers: pricingTiers,
          showBillingToggle: false,
          showAnnualDiscount: false,
          layout: "table",
          columns: 3,
        },
        meta: {
          designSystem: "minimalist",
          typography: {
            headlineFont: "Inter",
            headlineSize: "32px",
            headlineWeight: "600",
            subheadlineFont: "Inter",
            subheadlineSize: "16px",
            priceFont: "Inter",
            priceSize: "42px",
            priceWeight: "700",
            letterSpacing: "-0.02em",
          },
          spacing: {
            sectionPadding: "64px 16px",
            cardGap: "1px",
            cardPadding: "32px 24px",
          },
          colors: {
            background: "#FFFFFF",
            cardBackground: "#FFFFFF",
            highlightBackground: "#000000",
            highlightText: "#FFFFFF",
            priceColor: "#000000",
            featuresColor: "#666666",
            border: "#E5E5E5",
          },
          effects: {
            cardElevation: "none",
            highlightElevation: "none",
            borderRadius: "0px",
            border: "1px solid #E5E5E5",
          },
        },
      },

      // VARIANT 4: Bold/Modern - Gradient & Dynamic
      {
        name: "Bold Gradient",
        schema: {
          headline: "Flexible Pricing for Every Need",
          subheadline: `Start free, scale as you grow`,
          tiers: pricingTiers,
          showBillingToggle: true,
          showAnnualDiscount: true,
          layout: "cards",
          columns: 3,
        },
        meta: {
          designSystem: "bold",
          typography: {
            headlineFont: "Montserrat",
            headlineSize: "42px",
            headlineWeight: "800",
            subheadlineFont: "Montserrat",
            subheadlineSize: "20px",
            priceFont: "Montserrat",
            priceSize: "52px",
            priceWeight: "900",
          },
          spacing: {
            sectionPadding: "100px 24px",
            cardGap: "40px",
            cardPadding: "48px 36px",
          },
          colors: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            cardBackground: "#FFFFFF",
            highlightBackground:
              "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            highlightText: "#FFFFFF",
            priceColor: "#2D3748",
            featuresColor: "#4A5568",
          },
          effects: {
            cardElevation: "0 10px 40px rgba(0,0,0,0.15)",
            highlightElevation: "0 20px 60px rgba(245,87,108,0.4)",
            borderRadius: "16px",
            hoverTransform: "translateY(-8px)",
          },
        },
      },
    ];

    // 7. Save variants to database
    for (const variant of variants) {
      await db.generatedVariant.create({
        data: {
          sectionId: section.id,
          name: variant.name,
          schema: variant.schema,
          meta: variant.meta,
        },
      });
    }

    // 8. Update section status
    await db.generatedSection.update({
      where: { id: section.id },
      data: {
        status: "READY",
        kind: "PRICING",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${variants.length} pricing variants`,
      section: {
        id: section.id,
        kind: "PRICING",
        variantCount: variants.length,
      },
    });
  } catch (error) {
    console.error("Pricing generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate pricing variants",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
