/**
 * AI Storefront V3 Types
 *
 * Multi-page, SEO-optimized, WCAG 2.1 AA compliant website generation
 * Unlike V1/V2 which generate single-page storefronts, V3 generates
 * complete multi-page websites optimized for search engines and accessibility.
 */

import { z } from "zod";
import type { AiProviderConfig } from "./model-client";

/**
 * Input: Company Context provided to AI
 * This is the structured data the AI receives to generate the website
 */
export const CompanyContextSchema = z.object({
  companyProfile: z.object({
    name: z.string(),
    industry: z.string(),
    description: z.string(),
    tone: z.enum(["formal", "casual", "professional", "luxury"]),
    location: z.string(),
    targetAudience: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
  }),
  catalogSummary: z.string(), // Summary of products/services
  catalog: z
    .object({
      products: z
        .array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            category: z.string().optional(),
            price: z.number().optional(),
            image: z.string().optional(),
          })
        )
        .optional(),
      services: z
        .array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            category: z.string().optional(),
            price: z.number().optional(),
            image: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(), // Full catalog with images for AI to use
  employeesSummary: z.string(), // Team information
  staff: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        image: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .optional(), // Actual company staff members
  testimonialsSummary: z.string(), // Customer feedback
  testimonials: z
    .array(
      z.object({
        customerName: z.string(),
        customerTitle: z.string().optional(),
        customerPhoto: z.string().optional(),
        testimonial: z.string(),
        rating: z.number(),
        isFeatured: z.boolean().optional(),
      })
    )
    .optional(), // Full testimonial objects for AI to use
  seoKeywords: z.array(z.string()), // Target keywords for SEO
  branding: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    fontStyle: z.string(),
  }),
  locations: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string(),
        phone: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .optional(), // Physical locations/offices
});

export type CompanyContext = z.infer<typeof CompanyContextSchema>;

/**
 * Section types available in V3
 * Each section is a reusable component with accessibility built-in
 */
export const V3SectionTypeSchema = z.enum([
  "hero",
  "features",
  "catalog", // Products or services
  "testimonials",
  "about",
  "faq",
  "cta",
  "contact",
  "team",
  "portfolio",
  "stats",
  "process", // How it works / methodology
  "pricing",
  "blog-preview",
]);

/**
 * Accessibility metadata for each section
 */
export const AccessibilitySchema = z.object({
  ariaLabel: z.string(),
  altText: z.string().optional().nullable(), // Optional and can be null
  role: z.string().optional(), // ARIA role
  landmarks: z.array(z.string()).optional(), // Landmark regions
});

/**
 * SEO metadata for each page
 */
export const SEOSchema = z.object({
  title: z
    .string()
    .max(120, { message: "SEO title must be 120 characters or fewer" }), // Max 120 characters (allow longer for better SEO)
  description: z
    .string()
    .max(200, { message: "SEO description must be 200 characters or fewer" }), // Max 200 characters (Google shows ~160 but allow buffer)
  keywords: z.array(z.string()),
  canonicalUrl: z.string().optional(),
  ogImage: z.string().optional(),
  structuredData: z.record(z.string(), z.unknown()).optional(), // Schema.org JSON-LD
});

/**
 * Section schema - each section on a page
 */
export const V3SectionSchema = z.object({
  type: V3SectionTypeSchema,
  heading: z.string(),
  subheading: z.string().optional(),
  content: z.union([
    z.record(z.string(), z.unknown()), // Object format
    z.array(z.unknown()), // Array format (AI sometimes generates this)
  ]), // Flexible content structure
  accessibility: AccessibilitySchema,
  order: z.number().int(),
});

/**
 * Page schema - each page in the website
 */
export const V3PageSchema = z.object({
  slug: z.string(), // URL path (e.g., "about", "services", "contact")
  pageName: z.string(), // Display name
  seo: SEOSchema,
  sections: z.array(V3SectionSchema),
  headingHierarchy: z.object({
    h1: z.string(), // Must have exactly one H1
    h2s: z.array(z.string()).default([]), // Optional H2s
    h3s: z.array(z.string()).default([]), // Optional H3s
  }),
});

/**
 * Brand identity for the website
 */
export const BrandSchema = z.object({
  colors: z.array(z.string()), // Brand colors with WCAG AA contrast verified
  fonts: z.array(z.string()), // Typography choices
  tone: z.string(), // Voice and tone guidelines
  logo: z.string().optional(),
});

/**
 * Complete website blueprint generated by AI
 */
export const V3WebsiteSchema = z.object({
  version: z.literal(3),
  generatedAt: z.string(), // ISO timestamp
  brand: BrandSchema,
  pages: z.array(V3PageSchema).min(4), // Minimum 4 pages (home, about, services/products, contact)
  navigation: z.object({
    primary: z.array(
      z.object({
        label: z.string(),
        slug: z.string(),
        order: z.number(),
      })
    ),
    footer: z
      .array(
        z.object({
          label: z.string(),
          slug: z.string(),
        })
      )
      .optional(),
  }),
  accessibility: z.object({
    contrastVerified: z.boolean(), // All color combinations meet WCAG AA
    semanticHtmlUsed: z.boolean(),
    altTextComplete: z.boolean(),
  }),
  seo: z.object({
    sitemap: z.array(z.string()), // List of all page slugs
    internalLinks: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
        anchorText: z.string(),
      })
    ),
  }),
});

export type V3Website = z.infer<typeof V3WebsiteSchema>;
export type V3Page = z.infer<typeof V3PageSchema>;
export type V3Section = z.infer<typeof V3SectionSchema>;

/**
 * AI Generation Result
 */
export interface V3GenerationResult {
  website: V3Website | null;
  errors: string[];
  warnings: string[];
  qualityScore: number; // 0-100
  validationResults: {
    seoCompliance: boolean;
    accessibilityCompliance: boolean;
    contentQuality: boolean;
  };
}

/**
 * Input for V3 generation
 */
export interface V3GenerationInput {
  companyId: string;
  context: CompanyContext;
  previousWebsite?: V3Website | null; // For iterations
  userInstructions?: string; // Optional custom instructions
  providerConfig?: AiProviderConfig;
}
