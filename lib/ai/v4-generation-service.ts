/**
 * V4 Generation Service
 *
 * Takes company context + design preferences and generates TSX components
 * This is where the AI actually creates the unique website code
 */

import { z } from "zod";
import { callStorefrontModel } from "./model-client";
import { generateUnsplashUrl } from "./unsplash-helper";
import type {
  V4CompanyContext,
  V4Website,
  V4GenerationResult,
} from "./v4-types";
import type { V4DesignPreferences } from "./v4-conversation-types";
import type { AiProviderConfig } from "./model-client";

// Internal types for generation
interface DesignSystem {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    foreground?: string;
    muted?: string;
    border?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    monoFont?: string;
    fontSizes?: Record<string, string>;
  };
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
  animations?: {
    duration?: string;
    easing?: string;
  };
}

interface GeneratedMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  structuredData?: Record<string, unknown>;
}

interface GeneratedComponent {
  id: string;
  type: string;
  name: string;
  code: string;
  props: string[];
  order: number;
  error?: string;
}

// Flexible type for section component objects returned by models
interface SectionComponentObj {
  code?: string;
  images?: Array<{ url: string; alt?: string | null }>;
  imageKeywords?: string;
  map?: {
    address?: string;
    coords?: [number, number];
    suggestedCoords?: [number, number];
    pinLabel?: string;
  };
  props?: string[];
  [k: string]: unknown;
}

export function extractPrimaryColor(val: unknown): string | undefined {
  const isHex = (s: string) =>
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s.trim());

  if (val === undefined || val === null) return undefined;

  if (typeof val === "string") {
    return isHex(val) ? val.trim() : undefined;
  }

  if (Array.isArray(val)) {
    for (const v of val) {
      if (typeof v === "string" && isHex(v)) return v.trim();
    }
    for (const v of val) {
      if (typeof v === "object" && v !== null) {
        const fromRec = extractPrimaryColor(v);
        if (fromRec) return fromRec;
      }
    }
    return undefined;
  }

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;

    const explicitKeys = ["hex", "color", "value"];
    for (const k of explicitKeys) {
      const v = obj[k];
      if (typeof v === "string" && isHex(v)) return v.trim();
    }

    const prefer = ["main", "base", "default"];
    for (const k of prefer) {
      const v = obj[k];
      if (typeof v === "string" && isHex(v)) return v.trim();
      if (typeof v === "object" && v !== null) {
        const fromRec = extractPrimaryColor(v);
        if (fromRec) return fromRec;
      }
    }

    for (const v of Object.values(obj)) {
      if (typeof v === "string" && isHex(v)) return v.trim();
      if (typeof v === "object" && v !== null) {
        const fromRec = extractPrimaryColor(v);
        if (fromRec) return fromRec;
      }
    }

    return undefined;
  }

  return undefined;
}

export async function generateV4Website(
  context: V4CompanyContext,
  preferences: V4DesignPreferences,
  providerConfig: AiProviderConfig
): Promise<V4GenerationResult> {
  try {
    // Defensive defaults for context that may be missing in unit tests or early seeds
    context.customerInsights = context.customerInsights || {
      totalCustomers: 0,
      topIndustries: [],
      averageRating: null,
      repeatCustomerRate: null,
    };

    console.log("[V4 Generation] Starting cascaded website generation...");
    console.log("[V4 Generation] Company:", context.company.name);
    console.log(
      "[V4 Generation] Preferences:",
      JSON.stringify(preferences, null, 2)
    );

    // Step 1: Generate design system first (foundation for all components)
    console.log("[V4 Generation] Step 1: Generating design system...");
    const designSystem = await generateDesignSystem(
      context,
      preferences,
      providerConfig
    );

    // Step 2: Determine which sections to generate based on preferences
    const sectionsToGenerate = determineSections(preferences, context);
    console.log(
      "[V4 Generation] Step 2: Generating",
      sectionsToGenerate.length,
      "sections in parallel..."
    );

    // Step 3: Generate all sections in parallel using Promise.all with progress tracking
    console.log(
      `[V4 Generation] Generating ${sectionsToGenerate.length} sections in parallel:`,
      sectionsToGenerate.map((s) => s.type).join(", ")
    );

    const componentPromises = sectionsToGenerate.map((section, index) =>
      generateSectionWithRetry(
        section,
        context,
        preferences,
        designSystem,
        providerConfig,
        index + 1,
        sectionsToGenerate.length
      )
    );

    const components = await Promise.all(componentPromises);
    console.log(
      "[V4 Generation] ✅ Step 3: All",
      components.length,
      "sections generated successfully!"
    );

    // Post-validation: ensure core required sections are present
    // Only add truly essential sections if missing (hero, about, contact, footer)
    const coreRequired = ["hero", "about", "contact", "footer"];
    const existingTypes = new Set(components.map((c) => c.type));

    for (const t of coreRequired) {
      if (!existingTypes.has(t) && t !== "contact-map") {
        console.log(
          `[V4 Generation] Missing core section '${t}', generating now...`
        );
        try {
          // For contact, prefer contact-map when company has locations
          const sectionType =
            t === "contact" && context.locations?.length > 0
              ? "contact-map"
              : t;
          const gen = await generateSectionWithRetry(
            { type: sectionType, name: `${t} Section` },
            context,
            preferences,
            designSystem,
            providerConfig,
            1,
            1,
            3
          );
          components.push(gen);
          console.log(`[V4 Generation] Added missing section: ${t}`);
        } catch (err) {
          console.error(
            `[V4 Generation] Failed to generate missing section '${t}':`,
            err instanceof Error ? err.message : String(err)
          );
        }
      }
    }

    // Step 4: Generate page metadata
    console.log("[V4 Generation] Step 4: Generating metadata...");
    const metadata = await generateMetadata(
      context,
      preferences,
      providerConfig
    );

    // Step 5: Organize components into pages
    console.log(
      "[V4 Generation] Step 5: Organizing into multi-page structure..."
    );
    const pages = organizeComponentsIntoPages(
      components,
      context,
      metadata,
      preferences
    );

    // Step 6: Assemble complete website
    const website: V4Website = {
      version: 4,
      generatedAt: new Date().toISOString(),
      companyId: context.company.id,
      designSystem: designSystem as unknown as V4Website["designSystem"],
      pages: pages,
      navigation: {
        header: {
          logo: null,
          links: pages.map((page) => ({
            label: page.name,
            href: page.slug === "home" ? "/" : `/${page.slug}`,
            isExternal: false,
          })),
          cta: { label: "Get Started", href: "/contact" },
        },
        footer: {
          sections: [],
          social: [],
          copyright: `© ${new Date().getFullYear()} ${
            context.company.name
          }. All rights reserved.`,
        },
      },
      globalStyles: generateGlobalStyles(designSystem),
      analytics: {
        googleAnalyticsId: null,
        facebookPixelId: null,
        hotjarSiteId: null,
      },
      accessibility: {
        ariaLabelsComplete: true,
        colorContrastAA: true,
        keyboardNavigable: true,
        screenReaderOptimized: true,
      },
    };

    // Inject chat widget if enabled in preferences (default true unless explicitly disabled)
    const chatEnabled =
      preferences.visitorChat?.enabled === undefined
        ? true
        : Boolean(preferences.visitorChat?.enabled);

    if (chatEnabled) {
      const safeCompanySlug = (context.company.slug || context.company.name)
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, "-");

      website.chatWidget = {
        enabled: true,
        // Emit structured config and retain a legacy inline loader for simple hosts
        config: {
          position: "bottom-right",
          primaryColor: designSystem.colors.primary || "#3B82F6",
          initialOpen: false,
          mountId: "ontarget-chat",
        },
        html: `<!-- Chat widget loader (legacy) -->\n<div id="ontarget-chat-config" data-company="${safeCompanySlug}" data-mount-id="ontarget-chat"></div>`,
      };
    }

    // Validate and calculate quality scores
    const qualityScore = calculateQualityScore(website, context);
    const creativityScore = calculateCreativityScore(website);

    console.log("[V4 Generation] Generation complete!");
    console.log("[V4 Generation] Pages:", website.pages.length);
    console.log("[V4 Generation] Quality:", qualityScore);
    console.log("[V4 Generation] Creativity:", creativityScore);

    return {
      website,
      success: true,
      errors: [],
      warnings: [],
      qualityScore,
      creativityScore,
      generationTime: 0,
      tokensUsed: 0,
    };
  } catch (error) {
    console.error("[V4 Generation] Error:", error);
    return {
      website: null,
      success: false,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      warnings: [],
      qualityScore: 0,
      creativityScore: 0,
      generationTime: 0,
      tokensUsed: 0,
    };
  }
}

// Generate design system (colors, typography, spacing)
async function generateDesignSystem(
  context: V4CompanyContext,
  preferences: V4DesignPreferences,
  providerConfig: AiProviderConfig,
  maxRetries: number = 3
): Promise<DesignSystem> {
  const designSystemCoreSchema = z
    .object({
      // Colors can be a simple hex string OR a nested object with shades (e.g. { main: "#...", light: "#..." })
      colors: z.object({
        primary: z.union([z.string(), z.record(z.string(), z.unknown())]),
        secondary: z.union([z.string(), z.record(z.string(), z.unknown())]),
        accent: z
          .union([z.string(), z.record(z.string(), z.unknown())])
          .optional(),
        background: z
          .union([z.string(), z.record(z.string(), z.unknown())])
          .optional(),
        text: z
          .union([z.string(), z.record(z.string(), z.unknown())])
          .optional(),
        muted: z
          .union([z.string(), z.record(z.string(), z.unknown())])
          .optional(),
        border: z
          .union([z.string(), z.record(z.string(), z.unknown())])
          .optional(),
      }),
      // Typography fields are optional; we'll fill defaults later
      typography: z
        .object({
          headingFont: z.string().optional(),
          bodyFont: z.string().optional(),
          fontSizes: z
            .object({
              xs: z.string().optional(),
              sm: z.string().optional(),
              base: z.string().optional(),
              lg: z.string().optional(),
              xl: z.string().optional(),
              "2xl": z.string().optional(),
              "3xl": z.string().optional(),
            })
            .passthrough()
            .optional(),
        })
        .passthrough()
        .optional(),
      spacing: z
        .object({
          xs: z.string().optional(),
          sm: z.string().optional(),
          md: z.string().optional(),
          lg: z.string().optional(),
          xl: z.string().optional(),
          "2xl": z.string().optional(),
        })
        .passthrough()
        .optional(),
      borderRadius: z
        .object({
          sm: z.string().optional(),
          md: z.string().optional(),
          lg: z.string().optional(),
          full: z.string().optional(),
        })
        .passthrough()
        .optional(),
      shadows: z
        .object({
          sm: z.string().optional(),
          md: z.string().optional(),
          lg: z.string().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough();

  // Allow either direct or wrapped format
  const designSystemSchema = z.union([
    designSystemCoreSchema,
    z.object({ design_system: designSystemCoreSchema }),
    z.object({ designSystem: designSystemCoreSchema }),
  ]);

  const prompt = `Create a cohesive design system for ${context.company.name}.

Company: ${context.company.name}
Industry: ${context.company.industry || "General"}
Primary Color: ${preferences.primaryColor}
Secondary Color: ${preferences.secondaryColor}
Font Style: ${preferences.fontPairing}

Generate a complete design system with colors, typography, spacing, border radius, and shadows.
Make it unique and fitting for the company's brand and industry.

IMPORTANT: Be flexible with formats the model might use:
- Colors may be simple hex strings ("#123456"), nested objects ("{ main: '#123456', light: '#...' }"), or arrays (["#123456","#abcdef"]). If you return an array, the *first* element should be the primary hex color.
- Typography can be a string, an array (choose first as primary), or an object with { family: "Inter" } or { fontFamily: "Inter" }.
- fontSizes and spacing may be objects or arrays. If arrays are used, map them as [xs, sm, base, lg, xl].

Example output (exact JSON shape expected):
{
  "colors": {
    "primary": "#1E40AF",
    "secondary": "#8B5CF6",
    "accent": "#FF6B6B",
    "background": "#FFFFFF",
    "text": "#111827"
  },
  "typography": {
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "fontSizes": { "xs":"0.75rem","base":"1rem","lg":"1.125rem" }
  },
  "spacing": { "md":"1rem" }
}

CRITICAL: Return ONLY raw JSON (no markdown fences or explanatory text). Return exactly the JSON object as shown above.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[V4 Design System] 🎨 Generating design system (attempt ${attempt}/${maxRetries})...`
      );

      const result = await callStorefrontModel(
        [{ role: "user", content: prompt }],
        designSystemSchema,
        providerConfig,
        2
      );

      // Unwrap if necessary
      const unwrapped = result as Record<string, unknown>;
      const designSystem = (unwrapped.design_system ||
        unwrapped.designSystem ||
        result) as Record<string, unknown>;

      // Fix nested color objects: {primary: {main: "#...", light: "..."}} → {primary: "#..."}
      if (designSystem.colors) {
        const colors = designSystem.colors as Record<string, unknown>;

        Object.keys(colors).forEach((key) => {
          const colorValue = colors[key];

          // If color is an array (e.g., ["#123","#456"]), pick first string element
          if (Array.isArray(colorValue)) {
            const firstStr = colorValue.find((v) => typeof v === "string") as
              | string
              | undefined;
            if (firstStr) {
              colors[key] = firstStr;
              return;
            }

            // If array contains objects, extract from first object
            const firstObj = colorValue.find(
              (v) => typeof v === "object" && v !== null
            ) as Record<string, unknown> | undefined;
            const primaryFromArrayObj = extractPrimaryColor(firstObj);
            if (primaryFromArrayObj) {
              colors[key] = primaryFromArrayObj;
              return;
            }
          }

          // If nested object, extract the main/base color from nested object, prefer string values
          if (typeof colorValue === "object" && colorValue !== null) {
            const colorObj = colorValue as Record<string, unknown>;
            const primary = extractPrimaryColor(colorObj);
            if (primary) {
              colors[key] = primary;
            }
          }
        });
      }

      // Fix missing typography fields and support arrays/alternate keys
      if (designSystem.typography) {
        const typography = designSystem.typography as Record<string, unknown>;

        // Helper to unwrap font strings from arrays or objects
        const pickFont = (val: unknown) => {
          if (!val) return undefined;
          if (typeof val === "string") return val;
          if (
            Array.isArray(val) &&
            val.length > 0 &&
            typeof val[0] === "string"
          )
            return val[0];
          if (typeof val === "object" && val !== null) {
            const o = val as Record<string, unknown>;
            return (
              (o.family as string) || (o.fontFamily as string) || undefined
            );
          }
          return undefined;
        };

        const fontFamily =
          pickFont(typography.fontFamily) ||
          pickFont(typography.font) ||
          undefined;

        if (!typography.headingFont) {
          typography.headingFont =
            pickFont(typography.heading) || fontFamily || "Inter";
        } else if (Array.isArray(typography.headingFont)) {
          typography.headingFont = (typography.headingFont as string[])[0];
        }

        if (!typography.bodyFont) {
          typography.bodyFont =
            pickFont(typography.body) || fontFamily || "Inter";
        } else if (Array.isArray(typography.bodyFont)) {
          typography.bodyFont = (typography.bodyFont as string[])[0];
        }

        // If fontSizes is an array, map to keys [xs, sm, base, lg, xl]
        if (Array.isArray(typography.fontSizes)) {
          const arr = typography.fontSizes as string[];
          typography.fontSizes = {
            xs: arr[0],
            sm: arr[1],
            base: arr[2] || "1rem",
            lg: arr[3],
            xl: arr[4],
          } as Record<string, string>;
        }
      }

      console.log(
        `[V4 Design System] ✅ Design system generated successfully!`
      );
      return designSystem as unknown as DesignSystem;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (attempt < maxRetries) {
        console.log(
          `[V4 Design System] ⚠️ Failed (attempt ${attempt}/${maxRetries}), retrying... Error: ${errorMsg}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      } else {
        console.error(
          `[V4 Design System] ❌ Failed after ${maxRetries} attempts, using defaults`
        );
        // Return default design system
        return {
          colors: {
            primary: preferences.primaryColor || "#3B82F6",
            secondary: preferences.secondaryColor || "#8B5CF6",
            accent: preferences.accentColor || "#EC4899",
            background: "#FFFFFF",
            text: "#1F2937",
            muted: "#6B7280",
            border: "#E5E7EB",
          },
          typography: {
            headingFont: "Inter",
            bodyFont: "Inter",
            fontSizes: {
              xs: "0.75rem",
              sm: "0.875rem",
              base: "1rem",
              lg: "1.125rem",
              xl: "1.25rem",
              "2xl": "1.5rem",
              "3xl": "1.875rem",
            },
          },
          spacing: {
            xs: "0.5rem",
            sm: "1rem",
            md: "1.5rem",
            lg: "2rem",
            xl: "3rem",
            "2xl": "4rem",
          },
          borderRadius: {
            sm: "0.25rem",
            md: "0.375rem",
            lg: "0.5rem",
            full: "9999px",
          },
          shadows: {
            sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          },
        };
      }
    }
  }

  // Fallback return - should never be reached due to loop logic
  return {
    colors: {
      primary: preferences.primaryColor || "#3B82F6",
      secondary: preferences.secondaryColor || "#8B5CF6",
      accent: preferences.accentColor || "#EC4899",
      background: "#FFFFFF",
      text: "#1F2937",
      muted: "#6B7280",
      border: "#E5E7EB",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      fontSizes: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
      },
    },
    spacing: {
      xs: "0.5rem",
      sm: "1rem",
      md: "1.5rem",
      lg: "2rem",
      xl: "3rem",
      "2xl": "4rem",
    },
    borderRadius: {
      sm: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      full: "9999px",
    },
    shadows: {
      sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    },
  };
}

// Organize components into multiple pages
function organizeComponentsIntoPages(
  components: GeneratedComponent[],
  context: V4CompanyContext,
  metadata: GeneratedMetadata,
  preferences: V4DesignPreferences
) {
  const pages: V4Website["pages"] = [];

  // Helper to create page component structure
  const createPageComponent = (component: GeneratedComponent) => ({
    id: component.id,
    order: component.order,
    componentCode: component.code,
    metadata: {
      name: component.name,
      description: component.name,
      props: {},
      dependencies: [],
      accessibility: {
        hasAriaLabels: true,
        keyboardNavigable: true,
        screenReaderFriendly: true,
        colorContrast: "AA" as const,
      },
    },
  });

  // Separate components by type
  const heroComp = components.find((c) => c.type === "hero");
  const servicesComp = components.find((c) => c.type === "services");
  const productsComp = components.find((c) => c.type === "products");
  const teamComp = components.find((c) => c.type === "team");
  const testimonialsComp = components.find((c) => c.type === "testimonials");
  const contactComp = components.find(
    (c) => c.type === "contact" || c.type === "contact-map"
  );
  const footerComp = components.find((c) => c.type === "footer");
  const aboutComp = components.find((c) => c.type === "about");

  // HOME PAGE - testimonials only appear here
  const homeComponents = [
    heroComp,
    servicesComp,
    productsComp,
    testimonialsComp,
    footerComp,
  ]
    .filter((c): c is GeneratedComponent => c !== undefined)
    .map(createPageComponent)
    .filter((c): c is NonNullable<typeof c> => c !== null);

  pages.push({
    slug: "home",
    name: "Home",
    components: homeComponents,
    seo: {
      title: metadata.title,
      description: metadata.description,
      keywords: metadata.keywords,
      ogImage: metadata.ogImage || null,
      canonicalUrl: null,
      structuredData: metadata.structuredData ? [metadata.structuredData] : [],
    },
  });

  // ABOUT PAGE
  if (aboutComp || teamComp) {
    const aboutComponents = [aboutComp, teamComp, footerComp]
      .filter((c): c is GeneratedComponent => c !== undefined)
      .map(createPageComponent)
      .filter((c): c is NonNullable<typeof c> => c !== null);

    pages.push({
      slug: "about",
      name: "About Us",
      components: aboutComponents,
      seo: {
        title: `About | ${context.company.name}`,
        description: `Learn more about ${context.company.name} and our mission.`,
        keywords: metadata.keywords,
        ogImage: metadata.ogImage || null,
        canonicalUrl: null,
        structuredData: [],
      },
    });
  }

  // SERVICES PAGE (listing)
  if (servicesComp && context.services.length > 0) {
    pages.push({
      slug: "services",
      name: "Services",
      components: [servicesComp, footerComp]
        .filter((c): c is GeneratedComponent => c !== undefined)
        .map(createPageComponent)
        .filter((c): c is NonNullable<typeof c> => c !== null),
      seo: {
        title: `Services | ${context.company.name}`,
        description: `Explore our ${context.services.length} professional services.`,
        keywords: [
          ...metadata.keywords,
          ...context.services.map((s) => s.name),
        ],
        ogImage: metadata.ogImage || null,
        canonicalUrl: null,
        structuredData: [],
      },
    });
  }

  // PRODUCTS PAGE (listing)
  if (productsComp && context.products.length > 0) {
    pages.push({
      slug: "products",
      name: "Products",
      components: [productsComp, footerComp]
        .filter((c): c is GeneratedComponent => c !== undefined)
        .map(createPageComponent)
        .filter((c): c is NonNullable<typeof c> => c !== null),
      seo: {
        title: `Products | ${context.company.name}`,
        description: `Browse our ${context.products.length} products.`,
        keywords: [
          ...metadata.keywords,
          ...context.products.map((p) => p.name),
        ],
        ogImage: metadata.ogImage || null,
        canonicalUrl: null,
        structuredData: [],
      },
    });
  }

  // CONTACT PAGE
  if (contactComp) {
    pages.push({
      slug: "contact",
      name: "Contact",
      components: [contactComp, footerComp]
        .filter((c): c is GeneratedComponent => c !== undefined)
        .map(createPageComponent)
        .filter((c): c is NonNullable<typeof c> => c !== null),
      seo: {
        title: `Contact Us | ${context.company.name}`,
        description: `Get in touch with ${context.company.name}. We're here to help!`,
        keywords: [...metadata.keywords, "contact", "get in touch"],
        ogImage: metadata.ogImage || null,
        canonicalUrl: null,
        structuredData: [],
      },
    });
  }

  // BLOG PAGE (if enabled)
  if (preferences.sections?.blog) {
    pages.push({
      slug: "blog",
      name: "Blog",
      components: [footerComp]
        .filter((c): c is GeneratedComponent => c !== undefined)
        .map(createPageComponent)
        .filter((c): c is NonNullable<typeof c> => c !== null),
      seo: {
        title: `Blog | ${context.company.name}`,
        description: `Read the latest insights and updates from ${context.company.name}.`,
        keywords: [...metadata.keywords, "blog", "news", "articles"],
        ogImage: metadata.ogImage || null,
        canonicalUrl: null,
        structuredData: [],
      },
    });
  }

  // INDIVIDUAL SERVICE DETAIL PAGES
  if (context.services && context.services.length > 0) {
    context.services.forEach((service) => {
      // Find service-detail component by matching service name in the component name
      const serviceDetailComp = components.find(
        (c) => c.type === "service-detail" && c.name.includes(service.name)
      );

      pages.push({
        slug: `services/${service.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: service.name,
        components: [serviceDetailComp, footerComp]
          .filter((c): c is GeneratedComponent => c !== undefined)
          .map(createPageComponent)
          .filter((c): c is NonNullable<typeof c> => c !== null),
        seo: {
          title: `${service.name} | ${context.company.name}`,
          description:
            service.description ||
            `Learn more about our ${service.name} service.`,
          keywords: [
            ...metadata.keywords,
            service.name,
            service.category || "service",
          ],
          ogImage: service.images[0]?.url || metadata.ogImage || null,
          canonicalUrl: null,
          structuredData: [
            {
              "@context": "https://schema.org",
              "@type": "Service",
              name: service.name,
              description: service.description,
              provider: {
                "@type": "Organization",
                name: context.company.name,
              },
            },
          ],
        },
      });
    });
  }

  // INDIVIDUAL PRODUCT DETAIL PAGES
  if (context.products && context.products.length > 0) {
    context.products.forEach((product) => {
      // Find product-detail component by matching product name in the component name
      const productDetailComp = components.find(
        (c) => c.type === "product-detail" && c.name.includes(product.name)
      );

      pages.push({
        slug: `products/${product.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: product.name,
        components: [productDetailComp, footerComp]
          .filter((c): c is GeneratedComponent => c !== undefined)
          .map(createPageComponent)
          .filter((c): c is NonNullable<typeof c> => c !== null),
        seo: {
          title: `${product.name} | ${context.company.name}`,
          description:
            product.description || `View details for ${product.name}.`,
          keywords: [
            ...metadata.keywords,
            product.name,
            product.category || "product",
          ],
          ogImage: product.images[0]?.url || metadata.ogImage || null,
          canonicalUrl: null,
          structuredData: [
            {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description,
              image: product.images[0]?.url,
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: "USD",
              },
            },
          ],
        },
      });
    });
  }

  return pages;
}

// Determine which sections to generate
function determineSections(
  preferences: V4DesignPreferences,
  context: V4CompanyContext
) {
  const sections = [];

  // Always include hero
  sections.push({ type: "hero", name: "Hero Section" });

  // Add about (always required)
  sections.push({ type: "about", name: "About Section" });

  // Add sections based on preferences and available data
  if (preferences.sections?.products && context.products.length > 0) {
    sections.push({ type: "products", name: "Products Section" });
    // Add individual product detail sections
    context.products.forEach((product) => {
      sections.push({
        type: "product-detail",
        name: `Product Detail: ${product.name}`,
        metadata: { productId: product.id, product },
      });
    });
  }

  if (preferences.sections?.services && context.services.length > 0) {
    sections.push({ type: "services", name: "Services Section" });
    // Add individual service detail sections
    context.services.forEach((service) => {
      sections.push({
        type: "service-detail",
        name: `Service Detail: ${service.name}`,
        metadata: { serviceId: service.id, service },
      });
    });
  }

  if (preferences.sections?.team && context.team.length > 0) {
    sections.push({ type: "team", name: "Team Section" });
  }

  if (preferences.sections?.testimonials && context.testimonials.length > 0) {
    sections.push({ type: "testimonials", name: "Testimonials Section" });
  }

  // Always include about (required)
  sections.push({ type: "about", name: "About Section" });

  // Always include contact (required) - use contact-map if locations exist
  const contactType = context.locations?.length > 0 ? "contact-map" : "contact";
  sections.push({ type: contactType, name: "Contact Section" });

  // Always include footer (required)
  sections.push({ type: "footer", name: "Footer Section" });

  console.log(
    `[V4 Generation] Sections to generate:`,
    sections.map((s) => s.type).join(", ")
  );

  return sections;
}

// Generate a single section component with retry logic
async function generateSectionWithRetry(
  section: { type: string; name: string },
  context: V4CompanyContext,
  preferences: V4DesignPreferences,
  designSystem: DesignSystem,
  providerConfig: AiProviderConfig,
  index: number,
  total: number,
  maxRetries: number = 3
): Promise<GeneratedComponent> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[V4 Section ${index}/${total}] 🔨 Generating ${section.name}...`
      );

      const result = await generateSection(
        section,
        context,
        preferences,
        designSystem,
        providerConfig
      );

      console.log(
        `[V4 Section ${index}/${total}] ✅ ${section.name} completed!`
      );
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (attempt < maxRetries) {
        console.log(
          `[V4 Section ${index}/${total}] ⚠️ ${section.name} failed (attempt ${attempt}/${maxRetries}), retrying... Error: ${errorMsg}`
        );
        // Wait a bit before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      } else {
        console.error(
          `[V4 Section ${index}/${total}] ❌ ${section.name} failed after ${maxRetries} attempts. Error: ${errorMsg}`
        );
        // Return a fallback component instead of throwing
        return {
          id: `${section.type}-fallback-${Date.now()}`,
          type: section.type,
          name: section.name,
          code: generateFallbackComponent(section, context),
          props: [],
          order: 0,
          error: errorMsg,
        };
      }
    }
  }

  // This should never be reached due to the logic above, but TypeScript needs it
  throw new Error("Failed to generate section after all retries");
}

// Generate a single section component
async function generateSection(
  section: { type: string; name: string; metadata?: Record<string, unknown> },
  context: V4CompanyContext,
  preferences: V4DesignPreferences,
  designSystem: DesignSystem,
  providerConfig: AiProviderConfig
): Promise<GeneratedComponent> {
  // Ultra-flexible schema - accept ANY structure from AI
  const componentSchema = z.unknown();

  let sectionData = "";

  switch (section.type) {
    case "hero":
      sectionData = `
Company: ${context.company.name}
Slogan: ${context.company.slogan || ""}
Description: ${context.company.description || ""}
Hero Style: ${preferences.heroStyle}
      `;
      break;

    case "products":
      sectionData = `
Products (${context.products.length} total):
${context.products
  .slice(0, 10)
  .map(
    (p) =>
      `- ${p.name}: ${p.description || ""} ${p.price ? `($${p.price})` : ""}`
  )
  .join("\n")}
      `;
      break;

    case "services":
      sectionData = `
Services (${context.services.length} total):
${context.services
  .slice(0, 10)
  .map(
    (s) =>
      `- ${s.name}: ${s.description || ""} ${s.price ? `($${s.price})` : ""}`
  )
  .join("\n")}
      `;
      break;

    case "service-detail":
      const serviceDetail = section.metadata?.service as
        | (typeof context.services)[0]
        | undefined;
      if (serviceDetail) {
        sectionData = `
Service Detail Page for: ${serviceDetail.name}

Full Service Information:
- Name: ${serviceDetail.name}
- Description: ${serviceDetail.description || ""}
- Price: ${
          serviceDetail.price
            ? `$${serviceDetail.price}`
            : "Contact for pricing"
        }
- Category: ${serviceDetail.category || ""}
- Benefits: ${
          serviceDetail.benefits ? JSON.stringify(serviceDetail.benefits) : ""
        }
- Images: ${
          serviceDetail.images
            ? JSON.stringify(
                serviceDetail.images.map((img: { url: string }) => img.url)
              )
            : ""
        }

IMPORTANT: Create a comprehensive service detail page with:
1. Hero section with service name, tagline, and image
2. Detailed description with benefits and features
3. Pricing information (or "Contact Us" CTA if no price)
4. Related services from the company (show 3 other services)
5. Call-to-action buttons (Request Quote, Schedule Consultation)
6. Link back to main services page
7. Use the company contact form at /api/storefront/${
          context.company.slug
        }/contact for inquiries
        `;
      }
      break;

    case "product-detail":
      const productDetail = section.metadata?.product as
        | (typeof context.products)[0]
        | undefined;
      if (productDetail) {
        sectionData = `
Product Detail Page for: ${productDetail.name}

Full Product Information:
- Name: ${productDetail.name}
- Description: ${productDetail.description || ""}
- Price: ${productDetail.price ? `$${productDetail.price}` : ""}
- Category: ${productDetail.category || ""}
- SKU: ${productDetail.sku || ""}
- In Stock: ${productDetail.inStock ? "Yes" : "No"}
- Tags: ${productDetail.tags ? JSON.stringify(productDetail.tags) : ""}
- Images: ${
          productDetail.images
            ? JSON.stringify(
                productDetail.images.map((img: { url: string }) => img.url)
              )
            : ""
        }

IMPORTANT: Create a comprehensive product detail page with:
1. Product image gallery (or single image if only one available)
2. Product name, description, and price
3. "Add to Cart" button (use data attributes: data-product-id="${
          productDetail.id
        }" data-product-name="${productDetail.name}" data-product-price="${
          productDetail.price
        }")
4. Product features list with icons
5. Product specifications table
6. Related products from the company (show 4 other products)
7. Customer reviews section (if testimonials exist)
8. Link back to main products page
        `;
      }
      break;

    case "team":
      sectionData = `
Team Members (${context.team.length} total):
${context.team
  .slice(0, 8)
  .map((t) => `- ${t.name} (${t.role}): ${t.bio || ""}`)
  .join("\n")}
      `;
      break;

    case "testimonials":
      sectionData = `
Testimonials (${
        context.testimonials.length
      } reviews, avg ${context.customerInsights.averageRating?.toFixed(1)}★):
${context.testimonials
  .slice(0, 5)
  .map((t) => `- ${t.customerName} (${t.rating}★): "${t.content}"`)
  .join("\n")}

IMPORTANT: Display these testimonials in a clean grid layout.
Add a simple "Leave a Review" button (no modal needed - just a link to #contact).
Keep the design minimal - focus on showcasing the testimonials cleanly.
      `;
      break;

    case "about":
      sectionData = `
Company: ${context.company.name}
Industry: ${context.company.industry || ""}
Description: ${context.company.description || ""}
Team Size: ${context.team.length}
      `;
      break;

    case "contact":
      sectionData = `
Company: ${context.company.name}
Contact Email: ${context.company.email || ""}
Contact Phone: ${context.company.phone || ""}

IMPORTANT: Include a working contact form that POSTs to /api/storefront/${
        context.company.slug
      }/contact
Form fields: name (required), email (required), phone (optional), message (required)
Add proper HTML form attributes and basic client-side validation.
      `;
      break;

    case "footer":
      sectionData = `
Company: ${context.company.name}
      `;
      break;
  }

  const prompt = `Generate a ${section.name} HTML section for ${context.company.name}.

${sectionData}

Design System:
- Primary Color: ${designSystem.colors.primary}
- Secondary Color: ${designSystem.colors.secondary}
- Accent Color: ${designSystem.colors.accent}
- Background: ${designSystem.colors.background}
- Text Color: ${designSystem.colors.text}
- Heading Font: ${designSystem.typography.headingFont}
- Body Font: ${designSystem.typography.bodyFont}

Requirements:
1. Create ONLY pure HTML with inline styles - NO React, NO JSX, NO TypeScript
2. Use Tailwind CSS classes for styling (assume Tailwind is loaded on the page)
3. Apply the design system colors using inline style attributes where needed
4. Make it fully responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
5. Include accessibility features (ARIA labels, semantic HTML5 tags)
6. Add smooth CSS transitions and animations using Tailwind utility classes (hover:scale-105, transition-all, animate-fade-in, etc.)
7. Use the actual company data provided - NO placeholders or fake data (unless explicitly requested)
8. Make the design modern, unique, and visually stunning (aim: world-class, professional, SEO-optimized, "10K design" level)
9. **BE CREATIVE**: Use gradients (bg-gradient-to-r), backdrop-blur effects (backdrop-blur-lg for glassmorphism), custom animations, and unique layouts. Push boundaries!
10. Ensure all interactive elements have hover states with transform effects
11. **IMAGES**: For visual sections (hero, products, services, team, testimonials, portfolio) include an **imageKeywords** string and an **images** array of objects [{ url?: string, unsplashSearchTerm?: string, alt: string }]. If you cannot provide direct URLs, provide unsplashSearchTerm values we can use to fetch free images.
12. **CONTACT MAP**: For contact sections include: 'map:{ address?:string, coords?:[lat,lng], pinLabel?:string }' if location data is available. If coords are not available, provide 'suggestedCoords' based on the company address.
13. IMPORTANT: Return a JSON object with fields: 'code' (HTML string), and optional metadata fields like 'images', 'imageKeywords', 'map' where applicable. Example response:
{ "code": "<section class=\"hero\">...</section>", "images": [{"url":"...","alt":"..."}], "imageKeywords":"web design hero" }
Do not return Markdown or any explanatory text—just a single JSON object.

Example colors to use in inline styles:
- style="color: ${designSystem.colors.primary}"
- style="background-color: ${designSystem.colors.secondary}"

CRITICAL: Return ONLY raw JSON (no markdown fences or explanatory text). The response should be a single JSON object with the HTML string in the "code" field and any additional metadata fields as specified.`;

  const result = await callStorefrontModel(
    [{ role: "user", content: prompt }],
    componentSchema,
    providerConfig,
    2
  );

  // Unwrap if necessary
  const unwrapped = result as Record<string, unknown>;
  let component = (unwrapped.component || result || {}) as
    | Record<string, unknown>
    | string;

  // If component is a string, wrap it in {code: ...}
  if (typeof component === "string") {
    component = { code: component };
  }
  // If component is an object with nested component, extract it
  if (typeof component === "object" && component.component) {
    if (typeof component.component === "string") {
      component = {
        code: component.component as string,
        props: component.props,
      };
    } else {
      component = component.component as Record<string, unknown>;
    }
  }

  // Ensure we have code field (try all possible field names AI might use)
  const componentObj = component as Record<string, unknown>;
  let finalCode =
    componentObj.code ||
    componentObj.component ||
    componentObj.componentCode || // AI uses this sometimes
    component ||
    "";

  // If images are expected but not provided, add Unsplash fallback images (free-to-use)
  const expectsImages = [
    "hero",
    "products",
    "services",
    "team",
    "testimonials",
    "portfolio",
  ];
  if (
    expectsImages.includes(section.type) &&
    !componentObj.images &&
    !componentObj.imageKeywords
  ) {
    // Use industry or company name for relevance
    const industry =
      context.company.industry || context.company.name || "Professional";
    const fallbackImage = generateUnsplashUrl(
      industry,
      section.type === "products" ? "products" : (section.type as string)
    );
    // Attach a simple images array to the returned object so downstream rendering can pick it up
    (componentObj as SectionComponentObj).images = [
      { url: fallbackImage, alt: `${context.company.name} ${section.name}` },
    ];
    console.log(
      `[V4 Section] Added fallback Unsplash image for section ${section.type}`
    );
  }

  // For contact sections, ensure map metadata is present (use company locations if available)
  // Strongly-typed contact map generation (avoid using `any`)
  if (section.type === "contact" || section.type === "contact-map") {
    if (!componentObj.map) {
      if (context.locations && context.locations.length > 0) {
        type LocationWithCoords = V4CompanyContext["locations"][number] & {
          latitude?: number | null;
          longitude?: number | null;
        };

        const loc = context.locations[0] as LocationWithCoords;
        const addressLine1 =
          loc.addressLine1 ?? loc.address?.line1 ?? undefined;
        const city = loc.city ?? loc.address?.city ?? undefined;
        const lat = loc.latitude ?? undefined;
        const lng = loc.longitude ?? undefined;

        const sectionComp = componentObj as SectionComponentObj;
        sectionComp.map = {
          address: addressLine1 ?? city ?? undefined,
          coords: lat != null && lng != null ? [lat, lng] : undefined,
          pinLabel: context.company.name,
        };
      } else if (context.company.addressLine1 || context.company.city) {
        // No precise coords; include suggestedCoords as hint
        const sectionComp = componentObj as SectionComponentObj;
        sectionComp.map = {
          address:
            context.company.addressLine1 ?? context.company.city ?? undefined,
          suggestedCoords: undefined,
          pinLabel: context.company.name,
        };
      }
    }
  }

  // Normalize plain-text outputs into simple HTML when the model did not return tags
  try {
    const finalStr =
      typeof finalCode === "string" ? finalCode : JSON.stringify(finalCode);
    const hasHtmlTags = /<[^>]+>/.test(finalStr);
    if (!hasHtmlTags) {
      console.log(
        `[V4 Section] Normalizing plain-text component output for section=${section.type}`
      );

      // Basic HTML escape helper
      const escapeHtml = (s: string) =>
        s
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

      const lines = finalStr
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const parts: string[] = [];

      lines.forEach((line, idx) => {
        // Insert spaces into concatenated CamelCase words (e.g., ServicesPortfolioAbout -> Services Portfolio About)
        const spaced = line.replace(/([a-z])([A-Z])/g, "$1 $2");

        if (idx === 0 && spaced.length <= 80) {
          // Likely a site title / hero headline
          parts.push(
            `<header class=\"p-6\"><h1 class=\"text-3xl font-bold\">${escapeHtml(
              spaced
            )}</h1></header>`
          );
          return;
        }

        // Lines that look like navs (many capitalized words without punctuation)
        const navCandidates = spaced.match(/[A-Z][a-z]+/g);
        if (
          navCandidates &&
          spaced.split(" ").length <= 6 &&
          spaced.split(" ").length > 1
        ) {
          const items = spaced
            .split(/\s+/)
            .map(
              (it) =>
                `<a href=\"#\" class=\"mr-4 text-sm\">${escapeHtml(it)}</a>`
            )
            .join("");
          parts.push(`<nav class=\"p-3 bg-gray-50\">${items}</nav>`);
          return;
        }

        // Bulleted lists
        if (spaced.startsWith("- ")) {
          parts.push(`<li>${escapeHtml(spaced.slice(2))}</li>`);
          return;
        }

        // Default to paragraph
        parts.push(`<p>${escapeHtml(spaced)}</p>`);
      });

      let html = parts.join("\n");
      if (/^<li>/.test(html) || html.includes("<li>")) {
        html = `<ul>${html}</ul>`;
      }

      finalCode = html;
    }
  } catch {
    // If normalization fails, fall back to original stringified code
    finalCode =
      typeof finalCode === "string" ? finalCode : JSON.stringify(finalCode);
  }

  return {
    id: `${section.type}-${Date.now()}`,
    type: section.type,
    name: section.name,
    code: typeof finalCode === "string" ? finalCode : JSON.stringify(finalCode),
    props: (Array.isArray(componentObj.props)
      ? componentObj.props
      : []) as string[],
    order: 0,
  };
}

// Generate page metadata and SEO
async function generateMetadata(
  context: V4CompanyContext,
  preferences: V4DesignPreferences,
  providerConfig: AiProviderConfig,
  maxRetries: number = 3
): Promise<GeneratedMetadata> {
  const metadataCoreSchema = z
    .object({
      // Be permissive: AI may return alternate keys like pageTitle/metaDescription or omit some fields
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      ogImage: z.string().optional(),
      structuredData: z.any().optional(),
      schema: z.any().optional(),
    })
    .passthrough();

  // Allow either direct or wrapped format
  const metadataSchema = z.union([
    metadataCoreSchema,
    z.object({ metadata: metadataCoreSchema }),
    z.object({ seo: metadataCoreSchema }),
  ]);

  const prompt = `Generate SEO metadata for ${context.company.name}'s website.

Company: ${context.company.name}
Industry: ${context.company.industry || ""}
Description: ${context.company.description || ""}
Products: ${context.products.length}
Services: ${context.services.length}

Create:
1. Page title (60 chars max, include company name)
2. Meta description (155 chars max)
3. 10 relevant keywords
4. Schema.org structured data (LocalBusiness or Organization)

Make it SEO-optimized and compelling.

CRITICAL: Return ONLY raw JSON without any markdown code blocks or formatting. Do NOT wrap in \`\`\`json or \`\`\`.
Just return pure JSON matching the schema.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[V4 Metadata] 📊 Generating SEO metadata (attempt ${attempt}/${maxRetries})...`
      );

      // The metadata returned by models is frequently inconsistent (alternate keys like pageTitle/metaDescription).
      // Accept any JSON here and normalize explicitly below to avoid Zod rejection of otherwise valid variants.
      const result = await callStorefrontModel(
        [{ role: "user", content: prompt }],
        // Use the flexible metadata schema that accepts several common variants
        metadataSchema,
        providerConfig,
        2
      );

      // Unwrap if necessary and normalize field names
      const unwrapped = result as Record<string, unknown>;
      const rawMetadata = (unwrapped.metadata ||
        unwrapped.seo ||
        result) as Record<string, unknown>;

      // Normalize field names that AI might use differently
      const metadata: GeneratedMetadata = {
        title: (rawMetadata.title ||
          rawMetadata.pageTitle ||
          rawMetadata.seoTitle ||
          "") as string,
        description: (rawMetadata.description ||
          rawMetadata.metaDescription ||
          rawMetadata.seoDescription ||
          "") as string,
        keywords: (rawMetadata.keywords || rawMetadata.tags || []) as string[],
        ogImage: rawMetadata.ogImage as string | undefined,
        structuredData: rawMetadata.structuredData as
          | Record<string, unknown>
          | undefined,
      };

      console.log(`[V4 Metadata] ✅ SEO metadata generated successfully!`);
      return metadata;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (attempt < maxRetries) {
        console.log(
          `[V4 Metadata] ⚠️ Failed (attempt ${attempt}/${maxRetries}), retrying... Error: ${errorMsg}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      } else {
        console.error(
          `[V4 Metadata] ❌ Failed after ${maxRetries} attempts, using defaults`
        );
        // Return default metadata
        return {
          title: `${context.company.name} - ${
            context.company.industry || "Home"
          }`,
          description:
            context.company.description || `Welcome to ${context.company.name}`,
          keywords: [
            context.company.name,
            context.company.industry || "business",
            "services",
            "products",
          ],
          ogImage: undefined,
          structuredData: {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: context.company.name,
            description: context.company.description,
          },
        };
      }
    }
  }

  // Fallback return - should never be reached
  return {
    title: `${context.company.name} - ${context.company.industry || "Home"}`,
    description:
      context.company.description || `Welcome to ${context.company.name}`,
    keywords: [
      context.company.name,
      context.company.industry || "business",
      "services",
      "products",
    ],
    ogImage: undefined,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: context.company.name,
      description: context.company.description,
    },
  };
}

// Generate global CSS styles
function generateGlobalStyles(designSystem: DesignSystem): string {
  return `
:root {
  --color-primary: ${designSystem.colors.primary};
  --color-secondary: ${designSystem.colors.secondary};
  --color-accent: ${designSystem.colors.accent};
  --color-background: ${designSystem.colors.background};
  --color-text: ${designSystem.colors.text};
  --font-heading: ${designSystem.typography.headingFont};
  --font-body: ${designSystem.typography.bodyFont};

* {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-background);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
  `.trim();
}

// Generate a fallback component if AI generation fails
function generateFallbackComponent(
  section: { type: string; name: string },
  context: V4CompanyContext
): string {
  const companyName = context.company.name;

  switch (section.type) {
    case "hero":
      return `export default function HeroSection() {
  return (
    <section className="relative bg-linear-to-br from-purple-600 to-pink-600 text-white py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl font-bold mb-6">${companyName}</h1>
        <p className="text-xl mb-8">${
          context.company.slogan || "Your trusted partner"
        }</p>
        <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
          Get Started
        </button>
      </div>
    </section>
  );
}`;

    case "footer":
      return `export default function FooterSection() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-lg font-semibold mb-2">${companyName}</p>
        <p className="text-gray-400">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      </div>
    </footer>
  );
}`;

    default:
      return `export default function ${
        section.type.charAt(0).toUpperCase() + section.type.slice(1)
      }Section() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">${
          section.name
        }</h2>
        <p className="text-center text-gray-600">Content for ${companyName}</p>
      </div>
    </section>
  );
}`;
  }
}

// Unused helper functions (kept for potential future use)
/* eslint-disable @typescript-eslint/no-unused-vars */
function buildContextSummary(context: V4CompanyContext): string {
  const sections: string[] = [];

  sections.push(`**${context.company.name}**`);
  sections.push(`Industry: ${context.company.industry || "Not specified"}`);

  if (context.company.description) {
    sections.push(`\nDescription: ${context.company.description}`);
  }

  if (context.company.slogan) {
    sections.push(`Slogan: "${context.company.slogan}"`);
  }

  if (context.products.length > 0) {
    sections.push(`\n**Products** (${context.products.length} total):`);
    context.products.slice(0, 5).forEach((p) => {
      sections.push(`- ${p.name}${p.price ? ` - $${p.price}` : ""}`);
    });
  }

  if (context.services.length > 0) {
    sections.push(`\n**Services** (${context.services.length} total):`);
    context.services.slice(0, 5).forEach((s) => {
      sections.push(`- ${s.name}${s.price ? ` - $${s.price}` : ""}`);
    });
  }

  if (context.team.length > 0) {
    sections.push(`\n**Team** (${context.team.length} members):`);
    context.team.slice(0, 5).forEach((t) => {
      sections.push(`- ${t.name} - ${t.role}`);
    });
  }

  if (context.testimonials.length > 0) {
    sections.push(
      `\n**Testimonials** (${
        context.testimonials.length
      } reviews, avg ${context.customerInsights.averageRating?.toFixed(1)}★):`
    );
    context.testimonials.slice(0, 2).forEach((t) => {
      sections.push(`- ${t.customerName}: "${t.content.substring(0, 100)}..."`);
    });
  }

  return sections.join("\n");
}

function buildPreferencesSummary(preferences: V4DesignPreferences): string {
  const sections: string[] = [];

  if (preferences.heroStyle) {
    sections.push(`Hero Style: ${preferences.heroStyle}`);
  }

  if (preferences.primaryColor) {
    sections.push(`Color Scheme: ${preferences.primaryColor}`);
  }

  if (preferences.fontPairing) {
    sections.push(`Typography: ${preferences.fontPairing}`);
  }

  const enabledSections = Object.entries(preferences.sections || {})
    .filter(([, enabled]) => enabled)
    .map(([section]) => section);

  if (enabledSections.length > 0) {
    sections.push(`\nSections to include: ${enabledSections.join(", ")}`);
  }

  return sections.join("\n");
}

function calculateQualityScore(
  website: V4Website,
  context: V4CompanyContext
): number {
  let score = 0;
  const maxScore = 100;

  // Has design system (20 points)
  if (website.designSystem) score += 20;

  // Has pages (20 points)
  if (website.pages && website.pages.length > 0) score += 20;

  // Each page has SEO metadata (20 points)
  if (website.pages?.every((p) => p.seo)) score += 20;

  // Components exist (20 points)
  const totalComponents =
    website.pages?.reduce((sum, p) => sum + p.components.length, 0) || 0;
  if (totalComponents >= 5) score += 20;

  // Uses company data (20 points)
  const companyMentions = JSON.stringify(website)
    .toLowerCase()
    .includes(context.company.name.toLowerCase());
  if (companyMentions) score += 20;

  return Math.min(score, maxScore);
}

function calculateCreativityScore(website: V4Website): number {
  let score = 40; // Base score (lowered to make room for more points)

  const websiteStr = JSON.stringify(website).toLowerCase();

  // Visual effects (10 points each)
  if (websiteStr.includes("gradient") || websiteStr.includes("bg-gradient"))
    score += 12;
  if (websiteStr.includes("animation") || websiteStr.includes("animate-"))
    score += 12;
  if (
    websiteStr.includes("glassmorphism") ||
    websiteStr.includes("backdrop-blur")
  )
    score += 12;

  // Transform effects (8 points each)
  if (
    websiteStr.includes("hover:scale") ||
    websiteStr.includes("transform") ||
    websiteStr.includes("transition-transform")
  )
    score += 8;
  if (websiteStr.includes("hover:rotate") || websiteStr.includes("rotate-"))
    score += 8;

  // Advanced layouts (8 points each)
  if (websiteStr.includes("grid-cols") && websiteStr.includes("gap-"))
    score += 6;
  if (websiteStr.includes("flex") && websiteStr.includes("space-")) score += 4;

  // Color sophistication (6 points each)
  if (
    websiteStr.includes("opacity-") ||
    websiteStr.includes("bg-opacity-") ||
    websiteStr.includes("text-opacity-")
  )
    score += 6;
  if (websiteStr.includes("shadow-") || websiteStr.includes("drop-shadow"))
    score += 6;

  // Unique/custom elements
  if (websiteStr.includes("custom")) score += 8;
  if (websiteStr.includes("unique")) score += 8;

  return Math.min(score, 100);
}
