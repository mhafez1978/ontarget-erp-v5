/**
 * V6 FAQ Section Generator
 *
 * Generates FAQ section variants with common questions by industry.
 * Includes schema.org FAQPage markup for SEO.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { getCompanyContext } from "@/lib/frontstore/v6-data-service";
import { SectionKind } from "@prisma/client";

// ============================================================================
// TYPES
// ============================================================================

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function generateFallbackFAQs(
  industry: string,
  companyName: string
): FAQItem[] {
  const industryFAQs: Record<string, FAQItem[]> = {
    saas: [
      {
        id: "1",
        question: "How does the free trial work?",
        answer: `You get full access to all features for 14 days. No credit card required. After the trial, choose a plan that fits your needs or downgrade to our free tier.`,
        category: "Getting Started",
      },
      {
        id: "2",
        question: "Can I cancel my subscription anytime?",
        answer: `Yes, you can cancel anytime from your account settings. Your subscription will remain active until the end of your billing period, and you won't be charged again.`,
        category: "Billing",
      },
      {
        id: "3",
        question: "What payment methods do you accept?",
        answer: `We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for annual plans.`,
        category: "Billing",
      },
      {
        id: "4",
        question: "Is my data secure?",
        answer: `Absolutely. We use bank-level 256-bit SSL encryption, regular security audits, and comply with GDPR, SOC 2, and ISO 27001 standards.`,
        category: "Security",
      },
      {
        id: "5",
        question: "Do you offer customer support?",
        answer: `Yes! We offer email support for all plans, priority support for Professional plans, and 24/7 dedicated support for Enterprise customers.`,
        category: "Support",
      },
      {
        id: "6",
        question: "Can I upgrade or downgrade my plan?",
        answer: `Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the start of your next billing cycle.`,
        category: "Billing",
      },
    ],
    ecommerce: [
      {
        id: "1",
        question: "What are your shipping rates?",
        answer: `Shipping rates vary based on location and order size. Free standard shipping on orders over $50 within the continental US. International shipping available.`,
        category: "Shipping",
      },
      {
        id: "2",
        question: "What is your return policy?",
        answer: `We offer a 30-day money-back guarantee. Items must be unused and in original packaging. Return shipping is free for defective items.`,
        category: "Returns",
      },
      {
        id: "3",
        question: "How can I track my order?",
        answer: `Once your order ships, you'll receive a tracking number via email. You can also check your order status anytime in your account dashboard.`,
        category: "Shipping",
      },
      {
        id: "4",
        question: "Do you ship internationally?",
        answer: `Yes, we ship to over 100 countries worldwide. International shipping times vary by location, typically 7-21 business days.`,
        category: "Shipping",
      },
      {
        id: "5",
        question: "What payment methods do you accept?",
        answer: `We accept Visa, MasterCard, American Express, Discover, PayPal, Apple Pay, and Google Pay for secure checkout.`,
        category: "Payment",
      },
      {
        id: "6",
        question: "How do I contact customer service?",
        answer: `You can reach us via email at support@${companyName
          .toLowerCase()
          .replace(
            /\s+/g,
            ""
          )}.com or through our live chat during business hours (9am-6pm EST).`,
        category: "Support",
      },
    ],
    restaurant: [
      {
        id: "1",
        question: "Do you take reservations?",
        answer: `Yes, we accept reservations for parties of 2 or more. Walk-ins are welcome based on availability. You can book online or call us directly.`,
        category: "Reservations",
      },
      {
        id: "2",
        question: "Do you offer delivery or takeout?",
        answer: `Yes! We offer both delivery through major platforms and direct takeout. Orders can be placed online, by phone, or through our mobile app.`,
        category: "Ordering",
      },
      {
        id: "3",
        question: "What are your hours of operation?",
        answer: `We're open Tuesday-Sunday, 11am-10pm. Closed Mondays. Holiday hours may vary - check our website or call ahead.`,
        category: "General",
      },
      {
        id: "4",
        question: "Do you accommodate dietary restrictions?",
        answer: `Absolutely! We offer vegetarian, vegan, gluten-free, and dairy-free options. Please inform your server of any allergies or dietary needs.`,
        category: "Menu",
      },
      {
        id: "5",
        question: "Is parking available?",
        answer: `Yes, we have a free parking lot with 30 spaces. Street parking is also available. Valet service offered on weekends.`,
        category: "General",
      },
      {
        id: "6",
        question: "Do you host private events?",
        answer: `Yes! We have a private dining room that seats up to 40 guests. Perfect for birthdays, business meetings, and special occasions. Contact us for details.`,
        category: "Events",
      },
    ],
    default: [
      {
        id: "1",
        question: "How do I get started?",
        answer: `Getting started is easy! Simply create an account, choose your plan, and you'll have immediate access to all features. We also offer a guided onboarding tour.`,
        category: "Getting Started",
      },
      {
        id: "2",
        question: "What makes you different from competitors?",
        answer: `We focus on simplicity, reliability, and exceptional customer service. Our platform is designed to be intuitive while offering powerful features that grow with your needs.`,
        category: "About Us",
      },
      {
        id: "3",
        question: "How much does it cost?",
        answer: `We offer flexible pricing starting at $29/month. Check our pricing page for detailed plan comparisons. We also offer a 14-day free trial with no credit card required.`,
        category: "Pricing",
      },
      {
        id: "4",
        question: "Can I cancel anytime?",
        answer: `Yes, there are no long-term contracts. You can cancel your subscription at any time from your account settings. Your service continues until the end of your billing period.`,
        category: "Billing",
      },
      {
        id: "5",
        question: "Do you offer customer support?",
        answer: `Yes! We provide email support, live chat during business hours, and an extensive knowledge base. Enterprise customers receive priority support with faster response times.`,
        category: "Support",
      },
      {
        id: "6",
        question: "Is there a mobile app?",
        answer: `Yes, we have mobile apps for both iOS and Android. All your data syncs seamlessly across devices so you can work from anywhere.`,
        category: "Features",
      },
    ],
  };

  return industryFAQs[industry] || industryFAQs.default;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    // Await params (Next.js 15+)
    const { sectionId } = await params;

    // 1. Validate session
    const validation = await validateSessionForAPI(req);
    if (!validation.valid || !validation.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get section to verify ownership
    const section = await db.generatedSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // 3. Verify user has access to company
    const companyMember = await db.companyStaff.findFirst({
      where: {
        companyId: section.companyId,
        userId: validation.user.id,
      },
    });
    const isMember = !!companyMember;
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Get company context
    const context = await getCompanyContext(section.companyId);

    // 5. Generate industry-specific FAQs
    const industry = context.company.industry?.toLowerCase() || "default";
    const faqs = generateFallbackFAQs(industry, context.company.name);

    // Group FAQs by category
    const categories = Array.from(
      new Set(faqs.map((faq) => faq.category || "General"))
    );

    // 6. Generate 4 design variants
    const variants = [
      // VARIANT 1: Material Design - Expansion Panels
      {
        name: "Material Accordion",
        schema: {
          headline: "Frequently Asked Questions",
          subheadline: "Find answers to common questions about our service",
          faqs,
          categories,
          layout: "accordion",
          showCategories: true,
          defaultExpanded: 0,
        },
        meta: {
          designSystem: "material",
          typography: {
            headlineFont: "Roboto",
            headlineSize: "36px",
            headlineWeight: "500",
            subheadlineFont: "Roboto",
            subheadlineSize: "18px",
            questionFont: "Roboto",
            questionSize: "18px",
            questionWeight: "500",
            answerFont: "Roboto",
            answerSize: "16px",
          },
          spacing: {
            sectionPadding: "80px 24px",
            itemGap: "16px",
            itemPadding: "24px",
          },
          colors: {
            background: "#FAFAFA",
            panelBackground: "#FFFFFF",
            questionColor: "#212121",
            answerColor: "#616161",
            borderColor: "#E0E0E0",
            iconColor: "#1976D2",
          },
          effects: {
            panelElevation: "0 1px 3px rgba(0,0,0,0.12)",
            borderRadius: "4px",
            expandTransition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          },
          seo: {
            schemaType: "FAQPage",
            includeStructuredData: true,
          },
        },
      },

      // VARIANT 2: Apple HIG - Simple List
      {
        name: "Apple Clean List",
        schema: {
          headline: "Questions & Answers",
          subheadline: "Everything you need to know",
          faqs,
          categories,
          layout: "list",
          showCategories: false,
          defaultExpanded: null,
        },
        meta: {
          designSystem: "apple",
          typography: {
            headlineFont: "SF Pro Display",
            headlineSize: "48px",
            headlineWeight: "600",
            subheadlineFont: "SF Pro Text",
            subheadlineSize: "21px",
            questionFont: "SF Pro Display",
            questionSize: "20px",
            questionWeight: "600",
            answerFont: "SF Pro Text",
            answerSize: "17px",
          },
          spacing: {
            sectionPadding: "96px 20px",
            itemGap: "32px",
            itemPadding: "0px",
          },
          colors: {
            background: "#FFFFFF",
            panelBackground: "transparent",
            questionColor: "#1D1D1F",
            answerColor: "#6E6E73",
            borderColor: "#D2D2D7",
            iconColor: "#007AFF",
          },
          effects: {
            panelElevation: "none",
            borderRadius: "0px",
            borderBottom: "1px solid #D2D2D7",
            expandTransition: "max-height 0.4s ease",
          },
          seo: {
            schemaType: "FAQPage",
            includeStructuredData: true,
          },
        },
      },

      // VARIANT 3: Minimalist - Two Column Grid
      {
        name: "Minimalist Grid",
        schema: {
          headline: "FAQ",
          subheadline: null,
          faqs,
          categories,
          layout: "grid",
          showCategories: true,
          defaultExpanded: null,
        },
        meta: {
          designSystem: "minimalist",
          typography: {
            headlineFont: "Inter",
            headlineSize: "32px",
            headlineWeight: "600",
            subheadlineFont: "Inter",
            subheadlineSize: "16px",
            questionFont: "Inter",
            questionSize: "16px",
            questionWeight: "600",
            answerFont: "Inter",
            answerSize: "15px",
            letterSpacing: "-0.01em",
          },
          spacing: {
            sectionPadding: "64px 16px",
            itemGap: "40px",
            itemPadding: "0px",
            gridColumns: 2,
          },
          colors: {
            background: "#FFFFFF",
            panelBackground: "transparent",
            questionColor: "#000000",
            answerColor: "#666666",
            borderColor: "transparent",
            iconColor: "#000000",
          },
          effects: {
            panelElevation: "none",
            borderRadius: "0px",
            expandTransition: "none",
          },
          seo: {
            schemaType: "FAQPage",
            includeStructuredData: true,
          },
        },
      },

      // VARIANT 4: Bold - Categorized Tabs
      {
        name: "Bold Tabs",
        schema: {
          headline: "Got Questions? We've Got Answers",
          subheadline: "Browse by category or search for what you need",
          faqs,
          categories,
          layout: "tabs",
          showCategories: true,
          defaultExpanded: 0,
        },
        meta: {
          designSystem: "bold",
          typography: {
            headlineFont: "Montserrat",
            headlineSize: "42px",
            headlineWeight: "800",
            subheadlineFont: "Montserrat",
            subheadlineSize: "18px",
            questionFont: "Montserrat",
            questionSize: "19px",
            questionWeight: "700",
            answerFont: "Open Sans",
            answerSize: "16px",
          },
          spacing: {
            sectionPadding: "100px 24px",
            itemGap: "24px",
            itemPadding: "28px 32px",
          },
          colors: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            panelBackground: "#FFFFFF",
            questionColor: "#2D3748",
            answerColor: "#4A5568",
            borderColor: "#E2E8F0",
            iconColor: "#667eea",
            tabActiveBackground: "#667eea",
            tabActiveText: "#FFFFFF",
          },
          effects: {
            panelElevation: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: "12px",
            expandTransition: "all 0.3s ease-out",
            hoverEffect: "translateY(-2px)",
          },
          seo: {
            schemaType: "FAQPage",
            includeStructuredData: true,
          },
        },
      },
    ];

    // 7. Prepare variants JSON for storage
    const variantsJson = variants.map((v) => ({
      name: v.name,
      schema: v.schema,
      meta: v.meta,
    }));

    // 8. Update section status
    await db.generatedSection.update({
      where: { id: section.id },
      data: {
        status: "GENERATED",
        kind: SectionKind.FAQ,
        variants: variantsJson as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Generated ${variants.length} FAQ variants with ${faqs.length} questions`,
      section: {
        id: section.id,
        kind: "FAQ",
        variantCount: variants.length,
        faqCount: faqs.length,
      },
    });
  } catch (error) {
    console.error("FAQ generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate FAQ variants",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
