/**
 * AI Storefront V3 Generation Service
 *
 * Generates multi-page, SEO-optimized, WCAG 2.1 AA compliant websites
 */

import { V3_SYSTEM_PROMPT } from "./v3-system-prompt.ts";
import {
  CompanyContext,
  V3Website,
  V3GenerationInput,
  V3GenerationResult,
  V3WebsiteSchema,
} from "./v3-types.ts";
import { callStorefrontModel } from "./model-client.ts";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Type definitions for database records
type DbLocation = {
  name: string | null;
  type: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
};

type DbProduct = {
  name: string;
  description: string | null;
  category: string | null;
  price: Decimal | null;
  images: { url: string }[];
};

type DbService = {
  name: string;
  description: string | null;
  category: string | null;
  price: Decimal | null;
  images: { url: string }[];
};

type DbStaff = {
  user: { name: string | null; image: string | null; email: string | null };
  role: string;
  bio: string | null;
};

type DbTestimonial = {
  customerName: string;
  customerTitle: string | null;
  customerPhoto: string | null;
  testimonial: string;
  rating: number;
  isFeatured: boolean;
};

type DbCompany = {
  name: string;
  industry: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  extractedBrandColors?: {
    primarySuggestion?: string;
    secondarySuggestion?: string;
  } | null;
  products?: DbProduct[];
  services?: DbService[];
  testimonials?: DbTestimonial[];
  staff?: DbStaff[];
  locations?: DbLocation[];
};

/**
 * Build company context from database data
 */
export async function buildCompanyContext(
  companyId: string,
  db: PrismaClient
): Promise<CompanyContext> {
  // Fetch company data
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      products: {
        where: { isPublished: true, isActive: true },
        take: 20,
        select: {
          name: true,
          description: true,
          category: true,
          price: true,
          images: {
            where: { isFeatured: true },
            take: 1,
            select: { url: true },
          },
        },
      },
      services: {
        where: { isActive: true },
        take: 20,
        select: {
          name: true,
          description: true,
          category: true,
          price: true,
          images: {
            where: { isFeatured: true },
            take: 1,
            select: { url: true },
          },
        },
      },
      testimonials: {
        where: { status: "APPROVED" },
        take: 10,
        orderBy: [
          { isFeatured: "desc" }, // Featured testimonials first
          { rating: "desc" }, // Then by rating
          { createdAt: "desc" }, // Most recent
        ],
        select: {
          customerName: true,
          customerTitle: true,
          customerPhoto: true,
          testimonial: true,
          rating: true,
          isFeatured: true,
        },
      },
      staff: {
        where: { isActive: true },
        take: 10,
        select: {
          user: { select: { name: true, image: true, email: true } },
          role: true,
          bio: true,
        },
      },
      locations: {
        select: {
          name: true,
          type: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // Build catalog summary
  const catalogSummary = buildCatalogSummary(
    company.products || [],
    company.services || []
  );

  // Build employees summary
  const employeesSummary = buildEmployeesSummary(company.staff || []);

  // Build testimonials summary
  const testimonialsSummary = buildTestimonialsSummary(
    company.testimonials || []
  );

  // Extract/generate SEO keywords
  const seoKeywords = generateSEOKeywords(
    company.industry,
    company.name,
    company.description,
    catalogSummary
  );

  // Determine tone based on industry and description
  const tone = determineTone(company.industry);

  // Smart industry detection if not set
  const detectedIndustry = detectIndustry(
    company.industry,
    company.name,
    company.description
  );

  // Format company locations
  const locations = (company.locations || []).map((loc: DbLocation) => ({
    name: loc.name || "",
    type: loc.type || "Office",
    address: [loc.addressLine1, loc.addressLine2].filter(Boolean).join(", "),
    city: loc.city || "",
    state: loc.state || undefined,
    postalCode: loc.postalCode || undefined,
    country: loc.country || "",
    phone: loc.phone || undefined,
    email: loc.email || undefined,
  }));

  // Format catalog data for AI (with images)
  const catalog = {
    products: (company.products || []).map((p: DbProduct) => ({
      name: p.name,
      description: p.description || undefined,
      category: p.category || undefined,
      price: p.price ? parseFloat(p.price.toString()) : undefined,
      image: p.images?.[0]?.url || undefined,
    })),
    services: (company.services || []).map((s: DbService) => ({
      name: s.name,
      description: s.description || undefined,
      category: s.category || undefined,
      price: s.price ? parseFloat(s.price.toString()) : undefined,
      image: s.images?.[0]?.url || undefined,
    })),
  };

  return {
    companyProfile: {
      name: company.name,
      industry: detectedIndustry,
      description: company.description || "",
      tone,
      location: [company.city, company.state, company.country]
        .filter(Boolean)
        .join(", "),
      targetAudience: determineTargetAudience(company.industry),
      phone: company.phone || undefined,
      email: company.email || undefined,
    },
    catalogSummary,
    catalog:
      catalog.products.length > 0 || catalog.services.length > 0
        ? catalog
        : undefined,
    employeesSummary,
    staff:
      (company.staff || []).length > 0
        ? (company.staff || []).map((s: DbStaff) => ({
            name: s.user.name || "Team Member",
            role:
              s.role === "ADMIN"
                ? "Administrator"
                : s.role === "MANAGER"
                ? "Manager"
                : "Team Member",
            image: s.user.image || undefined,
            email: s.user.email || undefined,
          }))
        : undefined,
    testimonialsSummary,
    testimonials:
      (company.testimonials || []).length > 0
        ? (company.testimonials || []).map((t: DbTestimonial) => ({
            customerName: t.customerName,
            customerTitle: t.customerTitle || undefined,
            customerPhoto: t.customerPhoto || undefined,
            testimonial: t.testimonial,
            rating: t.rating,
            isFeatured: t.isFeatured || false,
          }))
        : undefined,
    seoKeywords,
    branding: {
      primaryColor: extractPrimaryColor(company),
      secondaryColor: extractSecondaryColor(company),
      fontStyle: determineFontStyle(company.industry, tone),
    },
    locations: locations.length > 0 ? locations : undefined,
  };
}

/**
 * Detect industry from company name and description
 */
function detectIndustry(
  industry: string | null,
  companyName: string,
  description: string | null
): string {
  // If industry is set, use it
  if (industry) return industry;

  // Analyze company name and description for industry keywords
  const text = `${companyName} ${description || ""}`.toLowerCase();

  // Industry patterns (order matters - more specific first)
  const patterns = [
    {
      keywords: ["web design", "web development", "website", "web agency"],
      industry: "Web Design & Development",
    },
    {
      keywords: ["software", "saas", "app development"],
      industry: "Software & Technology",
    },
    {
      keywords: ["restaurant", "cafe", "food", "catering"],
      industry: "Food & Beverage",
    },
    {
      keywords: ["real estate", "property", "realtor"],
      industry: "Real Estate",
    },
    { keywords: ["law firm", "attorney", "legal"], industry: "Legal Services" },
    {
      keywords: ["doctor", "medical", "health", "clinic"],
      industry: "Healthcare",
    },
    {
      keywords: ["accountant", "accounting", "tax"],
      industry: "Financial Services",
    },
    {
      keywords: ["marketing", "advertising", "digital agency"],
      industry: "Marketing & Advertising",
    },
    {
      keywords: ["construction", "contractor", "builder"],
      industry: "Construction",
    },
    { keywords: ["retail", "shop", "store", "ecommerce"], industry: "Retail" },
    { keywords: ["consulting", "consultant"], industry: "Business Consulting" },
    {
      keywords: ["fitness", "gym", "training"],
      industry: "Fitness & Wellness",
    },
    { keywords: ["education", "school", "training"], industry: "Education" },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some((keyword) => text.includes(keyword))) {
      return pattern.industry;
    }
  }

  return "Professional Services";
}

function buildCatalogSummary(
  products: DbProduct[],
  services: DbService[]
): string {
  const parts: string[] = [];

  if (products.length > 0) {
    const categories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    parts.push(
      `${products.length} products` +
        (categories.length > 0
          ? ` across ${categories.length} categories: ${categories.join(", ")}`
          : "")
    );
  }

  if (services.length > 0) {
    const categories = [
      ...new Set(services.map((s) => s.category).filter(Boolean)),
    ];
    parts.push(
      `${services.length} services` +
        (categories.length > 0 ? ` including ${categories.join(", ")}` : "")
    );
  }

  return parts.length > 0
    ? parts.join(". ")
    : "No products or services currently listed.";
}

function buildEmployeesSummary(staff: DbStaff[]): string {
  if (staff.length === 0) {
    return "Team information not available.";
  }

  const roles = staff.map((s) => s.role).filter(Boolean);
  const uniqueRoles = [...new Set(roles)];

  return `Team of ${staff.length} members including ${uniqueRoles
    .slice(0, 3)
    .join(", ")}${uniqueRoles.length > 3 ? " and more" : ""}.`;
}

function buildTestimonialsSummary(testimonials: DbTestimonial[]): string {
  if (testimonials.length === 0) {
    return "No customer testimonials available yet.";
  }

  const avgRating =
    testimonials.reduce((sum, t) => sum + (t.rating || 0), 0) /
    testimonials.length;

  return `${
    testimonials.length
  } customer testimonials with average rating of ${avgRating.toFixed(
    1
  )}/5. Customers praise quality and service.`;
}

function generateSEOKeywords(
  industry: string | null,
  companyName: string,
  description: string | null,
  catalogSummary: string
): string[] {
  const keywords: string[] = [];

  // Add company name
  keywords.push(companyName.toLowerCase());

  // Add industry keywords
  if (industry) {
    keywords.push(industry.toLowerCase());
    keywords.push(`${industry.toLowerCase()} services`);
    keywords.push(`${industry.toLowerCase()} company`);
  }

  // Extract keywords from description
  if (description) {
    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4); // Only words longer than 4 chars
    keywords.push(...words.slice(0, 10));
  }

  // Add catalog-related keywords
  if (catalogSummary.includes("services")) {
    keywords.push("professional services");
  }
  if (catalogSummary.includes("products")) {
    keywords.push("quality products");
  }

  // Return unique keywords, limited to 15
  return [...new Set(keywords)].slice(0, 15);
}

function determineTone(
  industry: string | null
): "formal" | "casual" | "professional" | "luxury" {
  if (!industry) return "professional";

  const industryLower = industry.toLowerCase();

  if (
    industryLower.includes("law") ||
    industryLower.includes("legal") ||
    industryLower.includes("finance") ||
    industryLower.includes("consulting")
  ) {
    return "formal";
  }

  if (
    industryLower.includes("luxury") ||
    industryLower.includes("premium") ||
    industryLower.includes("boutique")
  ) {
    return "luxury";
  }

  if (
    industryLower.includes("creative") ||
    industryLower.includes("design") ||
    industryLower.includes("startup") ||
    industryLower.includes("tech")
  ) {
    return "casual";
  }

  return "professional";
}

function determineTargetAudience(industry: string | null): string {
  if (!industry) return "General consumers and businesses";

  const industryLower = industry.toLowerCase();

  if (industryLower.includes("b2b") || industryLower.includes("enterprise")) {
    return "Business decision makers and enterprise clients";
  }

  if (
    industryLower.includes("healthcare") ||
    industryLower.includes("medical")
  ) {
    return "Patients and healthcare consumers";
  }

  if (
    industryLower.includes("e-commerce") ||
    industryLower.includes("retail")
  ) {
    return "Online shoppers and retail customers";
  }

  if (
    industryLower.includes("agency") ||
    industryLower.includes("consulting")
  ) {
    return "Companies seeking professional services";
  }

  return "General consumers and businesses";
}

function extractPrimaryColor(company: DbCompany): string {
  // Try to extract from logo colors if available
  if (company.extractedBrandColors?.primarySuggestion) {
    return company.extractedBrandColors.primarySuggestion;
  }

  // Default based on industry
  const industry = (company.industry || "").toLowerCase();

  if (industry.includes("tech") || industry.includes("software")) {
    return "#2563EB"; // Blue
  }
  if (industry.includes("health") || industry.includes("medical")) {
    return "#10B981"; // Green
  }
  if (industry.includes("creative") || industry.includes("design")) {
    return "#8B5CF6"; // Purple
  }
  if (industry.includes("finance") || industry.includes("legal")) {
    return "#1E40AF"; // Dark Blue
  }

  return "#2563EB"; // Default blue
}

function extractSecondaryColor(company: DbCompany): string {
  if (company.extractedBrandColors?.secondarySuggestion) {
    return company.extractedBrandColors.secondarySuggestion;
  }
  return "#64748B"; // Neutral gray
}

function determineFontStyle(industry: string | null, tone: string): string {
  if (tone === "luxury") {
    return "Playfair Display, serif";
  }
  if (tone === "formal") {
    return "Inter, sans-serif";
  }
  if (tone === "casual") {
    return "Poppins, sans-serif";
  }
  return "Inter, sans-serif"; // Professional default
}

/**
 * Validate generated website against quality standards
 */
function validateWebsite(website: V3Website): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Validate pages
  if (website.pages.length < 4) {
    errors.push("Website must have at least 4 pages");
    score -= 25;
  }

  // Check each page
  website.pages.forEach((page) => {
    // SEO checks
    if (page.seo.title.length > 120) {
      errors.push(`Page "${page.pageName}" title exceeds 120 characters`);
      score -= 5;
    }
    if (page.seo.description.length > 200) {
      errors.push(`Page "${page.pageName}" description exceeds 200 characters`);
      score -= 5;
    }
    if (!page.seo.keywords || page.seo.keywords.length === 0) {
      warnings.push(`Page "${page.pageName}" has no SEO keywords`);
      score -= 2;
    }

    // Heading hierarchy check
    if (!page.headingHierarchy.h1) {
      errors.push(`Page "${page.pageName}" missing H1 heading`);
      score -= 10;
    }
    if (page.headingHierarchy.h2s.length === 0) {
      warnings.push(`Page "${page.pageName}" has no H2 headings`);
      score -= 3;
    }

    // Section checks
    if (page.sections.length === 0) {
      errors.push(`Page "${page.pageName}" has no sections`);
      score -= 15;
    }

    page.sections.forEach((section) => {
      if (!section.accessibility.ariaLabel) {
        errors.push(
          `Section "${section.heading}" on page "${page.pageName}" missing ariaLabel`
        );
        score -= 3;
      }

      // Check for invalid placeholder image URLs
      const content = section.content as Record<string, unknown>;
      const checkForInvalidUrls = (obj: unknown, path: string = "") => {
        if (!obj) return;
        if (typeof obj === "string") {
          // Skip validation for non-image URL fields (maps, external links, etc)
          const isNonImageUrlField =
            path.includes("mapUrl") ||
            path.includes("ctaLink") ||
            path.includes("link") ||
            (path.includes("url") && !path.includes("image"));

          if (
            !isNonImageUrlField &&
            (obj.includes("example.com") ||
              obj.includes("placeholder.com") ||
              obj.includes("yoursite.com") ||
              (obj.startsWith("http") &&
                !obj.includes("images.unsplash.com") &&
                !obj.startsWith("/")))
          ) {
            errors.push(
              `Invalid image URL in section "${section.heading}" on page "${
                page.pageName
              }": ${obj.substring(0, 50)}`
            );
            score -= 5;
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, idx) =>
            checkForInvalidUrls(item, `${path}[${idx}]`)
          );
        } else if (typeof obj === "object") {
          Object.entries(obj).forEach(([key, value]) =>
            checkForInvalidUrls(value, `${path}.${key}`)
          );
        }
      };
      checkForInvalidUrls(content);
    });
  });

  // Accessibility checks
  if (!website.accessibility.contrastVerified) {
    errors.push("Color contrast not verified for WCAG AA compliance");
    score -= 10;
  }
  if (!website.accessibility.altTextComplete) {
    errors.push("Not all images have alt text");
    score -= 10;
  }

  // Navigation check
  if (!website.navigation.primary || website.navigation.primary.length === 0) {
    errors.push("Missing primary navigation");
    score -= 15;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    qualityScore: Math.max(0, score),
  };
}

/**
 * Generate V3 website using AI
 */
export async function generateV3Website(
  input: V3GenerationInput
): Promise<V3GenerationResult> {
  try {
    // Build user message
    const userMessage = `Generate a complete website for this company:

${JSON.stringify(input.context, null, 2)}

${
  input.userInstructions
    ? `\nAdditional Instructions: ${input.userInstructions}`
    : ""
}

Remember:
- Generate at least 4 pages (home, about, services/products, contact)
- Ensure WCAG 2.1 AA accessibility
- Optimize for SEO (titles ≤60 chars, descriptions ≤160 chars)
- One H1 per page with logical heading hierarchy
- All sections need ariaLabel and altText
- Return ONLY valid JSON matching the schema

Generate the website now.`;

    // Call AI model
    const messages = [
      { role: "system" as const, content: V3_SYSTEM_PROMPT },
      { role: "user" as const, content: userMessage },
    ];

    const response = await callStorefrontModel(
      messages,
      z.unknown(),
      input.providerConfig
    );

    if (!response) {
      return {
        website: null,
        errors: ["AI model did not return a response"],
        warnings: [],
        qualityScore: 0,
        validationResults: {
          seoCompliance: false,
          accessibilityCompliance: false,
          contentQuality: false,
        },
      };
    }

    // ===== CONSOLE LOG AI RESPONSE FOR DEBUGGING =====
    console.log("========================================");
    console.log("[V3 Generation] AI RETURNED JSON:");
    console.log("========================================");
    console.log(JSON.stringify(response, null, 2));
    console.log("========================================");
    console.log(
      "[V3 Generation] Page count:",
      (response as Record<string, unknown>)?.pages &&
        Array.isArray((response as Record<string, unknown>).pages)
        ? ((response as Record<string, unknown>).pages as unknown[]).length
        : 0
    );
    console.log(
      "[V3 Generation] Brand colors:",
      (response as Record<string, unknown>)?.brand &&
        typeof (response as Record<string, unknown>).brand === "object" &&
        (response as Record<string, unknown>).brand !== null
        ? (
            (response as Record<string, unknown>).brand as Record<
              string,
              unknown
            >
          ).colors || "none"
        : "none"
    );
    console.log("========================================");

    // Parse and validate response
    const validation = V3WebsiteSchema.safeParse(response);

    if (!validation.success) {
      console.error(
        "[V3 Generation] Schema validation failed:",
        validation.error
      );
      return {
        website: null,
        errors: [
          "AI generated invalid website structure",
          ...validation.error.issues.map(
            (e) => `${e.path.join(".")}: ${e.message}`
          ),
        ],
        warnings: [],
        qualityScore: 0,
        validationResults: {
          seoCompliance: false,
          accessibilityCompliance: false,
          contentQuality: false,
        },
      };
    }

    const website = validation.data;

    // Quality validation
    const qualityCheck = validateWebsite(website);

    return {
      website: qualityCheck.isValid ? website : null,
      errors: qualityCheck.errors,
      warnings: qualityCheck.warnings,
      qualityScore: qualityCheck.qualityScore,
      validationResults: {
        seoCompliance:
          qualityCheck.errors.filter((e) => e.toLowerCase().includes("seo"))
            .length === 0,
        accessibilityCompliance:
          qualityCheck.errors.filter((e) =>
            e.toLowerCase().includes("accessibility")
          ).length === 0,
        contentQuality: qualityCheck.qualityScore >= 80,
      },
    };
  } catch (error) {
    console.error("[V3 Generation] Error:", error);
    return {
      website: null,
      errors: [
        error instanceof Error ? error.message : "Unknown generation error",
      ],
      warnings: [],
      qualityScore: 0,
      validationResults: {
        seoCompliance: false,
        accessibilityCompliance: false,
        contentQuality: false,
      },
    };
  }
}
