// v4.3

import { z } from "zod";
import {
  callStorefrontModel,
  type ChatMessage,
  type AiProviderConfig,
} from "./model-client";
import { getContrastRatio, makeAccessible } from "@/lib/utils/wcag-contrast";

/**
 * 1. STRICT TYPE DEFINITIONS
 * Inferred from Zod for a single source of truth.
 */
const SectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  order: z.number(),
  className: z.string().optional(),
  content: z.record(z.string(), z.unknown()),
  layout: z.record(z.string(), z.unknown()).optional(),
  styling: z.record(z.string(), z.unknown()).optional(),
});

const StorefrontSpecSchema = z.object({
  version: z.number().default(1),
  meta: z.object({
    layoutStyle: z.string().default("hero-left"),
    tone: z.string().optional(),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    backgroundColor: z.string().default("#FFFFFF"),
    textColor: z.string().default("#111827"),
    heroSize: z.string().optional(),
    buttonStyle: z.string().optional(),
    cornerStyle: z.string().optional(),
    typography: z.record(z.string(), z.unknown()).optional(),
    spacing: z.record(z.string(), z.unknown()).optional(),
    grid: z.record(z.string(), z.unknown()).optional(),
    effects: z.record(z.string(), z.unknown()).optional(),
    styleFamily: z.string().optional(),
    seo: z.record(z.string(), z.unknown()).optional(),
  }),
  sections: z.array(SectionSchema),
});

export type AiFrontstoreSpec = z.infer<typeof StorefrontSpecSchema>;
export type AiFrontstoreSection = z.infer<typeof SectionSchema>;

// Re-using your existing input interface
export interface CompanySummary {
  id: string;
  name: string;
  slogan?: string | null;
  description?: string | null;
  industry?: string | null;
}

export interface AiStorefrontInput {
  company: CompanySummary;
  products?: ProductSummary[];
  services?: ServiceSummary[];
  testimonials?: TestimonialSummary[];
  customersCount?: number;
  approvedTestimonialsCount?: number;
  team?: Array<{
    name: string | null;
    role: string;
    bio: string | null;
    image: string | null;
  }>;
  locations?: Array<{
    id: string;
    name: string;
    type: string;
    isMain: boolean;
    latitude: number;
    longitude: number;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state?: string | null;
    country: string;
    postalCode?: string | null;
    phone?: string | null;
    email?: string | null;
  }>;
  brandColors?: { primary?: string; secondary?: string; accent?: string };
  prompt: string;
  goal?: "sell-products" | "sell-services" | "lead-gen" | "bookings";
  tone: "playful" | "serious" | "luxury" | "minimal";
  conversationHistory?: Array<{ role: string; content: string }>;
  previousSpec?: AiFrontstoreSpec | null;
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string[] | null;
  };
  heroLayout?: "left" | "center" | "right";
  showLocation?: boolean;
  showTeam?: boolean;
  showTestimonials?: boolean;
  includeProducts?: boolean;
  includeServices?: boolean;
  includePosts?: boolean;
  includeStats?: boolean;
  includeFaq?: boolean;
  includeCta?: boolean;
  includeContact?: boolean;
  blogEnabled?: boolean;
  blogHasPosts?: boolean;
  contact?: {
    email: string | null;
    phone: string | null;
    address: string | null;
  };
}

export interface AiStorefrontResult {
  spec: AiFrontstoreSpec;
  assistantMessage: string;
  shouldAsk: boolean;
  safety: { blocked: boolean; reasons?: string[] };
  usedModel: boolean;
}

/**
 * 2. SYSTEM PROMPT
 */
const SYSTEM_PROMPT = `You are an expert web designer.
🎯 MANDATORY: Generate EXACTLY these 9 sections in order:
1. announcement-bar (0), 2. header (1), 3. hero (2), 4. stats (3), 5. highlights (4), 6. portfolio (5), 7. testimonials (6), 8. cta-band (7), 9. footer (999).
Return JSON: { "shouldAsk": false, "explanation": "...", "spec": { ... } }`;

/**
 * 3. MAIN GENERATOR
 */
export async function generateAiStorefront(
  input: AiStorefrontInput,
  providerConfig?: AiProviderConfig
): Promise<AiStorefrontResult> {
  const { company, prompt } = input;
  const isRegenerate = /regenerate|fresh|start over/i.test(prompt);

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(isRegenerate
      ? []
      : (input.conversationHistory || []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))),
    {
      role: "user",
      content: `Company: ${
        company.name
      }. Request: ${prompt}. Data: ${JSON.stringify(company)}`,
    },
  ];

  let spec: AiFrontstoreSpec | null = null;
  let assistantMessage = "";
  let usedModel = false;
  let shouldAsk = false;

  try {
    const raw = await callStorefrontModel<Record<string, unknown>>(
      messages,
      z.record(z.string(), z.unknown()),
      providerConfig
    );
    usedModel = true;

    if (raw && typeof raw.shouldAsk === "boolean" && raw.shouldAsk) {
      shouldAsk = true;
      assistantMessage =
        typeof raw.explanation === "string"
          ? raw.explanation
          : "Need more info.";
    }

    if (!shouldAsk) {
      const potentialSpec = raw?.spec || raw;
      const parsed = StorefrontSpecSchema.safeParse(potentialSpec);

      if (parsed.success) {
        spec = parsed.data;
        assistantMessage =
          typeof raw?.explanation === "string"
            ? raw.explanation
            : "Design generated.";
      }
    }
  } catch (error) {
    assistantMessage = mapErrorToMessage(error);
  }

  // Fallback if AI failed or returned invalid structure
  if (!spec) {
    spec = buildRichFallback(input);
  }

  // Post-processing
  spec = ensureMandatorySections(spec, input);
  spec = applyWCAGFixes(spec);
  const safety = runSafetyChecks(spec);

  return {
    spec: safety.blocked ? buildRichFallback(input) : spec,
    assistantMessage: safety.blocked
      ? "Content blocked for safety."
      : assistantMessage,
    shouldAsk,
    safety,
    usedModel,
  };
}

/**
 * 4. UTILITIES (STRICTLY TYPED)
 */

function mapErrorToMessage(error: unknown): string {
  const err = error as { status?: number; code?: string };
  if (err.status === 429 || err.code === "insufficient_quota")
    return "Quota exceeded. Using template.";
  return "AI generation failed. Using template.";
}

function buildRichFallback(input: AiStorefrontInput): AiFrontstoreSpec {
  return {
    version: 1,
    meta: {
      layoutStyle: "hero-left",
      primaryColor: input.brandColors?.primary || "#2563EB",
      secondaryColor: input.brandColors?.secondary || "#F97316",
      accentColor: input.brandColors?.accent || "#10B981",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
    },
    sections: [], // Populated by ensureMandatorySections
  };
}

function ensureMandatorySections(
  spec: AiFrontstoreSpec,
  input: AiStorefrontInput
): AiFrontstoreSpec {
  const mandatory = [
    "announcement-bar",
    "header",
    "hero",
    "stats",
    "highlights",
    "portfolio",
    "testimonials",
    "cta-band",
    "footer",
  ];
  const existing = new Set(spec.sections.map((s) => s.type));

  const updatedSections = [...spec.sections];

  mandatory.forEach((type) => {
    if (!existing.has(type)) {
      updatedSections.push(createDefaultSection(type, input, spec.meta));
    }
  });

  spec.sections = updatedSections
    .filter((s) => mandatory.includes(s.type))
    .sort((a, b) => {
      const order: Record<string, number> = {
        "announcement-bar": 0,
        header: 1,
        hero: 2,
        footer: 999,
      };
      return (order[a.type] ?? 50) - (order[b.type] ?? 50);
    });

  return spec;
}

function createDefaultSection(
  type: string,
  input: AiStorefrontInput,
  meta: AiFrontstoreSpec["meta"]
): AiFrontstoreSection {
  return {
    id: `${type}-default`,
    type,
    order: 50,
    content: { headline: input.company.slogan || input.company.name },
    styling: {
      backgroundColor: meta.backgroundColor,
      textColor: meta.textColor,
    },
  };
}

function applyWCAGFixes(spec: AiFrontstoreSpec): AiFrontstoreSpec {
  const bg = spec.meta.backgroundColor;

  // Fix Global Text
  if (!getContrastRatio(spec.meta.textColor, bg).passesAA) {
    spec.meta.textColor = makeAccessible(spec.meta.textColor, bg, "AA");
  }

  // Fix Primary Color
  if (!getContrastRatio(spec.meta.primaryColor, bg).passesAA) {
    spec.meta.primaryColor = makeAccessible(spec.meta.primaryColor, bg, "AA");
  }

  // Fix Sections
  spec.sections.forEach((section) => {
    const sBg =
      typeof section.styling?.backgroundColor === "string"
        ? section.styling.backgroundColor
        : bg;
    const sText =
      typeof section.styling?.textColor === "string"
        ? section.styling.textColor
        : null;

    if (sText && !getContrastRatio(sText, sBg).passesAA) {
      section.styling = {
        ...section.styling,
        textColor: makeAccessible(sText, sBg, "AA"),
      };
    }
  });

  return spec;
}

export function runSafetyChecks(spec: AiFrontstoreSpec) {
  const FORBIDDEN = ["porn", "xxx", "gambling", "illegal drugs", "weapons"];
  const text = JSON.stringify(spec).toLowerCase();
  const hits = FORBIDDEN.filter((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(text)
  );
  return { blocked: hits.length > 0, reasons: hits };
}

// v4.2

// import { z } from "zod";
// import {
//   callStorefrontModel,
//   type ChatMessage,
//   type AiProviderConfig,
// } from "./model-client";
// import { getContrastRatio, makeAccessible } from "@/lib/utils/wcag-contrast";

// // --- 1. TYPES & INTERFACES (Restored from your original) ---

// export interface CompanySummary {
//   id: string;
//   name: string;
//   slogan?: string | null;
//   description?: string | null;
//   industry?: string | null;
//   logo?: string | null;
//   logoLight?: string | null;
//   logoDark?: string | null;
//   extractedBrandColors?: {
//     dominantColors: string[];
//     primarySuggestion: string;
//     secondarySuggestion: string;
//     accentSuggestions: string[];
//     isDarkLogo: boolean;
//     isLightLogo: boolean;
//   };
// }

export interface ProductSummary {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  images?: string[];
}

export interface ServiceSummary {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  duration: number | null;
}

export interface TestimonialSummary {
  id: string;
  customerName: string;
  customerTitle: string | null;
  testimonial: string;
  rating: number;
}
// export interface AiStorefrontInput {
//   company: CompanySummary;
//   products: ProductSummary[];
//   services: ServiceSummary[];
//   testimonials: TestimonialSummary[];
//   customersCount?: number;
//   approvedTestimonialsCount?: number;
//   team?: Array<{
//     name: string | null;
//     role: string;
//     bio: string | null;
//     image: string | null;
//   }>;
//   locations?: Array<{
//     id: string;
//     name: string;
//     type: string;
//     isMain: boolean;
//     latitude: number;
//     longitude: number;
//     addressLine1: string;
//     addressLine2?: string | null;
//     city: string;
//     state?: string | null;
//     country: string;
//     postalCode?: string | null;
//     phone?: string | null;
//     email?: string | null;
//   }>;
//   brandColors?: { primary?: string; secondary?: string; accent?: string };
//   prompt: string;
//   goal: "sell-products" | "sell-services" | "lead-gen" | "bookings";
//   tone: "playful" | "serious" | "luxury" | "minimal";
//   conversationHistory?: Array<{ role: string; content: string }>;
//   previousSpec?: AiFrontstoreSpec | null;
//   seo?: {
//     title?: string | null;
//     description?: string | null;
//     keywords?: string[] | null;
//   };
//   heroLayout?: "left" | "center" | "right";
//   showLocation?: boolean;
//   showTeam?: boolean;
//   showTestimonials?: boolean;
//   includeProducts?: boolean;
//   includeServices?: boolean;
//   includePosts?: boolean;
//   includeStats?: boolean;
//   includeFaq?: boolean;
//   includeCta?: boolean;
//   includeContact?: boolean;
//   blogEnabled?: boolean;
//   blogHasPosts?: boolean;
//   contact?: {
//     email: string | null;
//     phone: string | null;
//     address: string | null;
//   };
// }

// const SectionSchema = z.object({
//   id: z.string(),
//   type: z.string(),
//   order: z.number(),
//   className: z.string().optional(),
//   content: z.record(z.string(), z.any()),
//   layout: z.record(z.string(), z.any()).optional(),
//   styling: z.record(z.string(), z.any()).optional(),
// });

// const StorefrontSpecSchema = z.object({
//   version: z.number().default(1),
//   meta: z.object({
//     layoutStyle: z.string().optional(),
//     tone: z.string().optional(),
//     primaryColor: z.string(),
//     secondaryColor: z.string(),
//     accentColor: z.string(),
//     backgroundColor: z.string(),
//     textColor: z.string(),
//     heroSize: z.string().optional(),
//     buttonStyle: z.string().optional(),
//     cornerStyle: z.string().optional(),
//     typography: z.record(z.string(), z.any()).optional(),
//     spacing: z.record(z.string(), z.any()).optional(),
//     grid: z.record(z.string(), z.any()).optional(),
//     effects: z.record(z.string(), z.any()).optional(),
//     styleFamily: z.string().optional(),
//     seo: z.record(z.string(), z.any()).optional(),
//   }),
//   sections: z.array(SectionSchema),
// });

// export type AiFrontstoreSpec = z.infer<typeof StorefrontSpecSchema>;
// export type AiFrontstoreSection = z.infer<typeof SectionSchema>;

// export interface AiStorefrontResult {
//   spec: AiFrontstoreSpec | null;
//   assistantMessage?: string | null;
//   shouldAsk?: boolean;
//   safety: { blocked: boolean; reasons?: string[] };
//   usedModel?: boolean;
// }

// // --- 3. CONSTANTS ---

// const FORBIDDEN_KEYWORDS = [
//   "porn",
//   "xxx",
//   "gambling",
//   "illegal drugs",
//   "weapons",
// ];

// const STOREFRONT_SYSTEM_PROMPT = `You are an expert web designer.
// 🎯 CRITICAL: Generate EXACTLY these 9 sections:
// 1. announcement-bar (0), 2. header (1), 3. hero (2), 4. stats (3), 5. highlights (4), 6. portfolio (5), 7. testimonials (6), 8. cta-band (7), 9. footer (999).

// 🎨 DESIGN: Ensure WCAG AA 4.5:1 contrast. Use high-quality Unsplash keywords for images.
// Return JSON: { "shouldAsk": false, "explanation": "...", "spec": { ... } }`;

// // --- 4. MANDATORY SECTION DEFAULTS (The "Safety Net") ---

// const getMandatoryDefault = (
//   type: string,
//   input: AiStorefrontInput,
//   meta: AiFrontstoreSpec["meta"]
// ): AiFrontstoreSection => {
//   const { company } = input;
//   const base = { id: `${type}-default`, type, order: 0, content: {} };

//   switch (type) {
//     case "announcement-bar":
//       return {
//         ...base,
//         order: 0,
//         content: { text: `Welcome to ${company.name}`, link: "#contact" },
//         styling: { backgroundColor: meta.accentColor, textColor: "#FFFFFF" },
//       };
//     case "header":
//       return {
//         ...base,
//         order: 1,
//         content: {
//           logoText: company.name,
//           navigationItems: [{ label: "Home", href: "#hero" }],
//         },
//       };
//     case "hero":
//       return {
//         ...base,
//         order: 2,
//         content: {
//           headline: company.slogan || company.name,
//           subheadline: company.description || "Expert solutions.",
//           imageUrl:
//             "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
//         },
//       };
//     case "stats":
//       return {
//         ...base,
//         order: 3,
//         content: {
//           items: [
//             { label: "Experience", value: "10+" },
//             { label: "Clients", value: "500+" },
//           ],
//         },
//       };
//     case "highlights":
//       return {
//         ...base,
//         order: 4,
//         content: {
//           heading: "Why Us",
//           items: [{ title: "Quality", description: "Top tier service." }],
//         },
//       };
//     case "portfolio":
//       return {
//         ...base,
//         order: 5,
//         content: {
//           heading: "Our Work",
//           items: [{ title: "Project 1", description: "Success story." }],
//         },
//       };
//     case "testimonials":
//       return {
//         ...base,
//         order: 6,
//         content: {
//           heading: "Reviews",
//           items: [{ quote: "Great!", author: "Customer" }],
//         },
//       };
//     case "cta-band":
//       return {
//         ...base,
//         order: 7,
//         content: { heading: "Ready?", ctaLabel: "Contact" },
//         styling: { backgroundColor: meta.primaryColor, textColor: "#FFFFFF" },
//       };
//     case "footer":
//       return {
//         ...base,
//         order: 999,
//         content: {
//           companyName: company.name,
//           copyright: `© ${new Date().getFullYear()}`,
//         },
//       };
//     default:
//       return { ...base, order: 50 };
//   }
// };

// // --- 5. MAIN LOGIC ---

// export async function generateAiStorefront(
//   input: AiStorefrontInput,
//   providerConfig?: AiProviderConfig
// ): Promise<AiStorefrontResult> {
//   const isRegenerate = /regenerate|fresh|start over/i.test(input.prompt);

//   const messages: ChatMessage[] = [
//     { role: "system", content: STOREFRONT_SYSTEM_PROMPT },
//     ...(isRegenerate
//       ? []
//       : (input.conversationHistory || []).map((m) => ({
//           role: m.role as "user" | "assistant",
//           content: m.content,
//         }))),
//     {
//       role: "user",
//       content: `Company: ${input.company.name}. Request: ${
//         input.prompt
//       }. Data: ${JSON.stringify(input.company)}`,
//     },
//   ];

//   let spec: AiFrontstoreSpec | null = null;
//   let assistantMessage = "";
//   let usedModel = false;

//   try {
//     const raw: unknown = await callStorefrontModel(
//       messages,
//       z.unknown(),
//       providerConfig
//     );
//     usedModel = true;

//     const rawObj =
//       raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

//     if (rawObj.shouldAsk) {
//       return {
//         spec: null,
//         assistantMessage:
//           typeof rawObj.explanation === "string"
//             ? rawObj.explanation
//             : "Please provide more details.",
//         shouldAsk: true,
//         safety: { blocked: false },
//         usedModel,
//       };
//     }

//     const parsed = StorefrontSpecSchema.safeParse(rawObj.spec || raw);
//     if (parsed.success) {
//       spec = parsed.data;
//       assistantMessage =
//         typeof rawObj.explanation === "string"
//           ? rawObj.explanation
//           : "Design generated.";
//     }
//   } catch (error: unknown) {
//     console.error("AI Error:", error);
//     const errorObj =
//       error && typeof error === "object" ? (error as { status?: number }) : {};
//     assistantMessage =
//       errorObj.status === 429
//         ? "Quota exceeded. Using template."
//         : "AI failed. Using template.";
//   }

//   // 1. Fallback if AI failed
//   if (!spec) {
//     spec = {
//       version: 1,
//       meta: {
//         primaryColor: input.brandColors?.primary || "#2563EB",
//         secondaryColor: input.brandColors?.secondary || "#F97316",
//         accentColor: input.brandColors?.accent || "#10B981",
//         backgroundColor: "#FFFFFF",
//         textColor: "#111827",
//       },
//       sections: [],
//     };
//   }

//   // 2. Ensure all 9 mandatory sections exist
//   const mandatoryTypes = [
//     "announcement-bar",
//     "header",
//     "hero",
//     "stats",
//     "highlights",
//     "portfolio",
//     "testimonials",
//     "cta-band",
//     "footer",
//   ];
//   const existingTypes = new Set(spec.sections.map((s) => s.type));

//   mandatoryTypes.forEach((type) => {
//     if (!existingTypes.has(type)) {
//       spec!.sections.push(getMandatoryDefault(type, input, spec!.meta));
//     }
//   });

//   // 3. Sort and Clean
//   spec.sections = spec.sections
//     .filter((s) => mandatoryTypes.includes(s.type)) // Remove non-mandatory
//     .sort((a, b) => a.order - b.order);

//   // 4. WCAG Fixes
//   spec = applyWCAGFixes(spec);

//   // 5. Safety
//   const safety = runSafetyChecks(spec);

//   return {
//     spec: safety.blocked ? null : spec,
//     assistantMessage: safety.blocked ? "Blocked for safety." : assistantMessage,
//     shouldAsk: false,
//     safety,
//     usedModel,
//   };
// }

// // --- 6. UTILITIES ---

// function applyWCAGFixes(spec: AiFrontstoreSpec): AiFrontstoreSpec {
//   const fixes = { ...spec };
//   const bg = fixes.meta.backgroundColor;

//   // Global meta fixes
//   const textCheck = getContrastRatio(fixes.meta.textColor, bg);
//   if (!textCheck.passesAA)
//     fixes.meta.textColor = makeAccessible(fixes.meta.textColor, bg, "AA");

//   const primaryCheck = getContrastRatio(fixes.meta.primaryColor, bg);
//   if (!primaryCheck.passesAA)
//     fixes.meta.primaryColor = makeAccessible(fixes.meta.primaryColor, bg, "AA");

//   // Section fixes
//   fixes.sections.forEach((sec, idx) => {
//     if (sec.styling?.backgroundColor && sec.styling?.textColor) {
//       const sBg = String(sec.styling.backgroundColor);
//       const sText = String(sec.styling.textColor);
//       if (!getContrastRatio(sText, sBg).passesAA) {
//         fixes.sections[idx].styling!.textColor = makeAccessible(
//           sText,
//           sBg,
//           "AA"
//         );
//       }
//     }
//   });

//   return fixes;
// }

// export function runSafetyChecks(spec: AiFrontstoreSpec) {
//   const text = JSON.stringify(spec).toLowerCase();
//   const hits = FORBIDDEN_KEYWORDS.filter((k) => text.includes(k));
//   return { blocked: hits.length > 0, reasons: hits };
// }

// V4.1

// import { z } from "zod";

// import {
//   callStorefrontModel,
//   type ChatMessage,
//   type AiProviderConfig,
// } from "./model-client";

// import { getContrastRatio, makeAccessible } from "@/lib/utils/wcag-contrast";

// // Break circular dependency by declaring types with explicit properties
// interface AiFrontstoreSpec {
//   version: number;
//   meta: {
//     layoutStyle?: string;
//     tone?: string;
//     primaryColor?: string;
//     secondaryColor?: string;
//     accentColor?: string;
//     backgroundColor?: string;
//     textColor?: string;
//     heroSize?: string;
//     buttonStyle?: string;
//     cornerStyle?: string;
//     typography?: Record<string, string | number>;
//     spacing?: Record<string, string | number>;
//     grid?: Record<string, string | number>;
//     effects?: Record<string, string | number | boolean>;
//     styleFamily?: string;
//     backgroundImage?: Record<string, string | number | boolean>;
//     backgroundVideo?: Record<string, string | number | boolean>;
//     overlayColor?: string;
//     overlayOpacity?: number;
//     animations?: string[];
//     navigation?: Record<string, string | number | boolean>;
//     seo?: Record<string, string | string[] | undefined>;
//   };
//   sections: AiFrontstoreSection[];
// }

// type SectionContentValue =
//   | string
//   | number
//   | boolean
//   | string[]
//   | Record<string, unknown>[]
//   | Record<string, unknown>
//   | undefined;

// interface AiFrontstoreSection {
//   id: string;
//   className?: string;
//   type: string;
//   order: number;
//   content: Record<string, SectionContentValue>;
//   layout?: Record<string, string | number | boolean | undefined>;
//   styling?: Record<
//     string,
//     string | number | boolean | Record<string, unknown> | undefined
//   >;
// }

// // Compact system prompt - enforces structure, lets admin prompt control style
// const STOREFRONT_SYSTEM_PROMPT = `You are an expert web designer creating accessible storefronts.

// 🎯 CRITICAL: Generate EXACTLY these 9 sections and NO MORE:
// 1. announcement-bar (order: 0)
// 2. header (order: 1)
// 3. hero (order: 2)
// 4. stats (order: 3)
// 5. highlights (order: 4) - Key features/benefits
// 6. portfolio (order: 5) - Portfolio/projects/work showcase
// 7. testimonials (order: 6)
// 8. cta-band (order: 7)
// 9. footer (order: 999)

// 📋 Available section types (use ONLY the 9 mandatory above):
// • announcement-bar, header, hero, highlights, product-grid, service-grid
// • portfolio, posts, team, testimonials, stats, faq
// • contact, contact-map, cta-band, footer

// ✅ ONLY the 9 mandatory sections listed above

// � COMPANY CONTEXT:
// • Read the company data carefully - understand their industry and services
// • For agencies/consultancies → emphasize expertise, portfolio, process
// • For product companies → emphasize features, benefits, social proof
// • For service businesses → emphasize reliability, experience, results
// • Match tone and messaging to the company's actual offerings

// 🎨 DESIGN CREATIVITY - RESPOND TO THE ADMIN'S REQUEST:
// • If they want "bold colors" → use vibrant, saturated colors (e.g., #FF6B6B, #4ECDC4)

// 🔒 MANDATORY REQUIREMENTS (ENFORCE ACROSS ALL PAGES):
// • The site MUST include these sections: Hero, About, Services, Products, Team, Testimonials, Contact (WITH MAP), Footer, Stats/Highlights/CTA as appropriate.
// • **Testimonials:** return at least 30 approved testimonials (if company has fewer, generate believable placeholders marked `isGenerated:true`).
// • **Projects/Portfolio:** return at least 10 projects when appropriate (generate placeholders if needed).
// • **Images:** For every visual section (hero, product, service, team, testimonials, portfolio), return **imageKeywords** and an array `images` (URLs or Unsplash search terms). Images MUST be free-to-use stock (Unsplash-style). Provide alt text for each image.
// • **Contact map:** Contact section MUST include `map: { address, coords: [lat,lng], pinLabel }` if locations are available; otherwise include `address` and `suggestedCoords`.
// • **Design system:** return a single `designSystem` object and ensure all pages use it (colors, typography, spacing).
// • **SEO & Value:** Ensure metadata and on-page copy are SEO-optimized, and aim for a world-class, professional tone ("10K website" level).
// • If they want "professional" → use blues/grays (e.g., #2563EB, #64748B)
// • If they want "minimalist" → use subtle colors and lots of white space
// • If they want "dark mode" → use dark backgrounds (#0F172A, #1E293B)
// • If they want "playful" → use bright, fun colors (e.g., #F59E0B, #EC4899)
// • Vary layoutStyle: "hero-left", "hero-center", "hero-split", "full-bleed"
// • Vary buttonStyle: "solid", "outline", "pill", "sharp"
// • Vary cornerStyle: "sharp", "soft", "round"
// • Vary heroSize: "compact", "medium", "large", "full"

// ⚠️ CRITICAL ACCESSIBILITY REQUIREMENTS:
// • NEVER use white/light text on white/light backgrounds
// • NEVER use dark text on dark backgrounds
// • Minimum 4.5:1 contrast ratio for all text (WCAG AA)
// • If logo/branding uses light colors, header MUST have dark background
// • If logo/branding uses dark colors, header background can be light
// • Test: Can you read white text on the background color? If not, change it!
// • Common mistakes to AVOID: white logo on white header, black text on dark blue

// ✅ Design Checklist:
// • 4.5:1+ contrast ratio on ALL text
// • 16px+ minimum font size
// • Readable color combinations
// • Consistent visual hierarchy
// 🖼️ Images: Unsplash for backgrounds, real product images when available

// Output: { shouldAsk: false, explanation: "brief", spec: {...} }`;

// export interface CompanySummary {
//   id: string;
//   name: string;
//   slogan?: string | null;
//   description?: string | null;
//   industry?: string | null;
//   logo?: string | null;
//   logoLight?: string | null;
//   logoDark?: string | null;
//   extractedBrandColors?: {
//     dominantColors: string[];
//     primarySuggestion: string;
//     secondarySuggestion: string;
//     accentSuggestions: string[];
//     isDarkLogo: boolean;
//     isLightLogo: boolean;
//   };
// }

// export interface ProductSummary {
//   id: string;
//   name: string;
//   description: string | null;
//   price: number;
//   category: string | null;
//   images?: string[]; // Array of image URLs
// }

// export interface ServiceSummary {
//   id: string;
//   name: string;
//   description: string | null;
//   price: number;
//   category: string | null;
//   duration: number | null;
// }

// export interface TestimonialSummary {
//   id: string;
//   customerName: string;
//   customerTitle: string | null;
//   testimonial: string;
//   rating: number;
// }

// export interface AiStorefrontInput {
//   company: CompanySummary;
//   products: ProductSummary[];
//   services: ServiceSummary[];
//   testimonials: TestimonialSummary[];
//   team?: Array<{
//     name: string | null;
//     role: string;
//     bio: string | null;
//     image: string | null;
//   }>;
//   posts?: Array<{
//     id: string;
//     title: string;
//     excerpt: string | null;
//   }>;
//   locations?: Array<{
//     id: string;
//     name: string;
//     type: string;
//     isMain: boolean;
//     latitude: number;
//     longitude: number;
//     addressLine1: string;
//     addressLine2?: string | null;
//     city: string;
//     state?: string | null;
//     country: string;
//     postalCode?: string | null;
//     phone?: string | null;
//     email?: string | null;
//   }>;
//   brandColors?: {
//     primary?: string;
//     secondary?: string;
//     accent?: string;
//   };
//   heroLayout?: "left" | "center";
//   showLocation?: boolean;
//   showTeam?: boolean;
//   showTestimonials?: boolean;
//   blogEnabled?: boolean;
//   blogHasPosts?: boolean;
//   contact?: {
//     email?: string | null;
//     phone?: string | null;
//     address?: string | null;
//   };
//   seo?: {
//     title?: string | null;
//     description?: string | null;
//     keywords?: string[] | null;
//   };
//   // Optional runtime counts and include/feature flags supplied by caller
//   customersCount?: number;
//   approvedTestimonialsCount?: number;
//   includeProducts?: boolean;
//   includeServices?: boolean;
//   includePosts?: boolean;
//   includeStats?: boolean;
//   includeFaq?: boolean;
//   includeCta?: boolean;
//   includeContact?: boolean;
//   includeContactMap?: boolean;
//   heroSize?: "compact" | "full";
//   prompt: string;
//   goal: "sell-products" | "sell-services" | "lead-gen" | "bookings";
//   tone: "playful" | "serious" | "luxury" | "minimal";
//   // Conversation context
//   conversationHistory?: Array<{ role: string; content: string }>;
//   previousSpec?: AiFrontstoreSpec | null;
// }

// export interface AiStorefrontResult {
//   spec: AiFrontstoreSpec | null;
//   assistantMessage?: string | null;
//   shouldAsk?: boolean;
//   safety: {
//     blocked: boolean;
//     reasons?: string[];
//   };
//   /** whether the remote model call produced the spec (vs fallback) */
//   usedModel?: boolean;
// }

// const FORBIDDEN_KEYWORDS = [
//   "porn",
//   "pornographic",
//   "xxx",
//   "sex",
//   "escort",
//   "gambling",
//   "casino",
//   "betting",
//   "illegal drugs",
//   "cocaine",
//   "heroin",
//   "meth",
//   "weapons",
//   "firearms",
// ];

// /**
//  * Provider-agnostic validation: ensures all mandatory sections exist
//  * regardless of which AI model generated the content.
//  * Adds missing sections with sensible defaults if they're not present.
//  * Removes any non-mandatory sections and duplicates to ensure consistent structure.
//  */
// function ensureMandatorySections(
//   spec: AiFrontstoreSpec,
//   input: AiStorefrontInput
// ): AiFrontstoreSpec {
//   const { company } = input;
//   const missingSections: AiFrontstoreSpec["sections"] = [];

//   // Define mandatory sections that MUST always exist in EVERY design
//   const mandatorySections: AiFrontstoreSpec["sections"][number]["type"][] = [
//     "announcement-bar",
//     "header",
//     "hero",
//     "stats",
//     "highlights",
//     "portfolio",
//     "testimonials",
//     "cta-band",
//     "footer",
//   ];

//   const mandatorySectionsSet = new Set(mandatorySections);

//   // STEP 1: Remove any sections that are NOT mandatory
//   // STEP 2: Remove duplicates (keep first occurrence)
//   const seenTypes = new Set<string>();
//   const filteredSections = spec.sections.filter((section) => {
//     // Remove if not in mandatory list
//     if (!mandatorySectionsSet.has(section.type)) {
//       console.log(
//         `[Provider Validation] Removing non-mandatory section: ${section.type}`
//       );
//       return false;
//     }
//     // Remove if duplicate
//     if (seenTypes.has(section.type)) {
//       console.log(
//         `[Provider Validation] Removing duplicate section: ${section.type}`
//       );
//       return false;
//     }
//     seenTypes.add(section.type);
//     return true;
//   });

//   spec.sections = filteredSections;
//   const existingTypes = new Set(spec.sections.map((s) => s.type));

//   let nextOrder = spec.sections.length;

//   // Check each mandatory section and add if missing
//   mandatorySections.forEach((sectionType) => {
//     if (!existingTypes.has(sectionType)) {
//       console.warn(
//         `[Provider Validation] Missing mandatory section: ${sectionType}. Adding default.`
//       );

//       // Add default section based on type
//       switch (sectionType) {
//         case "announcement-bar":
//           missingSections.push({
//             id: "announcement-bar",
//             type: "announcement-bar",
//             order: 0, // Always first
//             content: {
//               text: `Welcome to ${company.name}`,
//               link: "#contact",
//               dismissible: true,
//             },
//             styling: {
//               backgroundColor: spec.meta.accentColor || "#0066CC",
//               textColor: "#FFFFFF",
//             },
//           });
//           break;

//         case "header":
//           missingSections.push({
//             id: "header",
//             type: "header",
//             order: 1, // Always second
//             content: {
//               logoText: company.name,
//               navigationItems: [
//                 { label: "Home", href: "#hero" },
//                 { label: "Services", href: "#services" },
//                 { label: "Contact", href: "#contact" },
//               ],
//               ctaLabel: "Get Started",
//               ctaHref: "#contact",
//             },
//             styling: {
//               position: "sticky",
//               backgroundColor: "#FFFFFF",
//               textColor: spec.meta.primaryColor || "#000000",
//             },
//           });
//           break;

//         case "hero":
//           missingSections.push({
//             id: "hero",
//             type: "hero",
//             order: 2,
//             content: {
//               headline: company.slogan || `Welcome to ${company.name}`,
//               subheadline:
//                 company.description ||
//                 `Discover what makes ${company.name} special`,
//               ctaLabel: "Learn More",
//               ctaHref: "#contact",
//               imageUrl:
//                 "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
//             },
//             styling: {
//               layout: "center",
//               backgroundImage: {
//                 url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
//               },
//             },
//           });
//           break;

//         case "stats":
//           missingSections.push({
//             id: "stats",
//             type: "stats",
//             order: nextOrder++,
//             content: {
//               heading: `Why Choose ${company.name}`,
//               items: [
//                 {
//                   label: "Experience",
//                   value: "10+",
//                   suffix: "Years",
//                 },
//                 {
//                   label: "Clients",
//                   value: "500",
//                   suffix: "+",
//                 },
//                 {
//                   label: "Satisfaction",
//                   value: "99",
//                   suffix: "%",
//                 },
//               ],
//             },
//           });
//           break;

//         case "highlights":
//           missingSections.push({
//             id: "highlights",
//             type: "highlights",
//             order: nextOrder++,
//             content: {
//               heading: "What We Offer",
//               subheading: `Explore the services that make ${company.name} stand out`,
//               items: [
//                 {
//                   icon: "💎",
//                   title: "Quality Service",
//                   description:
//                     "Exceptional attention to detail in everything we do",
//                 },
//                 {
//                   icon: "⚡",
//                   title: "Fast Delivery",
//                   description:
//                     "Quick turnaround without compromising on quality",
//                 },
//                 {
//                   icon: "🎯",
//                   title: "Targeted Solutions",
//                   description: "Customized approaches for your unique needs",
//                 },
//               ],
//             },
//           });
//           break;

//         case "testimonials":
//           missingSections.push({
//             id: "testimonials",
//             type: "testimonials",
//             order: nextOrder++,
//             content: {
//               heading: "What Our Clients Say",
//               items: [
//                 {
//                   quote: `Working with ${company.name} was an outstanding experience. Highly recommended!`,
//                   author: "John Smith",
//                   role: "CEO, Tech Company",
//                   rating: 5,
//                 },
//                 {
//                   quote:
//                     "Professional, reliable, and exceeds expectations every time.",
//                   author: "Sarah Johnson",
//                   role: "Marketing Director",
//                   rating: 5,
//                 },
//               ],
//             },
//           });
//           break;

//         case "cta-band":
//           missingSections.push({
//             id: "cta-band",
//             type: "cta-band",
//             order: nextOrder++,
//             content: {
//               heading: `Ready to Get Started with ${company.name}?`,
//               subheading: "Contact us today and let's discuss your project",
//               ctaLabel: "Get In Touch",
//               ctaHref: "#contact",
//               secondaryCtaLabel: "Learn More",
//               secondaryCtaHref: "#services",
//             },
//             styling: {
//               backgroundImage: {
//                 url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80",
//               },
//               overlay: {
//                 color: spec.meta.primaryColor || "#000000",
//                 opacity: 0.7,
//               },
//             },
//           });
//           break;

//         case "portfolio":
//           missingSections.push({
//             id: "portfolio",
//             type: "portfolio",
//             order: nextOrder++,
//             content: {
//               heading: "Our Work",
//               subheading: `See how ${company.name} has helped clients succeed`,
//               items: [
//                 {
//                   title: "Project Alpha",
//                   client: "Sample Client",
//                   description: "Delivered exceptional results",
//                   image:
//                     "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
//                 },
//               ],
//             },
//           });
//           break;

//         case "footer":
//           missingSections.push({
//             id: "footer",
//             type: "footer",
//             order: 999, // Always last
//             content: {
//               companyName: company.name,
//               description: company.description || undefined,
//               columns: [
//                 {
//                   title: "Quick Links",
//                   links: [
//                     { label: "Home", href: "#hero" },
//                     { label: "Services", href: "#services" },
//                     { label: "Contact", href: "#contact" },
//                   ],
//                 },
//               ],
//               socialLinks: [],
//               legalLinks: [
//                 { label: "Privacy Policy", href: "/privacy" },
//                 { label: "Terms of Service", href: "/terms" },
//               ],
//             },
//             styling: {
//               backgroundColor: spec.meta.primaryColor || "#1A1A1A",
//               textColor: "#FFFFFF",
//             },
//           });
//           break;
//       }
//     }
//   });

//   // If we added any missing sections, merge them and re-sort by order
//   if (missingSections.length > 0) {
//     console.log(
//       `[Provider Validation] Added ${missingSections.length} missing mandatory sections`
//     );

//     const allSections = [...spec.sections, ...missingSections];

//     // Sort by order but keep footer at 999
//     allSections.sort((a, b) => a.order - b.order);

//     // Enforce correct order for mandatory sections (but don't renumber everything)
//     const orderMap: Record<string, number> = {
//       "announcement-bar": 0,
//       header: 1,
//       hero: 2,
//       stats: 3,
//       highlights: 4,
//       portfolio: 5,
//       testimonials: 6,
//       "cta-band": 7,
//       footer: 999,
//     };

//     allSections.forEach((section) => {
//       if (orderMap[section.type] !== undefined) {
//         section.order = orderMap[section.type];
//       }
//     });

//     // Re-sort after fixing orders
//     allSections.sort((a, b) => a.order - b.order);

//     return {
//       ...spec,
//       sections: allSections,
//     };
//   }

//   return spec;
// }

// // FIX: Extracted massive object to top-level constant to prevent stack overflow
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// const EXAMPLE_GENERATION_OUTPUT = {
//   shouldAsk: false,
//   explanation:
//     "I've created a bold, modern design for your creative agency! Deep Navy (#1E40AF) as primary conveys professionalism with 7.2:1 contrast - perfect for accessibility. The vibrant Coral accent (#FF6B6B) adds energy to CTAs. I've included ALL sections with real product images and Unsplash backgrounds for maximum visual impact. The brutalist style with sharp edges and bold typography commands attention. Notice how each section flows with varied layouts and rich imagery!",
//   spec: {
//     version: 1,
//     meta: {
//       layoutStyle: "bold",
//       tone: "serious",
//       primaryColor: "#1E40AF",
//       secondaryColor: "#FF6B6B",
//       accentColor: "#10B981",
//       backgroundColor: "#FFFFFF",
//       textColor: "#111827",
//       heroSize: "extra-large",
//       buttonStyle: "3d",
//       cornerStyle: "sharp",
//       typography: {
//         headingFont: "Space Grotesk",
//         bodyFont: "Inter",
//         headingWeight: "extrabold",
//         bodyWeight: "normal",
//         headingSize: "extra-large",
//         bodySize: "medium",
//         lineHeight: "normal",
//         letterSpacing: "tight",
//       },
//       spacing: {
//         scale: "spacious",
//         sectionGap: "large",
//         containerMaxWidth: "2xl",
//       },
//       grid: {
//         columns: 3,
//         productCardStyle: "hover-lift",
//         imageAspectRatio: "wide",
//         gap: "relaxed",
//       },
//       effects: {
//         shadows: "hard",
//         borders: "thick",
//         gradients: true,
//         glassmorphism: false,
//         animations: "bold",
//       },
//       styleFamily: "brutalist",
//     },
//     sections: [
//       {
//         id: "announcement-bar-1",
//         type: "announcement-bar",
//         order: 0,
//         content: {
//           text: "🎉 50% Off All Services This Month - Limited Time!",
//           link: "#services",
//           dismissible: true,
//         },
//         styling: {
//           backgroundColor: "#FF6B6B",
//           textColor: "#FFFFFF",
//         },
//       },
//       {
//         id: "header-1",
//         type: "header",
//         order: 1,
//         content: {
//           logo: null,
//           companyName: "Creative Studios",
//           navigation: [
//             { label: "Home", href: "#hero" },
//             { label: "Services", href: "#services" },
//             { label: "Portfolio", href: "#portfolio" },
//             { label: "Team", href: "#team" },
//             { label: "Contact", href: "#contact" },
//           ],
//           showAuth: true,
//           showCart: false,
//           style: "sticky",
//         },
//         styling: {
//           backgroundColor: "#FFFFFF",
//           textColor: "#111827",
//         },
//       },
//       {
//         id: "hero-1",
//         type: "hero",
//         order: 2,
//         content: {
//           title: "Bold Creative Agency",
//           subtitle: "We Make Brands Unforgettable",
//           description:
//             "Transform your vision into reality with cutting-edge design and strategy that drives results.",
//           primaryCTA: "View Our Work",
//           primaryHref: "#portfolio",
//           secondaryCTA: "Get in Touch",
//           secondaryHref: "#contact",
//         },
//         layout: {
//           contentWidth: "wide",
//           contentAlignment: "center",
//           verticalPadding: "extra-large",
//         },
//         styling: {
//           backgroundImage: {
//             url: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1920&q=80",
//             alt: "Creative workspace",
//             position: "center",
//             size: "cover",
//             parallax: true,
//           },
//           overlayColor: "#000000",
//           overlayOpacity: 0.6,
//           textColor: "#FFFFFF",
//         },
//       },
//       {
//         id: "stats-1",
//         type: "stats",
//         order: 3,
//         content: {
//           stats: [
//             { number: "500+", label: "Happy Clients" },
//             { number: "1,200", label: "Projects Completed" },
//             { number: "98%", label: "Client Satisfaction" },
//             { number: "15+", label: "Years Experience" },
//           ],
//         },
//         layout: {
//           contentWidth: "wide",
//           verticalPadding: "large",
//         },
//       },
//       {
//         id: "services-1",
//         type: "service-grid",
//         order: 4,
//         content: {
//           heading: "Our Services",
//           subheading: "Comprehensive solutions for your brand",
//           services: [
//             {
//               id: "svc-1",
//               name: "Web Design",
//               description: "Beautiful, responsive websites",
//               image:
//                 "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80",
//               price: 2500,
//             },
//             {
//               id: "svc-2",
//               name: "Branding",
//               description: "Complete brand identity packages",
//               image:
//                 "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
//               price: 3500,
//             },
//             {
//               id: "svc-3",
//               name: "Marketing",
//               description: "Data-driven marketing campaigns",
//               image:
//                 "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&q=80",
//               price: 1500,
//             },
//           ],
//         },
//         layout: {
//           contentWidth: "wide",
//           itemsPerRow: 3,
//           itemSpacing: "normal",
//           verticalPadding: "large",
//         },
//       },
//       {
//         id: "team-1",
//         type: "team",
//         order: 5,
//         content: {
//           heading: "Meet Our Team",
//           subheading: "Creative minds behind your success",
//           members: [
//             {
//               id: "team-1",
//               name: "Sarah Johnson",
//               role: "Creative Director",
//               image:
//                 "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
//               bio: "15+ years crafting memorable brand experiences",
//             },
//             {
//               id: "team-2",
//               name: "Mike Chen",
//               role: "Lead Developer",
//               image:
//                 "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
//               bio: "Full-stack wizard specializing in React & Node",
//             },
//           ],
//         },
//         layout: {
//           contentWidth: "wide",
//           itemsPerRow: 2,
//           verticalPadding: "large",
//         },
//       },
//       {
//         id: "testimonials-1",
//         type: "testimonials",
//         order: 6,
//         content: {
//           heading: "Client Success Stories",
//           subheading: "Hear what our clients say",
//           testimonials: [
//             {
//               id: "test-1",
//               name: "John Smith",
//               company: "Tech Startup Inc",
//               quote:
//                 "They transformed our brand and doubled our conversion rate!",
//               rating: 5,
//             },
//           ],
//         },
//         layout: {
//           contentWidth: "wide",
//           verticalPadding: "large",
//         },
//         styling: {
//           backgroundColor: "#F9FAFB",
//         },
//       },
//       {
//         id: "contact-map-1",
//         type: "contact-map",
//         order: 7,
//         content: {
//           heading: "Let's Create Something Amazing",
//           subheading: "Visit our studio or get in touch",
//           description: "We're here to help bring your vision to life",
//         },
//         layout: {
//           contentWidth: "wide",
//           verticalPadding: "extra-large",
//         },
//       },
//       {
//         id: "footer-1",
//         type: "footer",
//         order: 8,
//         content: {
//           companyName: "Creative Studios",
//           tagline: "Making brands unforgettable since 2010",
//           quickLinks: [
//             { label: "About", href: "/about" },
//             { label: "Services", href: "#services" },
//             { label: "Portfolio", href: "#portfolio" },
//             { label: "Contact", href: "#contact" },
//           ],
//           socialLinks: {
//             facebook: "https://facebook.com/creativestudios",
//             twitter: "https://twitter.com/creativestudios",
//             instagram: "https://instagram.com/creativestudios",
//             linkedin: "https://linkedin.com/company/creativestudios",
//           },
//           copyright: "© 2025 Creative Studios. All rights reserved.",
//         },
//         styling: {
//           backgroundColor: "#111827",
//           textColor: "#F9FAFB",
//         },
//       },
//     ],
//   },
// };

// export async function generateAiStorefront(
//   input: AiStorefrontInput,
//   providerConfig?: AiProviderConfig
// ): Promise<AiStorefrontResult> {
//   const { company, products, services, testimonials, prompt, goal, tone } =
//     input;

//   // Detect regenerate intent - if user wants completely new design
//   const regenerateKeywords = [
//     "regenerate",
//     "start fresh",
//     "fresh design",
//     "new design",
//     "completely different",
//     "completely new",
//     "start over",
//     "create new",
//     "different style",
//     "fresh approach",
//     "from scratch",
//   ];
//   const isRegenerateIntent =
//     prompt &&
//     regenerateKeywords.some((keyword) =>
//       prompt.toLowerCase().includes(keyword)
//     );

//   const effectivePreviousSpec = isRegenerateIntent ? null : input.previousSpec;
//   const effectiveConversationHistory = isRegenerateIntent
//     ? []
//     : input.conversationHistory || [];

//   const userContext = {
//     company,
//     goal,
//     tone,
//     products: products,
//     services: services,
//     testimonials: testimonials,
//     team: input.team || [],
//     posts: input.posts || [],
//     locations: input.locations || [],
//     brandColors: input.brandColors,
//     showLocation: input.showLocation ?? true,
//     showTeam: input.showTeam ?? true,
//     showTestimonials: input.showTestimonials ?? true,
//     blogEnabled: input.blogEnabled ?? false,
//     blogHasPosts: input.blogHasPosts ?? false,
//     contact: input.contact,
//     seo: input.seo,
//     adminPrompt: prompt,
//     previousSpec: effectivePreviousSpec || null,
//     isFirstMessage: effectiveConversationHistory.length === 0,
//   };

//   // Admin's prompt is the creative direction - this is what they typed in the UI
//   const userMessage =
//     `Company: ${company.name} (${company.industry || "General"})\n` +
//     `Products: ${products.length}, Services: ${services.length}, Team: ${
//       input.team?.length || 0
//     }\n\n` +
//     `ADMIN'S DESIGN REQUEST:\n"${prompt}"\n\n` +
//     (isRegenerateIntent
//       ? "IMPORTANT: Create a COMPLETELY DIFFERENT design with new colors, layout, and style. Do NOT reuse the previous design.\n\n"
//       : "") +
//     `Generate a storefront with all 9 mandatory sections. Make the design match the admin's vision above.\n\n` +
//     `Company Data:\n${JSON.stringify(userContext, null, 2)}`;

//   const messages: ChatMessage[] = [
//     { role: "system", content: STOREFRONT_SYSTEM_PROMPT },
//   ];

//   // Add conversation history if available (skip if regenerating)
//   if (effectiveConversationHistory.length > 0) {
//     for (const msg of effectiveConversationHistory) {
//       messages.push({
//         role: msg.role as "user" | "assistant",
//         content: msg.content,
//       });
//     }
//   }

//   // Add current user request
//   messages.push({
//     role: "user",
//     content: userMessage,
//   });

//   let spec: AiFrontstoreSpec | null = null;
//   let assistantMessage: string | null = null;
//   let shouldAsk = false;
//   let raw: unknown = null;
//   let usedModel = false;

//   // Log regenerate mode if active
//   if (isRegenerateIntent) {
//     console.log(
//       "[AI Storefront] REGENERATE MODE: Creating fresh design, ignoring previous spec"
//     );
//   }

//   try {
//     // Use unknown instead of any to force type checking later
//     raw = await callStorefrontModel<unknown>(
//       messages,
//       z.unknown(),
//       providerConfig
//     );

//     console.log("[AI Storefront] Raw model response received:", {
//       hasRaw: !!raw,
//       rawType: typeof raw,
//       rawKeys:
//         raw && typeof raw === "object"
//           ? Object.keys(raw as Record<string, unknown>)
//           : [],
//     });

//     if (raw && typeof raw === "object") {
//       const obj = raw as Record<string, unknown>;

//       console.log("[AI Storefront] Parsing model response:", {
//         hasSpec: !!obj.spec,
//         hasExplanation: !!obj.explanation,
//         hasAssistantMessage: !!obj.assistantMessage,
//         hasShouldAsk: !!obj.shouldAsk,
//       });

//       if (obj.spec) {
//         spec = normalizeModelOutputToSpec(obj.spec, input);
//         usedModel = true;
//       } else {
//         // Model might have returned a top-level spec directly
//         spec = normalizeModelOutputToSpec(raw, input);
//         usedModel = true;
//       }
//       // Extract explanation from new format
//       if (typeof obj.explanation === "string") {
//         assistantMessage = obj.explanation as string;
//       }
//       // Legacy support for old format
//       if (typeof obj.assistantMessage === "string")
//         assistantMessage = obj.assistantMessage as string;
//       if (typeof obj.shouldAsk === "boolean")
//         shouldAsk = obj.shouldAsk as boolean;
//     } else {
//       console.warn(
//         "[AI Storefront] Model returned invalid response type or null"
//       );
//     }
//   } catch (error) {
//     console.error("[AI Storefront] Model call or validation failed:", error);
//     console.error(
//       "[AI Storefront] Error details:",
//       JSON.stringify(error, null, 2)
//     );

//     // Check if this is a quota/billing error
//     if (error && typeof error === "object" && "code" in error) {
//       const err = error as {
//         code?: string;
//         details?: string;
//         status?: number;
//         message?: string;
//       };
//       console.error(
//         `[AI Storefront] Error code: ${err.code}, status: ${err.status}, message: ${err.message}`
//       );

//       if (err.code === "insufficient_quota" || err.status === 429) {
//         assistantMessage =
//           "⚠️ OpenAI API quota exceeded. Please add billing credits at https://platform.openai.com/account/billing to continue using AI features. Using fallback design for now.";
//       } else if (err.status === 401) {
//         assistantMessage =
//           "⚠️ OpenAI API authentication failed. Please check your API key in Settings. Using fallback design for now.";
//       } else if (err.status === 404) {
//         assistantMessage =
//           "⚠️ The configured AI model is not available. Please check your model settings. Using fallback design for now.";
//       } else if (err.status && err.status >= 500) {
//         assistantMessage =
//           "⚠️ OpenAI API is experiencing issues. Please try again in a moment. Using fallback design for now.";
//       } else {
//         assistantMessage = `⚠️ AI generation failed: ${
//           err.message || err.code || "Unknown error"
//         }. Using fallback design for now.`;
//       }
//     } else if (error instanceof Error) {
//       assistantMessage = `⚠️ AI generation failed: ${error.message}. Using fallback design for now.`;
//     } else {
//       assistantMessage =
//         "⚠️ AI generation failed with an unknown error. Using fallback design for now.";
//     }
//   }

//   console.log(
//     `[AI Storefront] Model used: ${usedModel}, Has spec: ${!!spec}, Should ask: ${shouldAsk}`
//   );

//   if (!spec && !shouldAsk) {
//     // If model didn't return a spec and is not asking a question, fall back to deterministic spec
//     console.warn(
//       "[AI Storefront] Falling back to deterministic spec - AI model did not generate valid output"
//     );
//     spec = buildFallbackSpec(input);

//     // Set a clear message if we haven't already set one
//     if (!assistantMessage) {
//       assistantMessage =
//         "⚠️ Unable to generate custom AI design. Using standard template instead. Please check your AI provider configuration in Settings > AI Provider.";
//     }
//   }

//   const safety = runSafetyChecks(spec as AiFrontstoreSpec);

//   // Validate WCAG compliance and auto-fix if needed
//   if (spec && !shouldAsk) {
//     const wcagValidation = validateWCAGCompliance(spec);
//     if (!wcagValidation.valid) {
//       console.log("[WCAG] Applying accessibility fixes to generated design");
//       spec = wcagValidation.fixes;
//     }
//   }

//   // Provider-agnostic validation: ensure all mandatory sections exist
//   if (spec && !shouldAsk) {
//     spec = ensureMandatorySections(spec, input);
//   }

//   return {
//     spec,
//     assistantMessage:
//       assistantMessage ||
//       (usedModel
//         ? "AI generated a storefront preview."
//         : "Generated standard template."),
//     shouldAsk,
//     safety,
//     usedModel,
//   } as AiStorefrontResult;
// }

// function normalizeModelOutputToSpec(
//   raw: unknown,
//   input: AiStorefrontInput
// ): AiFrontstoreSpec {
//   // Safe extraction of raw object
//   const rawObj =
//     raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

//   const rawMeta =
//     rawObj.meta && typeof rawObj.meta === "object"
//       ? (rawObj.meta as Record<string, unknown>)
//       : {};

//   // Extract all meta fields from AI response, with fallbacks
//   const meta = {
//     layoutStyle:
//       (rawMeta.layoutStyle as AiFrontstoreSpec["meta"]["layoutStyle"]) ||
//       "hero-left",
//     tone: input.tone,
//     primaryColor:
//       (rawMeta.primaryColor as string) ||
//       input.brandColors?.primary ||
//       "#2563EB",
//     secondaryColor:
//       (rawMeta.secondaryColor as string) ||
//       input.brandColors?.secondary ||
//       "#F97316",
//     accentColor:
//       (rawMeta.accentColor as string) || input.brandColors?.accent || "#10B981",
//     backgroundColor: (rawMeta.backgroundColor as string) || "#F8FAFC",
//     textColor: (rawMeta.textColor as string) || "#0F172A",
//     heroSize:
//       (rawMeta.heroSize as AiFrontstoreSpec["meta"]["heroSize"]) || "compact",
//     buttonStyle:
//       (rawMeta.buttonStyle as AiFrontstoreSpec["meta"]["buttonStyle"]) ||
//       "solid",
//     cornerStyle:
//       (rawMeta.cornerStyle as AiFrontstoreSpec["meta"]["cornerStyle"]) ||
//       "soft",
//     // New enhanced fields - pass through from AI response with proper types
//     typography:
//       rawMeta.typography && typeof rawMeta.typography === "object"
//         ? (rawMeta.typography as AiFrontstoreSpec["meta"]["typography"])
//         : undefined,
//     spacing:
//       rawMeta.spacing && typeof rawMeta.spacing === "object"
//         ? (rawMeta.spacing as AiFrontstoreSpec["meta"]["spacing"])
//         : undefined,
//     grid:
//       rawMeta.grid && typeof rawMeta.grid === "object"
//         ? (rawMeta.grid as AiFrontstoreSpec["meta"]["grid"])
//         : undefined,
//     effects:
//       rawMeta.effects && typeof rawMeta.effects === "object"
//         ? (rawMeta.effects as AiFrontstoreSpec["meta"]["effects"])
//         : undefined,
//     styleFamily: rawMeta.styleFamily as AiFrontstoreSpec["meta"]["styleFamily"],
//     backgroundImage:
//       rawMeta.backgroundImage && typeof rawMeta.backgroundImage === "object"
//         ? (rawMeta.backgroundImage as AiFrontstoreSpec["meta"]["backgroundImage"])
//         : undefined,
//     backgroundVideo:
//       rawMeta.backgroundVideo && typeof rawMeta.backgroundVideo === "object"
//         ? (rawMeta.backgroundVideo as AiFrontstoreSpec["meta"]["backgroundVideo"])
//         : undefined,
//     overlayColor: rawMeta.overlayColor as string | undefined,
//     overlayOpacity:
//       typeof rawMeta.overlayOpacity === "number"
//         ? rawMeta.overlayOpacity
//         : undefined,
//     animations: Array.isArray(rawMeta.animations)
//       ? (rawMeta.animations as string[])
//       : undefined,
//     navigation:
//       rawMeta.navigation && typeof rawMeta.navigation === "object"
//         ? (rawMeta.navigation as AiFrontstoreSpec["meta"]["navigation"])
//         : undefined,
//     seo:
//       rawMeta.seo && typeof rawMeta.seo === "object"
//         ? (rawMeta.seo as AiFrontstoreSpec["meta"]["seo"])
//         : undefined,
//   };

//   // Extract sections
//   const rawSections: unknown[] = Array.isArray(rawObj?.sections)
//     ? rawObj.sections
//     : [];

//   // If AI provided sections, use them directly (pass through)
//   let sections: AiFrontstoreSection[];
//   if (rawSections.length > 0) {
//     sections = rawSections.map((sec, idx) => {
//       const secObj =
//         sec && typeof sec === "object" ? (sec as Record<string, unknown>) : {};
//       const validTypes = [
//         "announcement-bar",
//         "header",
//         "hero",
//         "highlights",
//         "product-grid",
//         "service-grid",
//         "portfolio",
//         "posts",
//         "team",
//         "testimonials",
//         "stats",
//         "faq",
//         "contact",
//         "contact-map",
//         "cta-band",
//         "footer",
//       ] as const;
//       const sectionType =
//         typeof secObj.type === "string" &&
//         validTypes.includes(secObj.type as (typeof validTypes)[number])
//           ? (secObj.type as (typeof validTypes)[number])
//           : "hero";
//       return {
//         id: (secObj.id as string) || `section-${idx}`,
//         className: secObj.className as string | undefined,
//         type: sectionType,
//         order: typeof secObj.order === "number" ? secObj.order : idx,
//         content: (secObj.content && typeof secObj.content === "object"
//           ? secObj.content
//           : {}) as Record<
//           string,
//           | string
//           | number
//           | boolean
//           | string[]
//           | Record<string, unknown>[]
//           | Record<string, unknown>
//           | undefined
//         >,
//         layout: (secObj.layout && typeof secObj.layout === "object"
//           ? secObj.layout
//           : undefined) as
//           | Record<string, string | number | boolean | undefined>
//           | undefined,
//         styling: (secObj.styling && typeof secObj.styling === "object"
//           ? secObj.styling
//           : undefined) as
//           | Record<string, string | number | boolean | undefined>
//           | undefined,
//       };
//     });
//   } else {
//     // Fallback: generate default sections if AI didn't provide any
//     sections = generateDefaultSections(input);
//   }

//   return { version: 1, meta, sections };
// }

// // Helper function to generate fallback sections
// function generateDefaultSections(
//   input: AiStorefrontInput
// ): AiFrontstoreSection[] {
//   const { company, products, services } = input;
//   const hasProducts = products.length > 0;
//   const hasServices = services.length > 0;
//   const isErpSaas =
//     (company.industry || "").toLowerCase().includes("erp") ||
//     (company.industry || "").toLowerCase().includes("saas");

//   let order = 0;
//   const sections: AiFrontstoreSection[] = [];

//   // Hero section
//   sections.push({
//     id: "hero",
//     type: "hero",
//     order: order++,
//     content: {
//       title: company.name,
//       subtitle: company.slogan || "",
//       description:
//         company.description ||
//         (isErpSaas
//           ? "All-in-one AI-driven ERP platform to help small businesses streamline operations."
//           : "Discover our products and services tailored to your needs."),
//       primaryCTA: isErpSaas
//         ? "View Plans"
//         : hasProducts
//         ? "Browse Products"
//         : "Explore Services",
//       primaryHref: isErpSaas
//         ? "#pricing"
//         : hasProducts
//         ? "#products"
//         : "#services",
//       secondaryCTA: "Contact Us",
//       secondaryHref: "#contact",
//     },
//   });

//   if (hasProducts) {
//     sections.push({
//       id: "product-grid",
//       type: "product-grid",
//       order: order++,
//       content: {
//         heading: "Featured Products",
//         subheading: "Curated items from our catalog",
//       },
//     });
//   }

//   if (hasServices) {
//     sections.push({
//       id: "service-grid",
//       type: "service-grid",
//       order: order++,
//       content: {
//         heading: "Services",
//         subheading: "How we can help you",
//       },
//     });
//   }

//   sections.push({
//     id: "testimonials",
//     type: "testimonials",
//     order: order++,
//     content: {
//       heading: "What our customers say",
//       subheading: "Trusted by our community",
//     },
//   });

//   sections.push({
//     id: "contact",
//     type: "contact",
//     order: order++,
//     content: {
//       heading: "Get in touch",
//       subheading: "We'd love to hear from you",
//     },
//   });

//   return sections;
// }

// function buildFallbackSpec(input: AiStorefrontInput): AiFrontstoreSpec {
//   const { company, products, services } = input;

//   let order = 0;

//   // ONLY THE 9 MANDATORY SECTIONS - NO OPTIONAL SECTIONS
//   const sections: AiFrontstoreSection[] = [];

//   // 1. Announcement Bar
//   sections.push({
//     id: "announcement-bar",
//     type: "announcement-bar",
//     order: order++,
//     content: {
//       message: "Welcome to " + company.name,
//       href: "#hero",
//     },
//   });

//   // 2. Header
//   sections.push({
//     id: "header",
//     type: "header",
//     order: order++,
//     content: {
//       logo: company.name,
//       navigation: [
//         { label: "Home", href: "#hero" },
//         { label: "Features", href: "#features" },
//         { label: "Case Studies", href: "#case-studies" },
//         { label: "Testimonials", href: "#testimonials" },
//         { label: "Contact", href: "#cta-band" },
//       ],
//     },
//   });

//   // 3. Hero
//   sections.push({
//     id: "hero",
//     type: "hero",
//     order: order++,
//     content: {
//       title: company.name,
//       subtitle: company.slogan || "Your trusted partner",
//       description:
//         company.description ||
//         "Discover our products and services tailored to your needs.",
//       primaryCTA: "Get Started",
//       primaryHref: "#cta-band",
//       secondaryCTA: "Learn More",
//       secondaryHref: "#features",
//     },
//   });

//   // 4. Stats
//   sections.push({
//     id: "stats",
//     type: "stats",
//     order: order++,
//     content: {
//       heading: "By the numbers",
//       subheading: `Snapshot of ${company.name}'s success.`,
//       items: [
//         { label: "Products", value: String(products.length) },
//         { label: "Services", value: String(services.length) },
//         { label: "Happy Clients", value: "100+" },
//         { label: "Projects Completed", value: "500+" },
//       ],
//     },
//   });

//   // 5. Features
//   sections.push({
//     id: "features",
//     type: "features",
//     order: order++,
//     content: {
//       heading: "Why Choose Us",
//       subheading: "Everything you need in one place",
//       items: [
//         {
//           title: "Quality Products",
//           description: "We offer premium products tailored to your needs.",
//           icon: "star",
//         },
//         {
//           title: "Expert Services",
//           description: "Our team delivers professional services with care.",
//           icon: "users",
//         },
//         {
//           title: "Customer Support",
//           description: "24/7 support to help you succeed.",
//           icon: "support",
//         },
//       ],
//     },
//   });

//   // 6. Case Studies
//   sections.push({
//     id: "case-studies",
//     type: "case studies",
//     order: order++,
//     content: {
//       heading: "Success Stories",
//       subheading: "See how we've helped our clients achieve their goals",
//       items: [
//         {
//           title: "Digital Transformation",
//           description:
//             "Helped a local business increase efficiency by 200% through digital solutions.",
//           image: "/placeholder-case-study.jpg",
//         },
//         {
//           title: "Revenue Growth",
//           description:
//             "Assisted a client in achieving 150% revenue growth in 12 months.",
//           image: "/placeholder-case-study.jpg",
//         },
//       ],
//     },
//   });

//   // 7. Testimonials
//   sections.push({
//     id: "testimonials",
//     type: "testimonials",
//     order: order++,
//     content: {
//       heading: "What our customers say",
//       subheading: "Trusted by our community",
//       ctaLabel: "Share your experience",
//       ctaHref: "#cta-band",
//     },
//   });

//   // 8. CTA Band
//   sections.push({
//     id: "cta-band",
//     type: "cta-band",
//     order: order++,
//     content: {
//       heading: `Ready to work with ${company.name}?`,
//       subheading: "Take the next step and reach out today.",
//       buttonLabel: "Get in touch",
//       buttonHref: "#footer",
//     },
//   });

//   // 9. Footer
//   sections.push({
//     id: "footer",
//     type: "footer",
//     order: order++,
//     content: {
//       companyName: company.name,
//       description: company.description || "Your trusted partner",
//       links: [
//         { label: "About", href: "#hero" },
//         { label: "Services", href: "#features" },
//         { label: "Contact", href: "#cta-band" },
//       ],
//     },
//   });

//   const spec: AiFrontstoreSpec = {
//     version: 1,
//     meta: {
//       layoutStyle: "hero-left",
//       tone: input.tone,
//       primaryColor: "#2563EB",
//       secondaryColor: "#F97316",
//       accentColor: "#10B981",
//       backgroundColor: "#F8FAFC",
//       textColor: "#0F172A",
//       heroSize: "compact",
//       buttonStyle: "solid",
//       cornerStyle: "soft",
//       // include any explicit SEO passed into the generator input as fallback
//       seo: input.seo
//         ? {
//             metaTitle:
//               typeof input.seo.title === "string" ? input.seo.title : undefined,
//             metaDescription:
//               typeof input.seo.description === "string"
//                 ? input.seo.description
//                 : undefined,
//             keywords: Array.isArray(input.seo.keywords)
//               ? input.seo.keywords.filter((k) => typeof k === "string")
//               : undefined,
//           }
//         : undefined,
//     },
//     sections,
//   };

//   return spec;
// }

// export function runSafetyChecks(
//   spec: AiFrontstoreSpec
// ): AiStorefrontResult["safety"] {
//   const text = JSON.stringify(spec).toLowerCase();

//   // Create regex for whole words only
//   const hits = FORBIDDEN_KEYWORDS.filter((keyword) => {
//     // Escape special regex characters if necessary, though your list looks safe
//     const regex = new RegExp(`\\b${keyword}\\b`, "i");
//     return regex.test(text);
//   });

//   if (hits.length > 0) {
//     return {
//       blocked: true,
//       reasons: [
//         "Generated content contains disallowed topics: " + hits.join(", "),
//       ],
//     };
//   }

//   return { blocked: false };
// }

// /**
//  * Validate WCAG compliance for generated spec and auto-fix violations
//  */
// export function validateWCAGCompliance(spec: AiFrontstoreSpec): {
//   valid: boolean;
//   violations: string[];
//   fixes: AiFrontstoreSpec;
// } {
//   const violations: string[] = [];
//   const fixes: AiFrontstoreSpec = JSON.parse(JSON.stringify(spec)); // Deep clone

//   // Check meta-level colors
//   const bgColor = fixes.meta.backgroundColor || "#FFFFFF";
//   const textColor = fixes.meta.textColor || "#111827";

//   const textContrast = getContrastRatio(textColor, bgColor);

//   if (!textContrast.passesAA) {
//     violations.push(
//       `Global text contrast ${textContrast.ratio}:1 fails WCAG AA (needs 4.5:1)`
//     );
//     // Auto-fix: Make text more contrasted
//     fixes.meta.textColor = makeAccessible(textColor, bgColor, "AA");
//     console.log(
//       `[WCAG Fix] Adjusted text color from ${textColor} to ${fixes.meta.textColor}`
//     );
//   }

//   // Check primary color contrast
//   const primaryContrast = getContrastRatio(
//     fixes.meta.primaryColor || "#2563EB",
//     bgColor
//   );
//   if (!primaryContrast.passesAA) {
//     violations.push(
//       `Primary color contrast ${primaryContrast.ratio}:1 fails WCAG AA`
//     );
//     fixes.meta.primaryColor = makeAccessible(
//       fixes.meta.primaryColor || "#2563EB",
//       bgColor,
//       "AA"
//     );
//     console.log(
//       `[WCAG Fix] Adjusted primary color to ${fixes.meta.primaryColor}`
//     );
//   }

//   // Check secondary color contrast
//   const secondaryContrast = getContrastRatio(
//     fixes.meta.secondaryColor || "#F97316",
//     bgColor
//   );
//   if (!secondaryContrast.passesAA) {
//     violations.push(
//       `Secondary color contrast ${secondaryContrast.ratio}:1 fails WCAG AA`
//     );
//     fixes.meta.secondaryColor = makeAccessible(
//       fixes.meta.secondaryColor || "#F97316",
//       bgColor,
//       "AA"
//     );
//     console.log(
//       `[WCAG Fix] Adjusted secondary color to ${fixes.meta.secondaryColor}`
//     );
//   }

//   // Check section-specific styling
//   fixes.sections.forEach((section, index) => {
//     if (section.styling?.backgroundColor && section.styling?.textColor) {
//       const textColor = String(section.styling.textColor);
//       const bgColor = String(section.styling.backgroundColor);
//       const sectionContrast = getContrastRatio(textColor, bgColor);

//       if (!sectionContrast.passesAA) {
//         violations.push(
//           `Section ${section.id} (${section.type}) text contrast ${sectionContrast.ratio}:1 fails WCAG AA`
//         );

//         // Auto-fix: Adjust section text color
//         fixes.sections[index].styling!.textColor = makeAccessible(
//           textColor,
//           bgColor,
//           "AA"
//         );

//         console.log(
//           `[WCAG Fix] Adjusted section ${section.id} text color to ${
//             fixes.sections[index].styling!.textColor
//           }`
//         );
//       }
//     }
//   });

//   // Log summary
//   if (violations.length > 0) {
//     console.warn(
//       `[WCAG Validation] Found ${violations.length} accessibility violations:`
//     );
//     violations.forEach((v) => console.warn(`  - ${v}`));
//     console.log(`[WCAG Validation] Applied ${violations.length} auto-fixes`);
//   } else {
//     console.log("[WCAG Validation] ✓ All colors pass WCAG AA standards");
//   }

//   return {
//     valid: violations.length === 0,
//     violations,
//     fixes,
//   };
// }
