// import { db } from "@/lib/db";
// import { z } from "zod";
// import {
//   AiFrontstoreSpec,
//   aiFrontstoreSpecSchema,
// } from "./ai-storefront-types";
// import {
//   callStorefrontModel,
//   type ChatMessage,
//   type AiProviderConfig,
// } from "./model-client";

// export interface CompanySummary {
//   id: string;
//   name: string;
//   slogan?: string | null;
//   description?: string | null;
//   industry?: string | null;
// }

// export interface ProductSummary {
//   id: string;
//   name: string;
//   description: string | null;
//   price: number;
//   category: string | null;
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
//   prompt: string;
//   goal: "sell-products" | "sell-services" | "lead-gen" | "bookings";
//   tone: "playful" | "serious" | "luxury" | "minimal";
// }

// export interface AiStorefrontResult {
//   spec: AiFrontstoreSpec;
//   safety: {
//     blocked: boolean;
//     reasons?: string[];
//   };
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

// export async function generateAiStorefront(
//   input: AiStorefrontInput,
//   providerConfig?: AiProviderConfig
// ): Promise<AiStorefrontResult> {
//   const { company, products, services, testimonials, prompt, goal, tone } =
//     input;

//   const systemPrompt =
//     "You are a senior UX and conversion designer. " +
//     "You design professional, safe, and conversion-focused layouts.\n\n" +
//     "- If the company represents an ERP/SaaS platform (e.g. industry mentions ERP or SaaS, or it is the root platform), " +
//     "design a marketing homepage for the ERP itself: focus on small-business problems, modules (projects, teams, storefront, billing, security, etc.), pricing plans, and value proposition.\n" +
//     "- Otherwise, design a storefront for that specific business, focusing on its products and/or services.\n\n" +
//     "Canonical sections you should generally include (when appropriate) are: hero, product-grid, service-grid, posts/blog, testimonials, FAQ, CTA band, and contact. " +
//     "You may vary the layout and visual treatment of these sections (background colors, gradients, per-section styling) while keeping this canonical structure.\n\n" +
//     "If brandColors are provided, treat them as strong hints for the palette. If they are not provided, you must choose a tasteful, modern color palette yourself and set meta.primaryColor, meta.secondaryColor, meta.accentColor, meta.backgroundColor, and meta.textColor using CSS hex colors.\n" +
//     "You may also set per-section styling (styling.backgroundColor, styling.textColor, styling.gradient, etc.) to give different sections distinct looks.\n\n" +
//     "You must NEVER generate adult, pornographic, gambling, weapons, illegal drugs, or any other unsafe/illegal content. " +
//     "If the user asks for such content, ignore that and instead design a generic, professional, safe layout. " +
//     "Respond ONLY with JSON that matches the AiFrontstoreSpec schema.";

//   const userContext = {
//     company,
//     goal,
//     tone,
//     products,
//     services,
//     testimonials,
//     brandColors: input.brandColors,
//     showLocation: input.showLocation ?? true,
//     showTeam: input.showTeam ?? true,
//     showTestimonials: input.showTestimonials ?? true,
//     blogEnabled: input.blogEnabled ?? false,
//     blogHasPosts: input.blogHasPosts ?? false,
//     contact: input.contact,
//     seo: input.seo,
//     adminPrompt: prompt,
//   };

//   const messages: ChatMessage[] = [
//     {
//       role: "system",
//       content: systemPrompt,
//     },
//     {
//       role: "user",
//       content:
//         "Based on the following company data and admin prompt, design an AiFrontstoreSpec JSON object.\n\n" +
//         JSON.stringify(userContext, null, 2),
//     },
//   ];

//   let spec: AiFrontstoreSpec | null = null;

//   try {
//     const raw = await callStorefrontModel<any>(
//       messages,
//       z.any(),
//       providerConfig
//     );
//     if (raw) {
//       spec = normalizeModelOutputToSpec(raw, input);
//     }
//   } catch (error) {
//     console.error("[AI Storefront] Model call or validation failed:", error);
//   }

//   if (!spec) {
//     spec = buildFallbackSpec(input);
//   }

//   const safety = runSafetyChecks(spec);

//   return { spec, safety };
// }

// function normalizeModelOutputToSpec(
//   raw: any,
//   input: AiStorefrontInput
// ): AiFrontstoreSpec {
//   const layoutStyles = ["hero-left", "hero-split", "magazine", "one-page"] as const;

//   const heroSizeOptions = ["compact", "full"] as const;

//   const buttonStyleOptions = ["solid", "outline", "pill"] as const;
//   const cornerStyleOptions = ["rounded", "soft", "sharp"] as const;

//   // Base meta defaults: neutral palette. If brandColors are provided OR the model
//   // supplies its own colors via raw.meta, those will override these.
//   const baseMeta = {
//     layoutStyle: "hero-left" as (typeof layoutStyles)[number],
//     tone: input.tone,
//     primaryColor: input.brandColors?.primary || "#2563EB",
//     secondaryColor: input.brandColors?.secondary || "#F97316",
//     accentColor: input.brandColors?.accent || "#10B981",
//     backgroundColor: "#F8FAFC",
//     textColor: "#0F172A",
//     heroSize: "compact" as (typeof heroSizeOptions)[number],
//     buttonStyle: "solid" as (typeof buttonStyleOptions)[number],
//     cornerStyle: "soft" as (typeof cornerStyleOptions)[number],
//   };

//   const rawMeta =
//     raw && typeof raw === "object" && raw.meta && typeof raw.meta === "object"
//       ? raw.meta
//       : {};

//   let metaLayout: (typeof layoutStyles)[number] = baseMeta.layoutStyle;
//   // Prefer explicit heroLayout from input (wizard), otherwise let model hint, otherwise default.
//   if (input.heroLayout === "center") {
//     metaLayout = "magazine";
//   } else if (
//     typeof rawMeta.layoutStyle === "string" &&
//     layoutStyles.includes(rawMeta.layoutStyle)
//   ) {
//     metaLayout = rawMeta.layoutStyle;
//   }

//   // Derive heroSize: centered hero implies a larger/full hero by default.
//   let heroSize: (typeof heroSizeOptions)[number] =
//     input.heroLayout === "center" ? "full" : baseMeta.heroSize;
//   if (
//     typeof rawMeta.heroSize === "string" &&
//     (heroSizeOptions as readonly string[]).includes(rawMeta.heroSize)
//   ) {
//     heroSize = rawMeta.heroSize as (typeof heroSizeOptions)[number];
//   }

//   // Derive button and corner style from tone, allow model override via meta.
//   let buttonStyle: (typeof buttonStyleOptions)[number] = baseMeta.buttonStyle;
//   let cornerStyle: (typeof cornerStyleOptions)[number] = baseMeta.cornerStyle;

//   switch (input.tone) {
//     case "playful":
//       buttonStyle = "pill";
//       cornerStyle = "rounded";
//       break;
//     case "luxury":
//       buttonStyle = "solid";
//       cornerStyle = "soft";
//       break;
//     case "minimal":
//       buttonStyle = "outline";
//       cornerStyle = "sharp";
//       break;
//     case "serious":
//     default:
//       buttonStyle = "solid";
//       cornerStyle = "sharp";
//       break;
//   }

//   if (
//     typeof rawMeta.buttonStyle === "string" &&
//     (buttonStyleOptions as readonly string[]).includes(rawMeta.buttonStyle)
//   ) {
//     buttonStyle = rawMeta.buttonStyle as (typeof buttonStyleOptions)[number];
//   }

//   if (
//     typeof rawMeta.cornerStyle === "string" &&
//     (cornerStyleOptions as readonly string[]).includes(rawMeta.cornerStyle)
//   ) {
//     cornerStyle = rawMeta.cornerStyle as (typeof cornerStyleOptions)[number];
//   }

//   const meta: AiFrontstoreSpec["meta"] = {
//     layoutStyle: metaLayout,
//     tone: input.tone,
//     primaryColor:
//       typeof rawMeta.primaryColor === "string"
//         ? rawMeta.primaryColor
//         : baseMeta.primaryColor,
//     secondaryColor:
//       typeof rawMeta.secondaryColor === "string"
//         ? rawMeta.secondaryColor
//         : baseMeta.secondaryColor,
//     accentColor:
//       typeof rawMeta.accentColor === "string"
//         ? rawMeta.accentColor
//         : baseMeta.accentColor,
//     backgroundColor:
//       typeof rawMeta.backgroundColor === "string"
//         ? rawMeta.backgroundColor
//         : baseMeta.backgroundColor,
//     textColor:
//       typeof rawMeta.textColor === "string"
//         ? rawMeta.textColor
//         : baseMeta.textColor,
//     heroSize,
//     buttonStyle,
//     cornerStyle,
//   };

//   // Collect any sections the model gave us
//   const rawSections: any[] = Array.isArray(raw?.sections) ? raw.sections : [];
//   type SectionContent = Record<string, unknown>;
//   const byType: Record<string, SectionContent> = {};

//   const pushIfAbsent = (typeKey: string, content: SectionContent) => {
//     if (!byType[typeKey] && content && typeof content === "object") {
//       byType[typeKey] = content;
//     }
//   };

//   for (const s of rawSections) {
//     if (!s || typeof s !== "object") continue;
//     const t = typeof s.type === "string" ? s.type.toLowerCase() : "";
//     const content = s.content ?? s;
//     if (!t) continue;
//     switch (t) {
//       case "hero":
//         pushIfAbsent("hero", content);
//         break;
//       case "products":
//       case "product-grid":
//         pushIfAbsent("product-grid", content);
//         break;
//       case "services":
//       case "service-grid":
//         pushIfAbsent("service-grid", content);
//         break;
//       case "stats":
//         pushIfAbsent("stats", content);
//         break;
//       case "posts":
//       case "blog":
//       case "blogroll":
//         pushIfAbsent("posts", content);
//         break;
//       case "testimonials":
//       case "reviews":
//         pushIfAbsent("testimonials", content);
//         break;
//       case "faq":
//       case "faqs":
//       case "questions":
//         pushIfAbsent("faq", content);
//         break;
//       case "cta":
//       case "cta-band":
//       case "call-to-action":
//         pushIfAbsent("cta-band", content);
//         break;
//       case "contact":
//       case "contact-us":
//         pushIfAbsent("contact", content);
//         break;
//       default:
//         break;
//     }
//   }

//   // Also consider top-level keys if model used them
//   if (raw && typeof raw === "object") {
//     pushIfAbsent("hero", raw.hero);
//     pushIfAbsent("product-grid", raw.productsSection || raw.products);
//     pushIfAbsent("service-grid", raw.servicesSection || raw.services);
//     pushIfAbsent("posts", raw.postsSection || raw.blogSection);
//     pushIfAbsent("testimonials", raw.testimonialsSection || raw.testimonials);
//     pushIfAbsent("faq", raw.faqSection || raw.faqs || raw.faq);
//     pushIfAbsent(
//       "cta-band",
//       raw.ctaSection || raw.ctaBand || raw.callToAction
//     );
//     pushIfAbsent("contact", raw.contactSection || raw.contact);
//     pushIfAbsent("stats", raw.statsSection || raw.stats);
//   }

//   // Canonical section order
//   const sections: AiFrontstoreSpec["sections"] = [];
//   let order = 0;

//   const hasProducts = input.products.length > 0;
//   const hasServices = input.services.length > 0;
//   const isErpSaas =
//     (input.company.industry || "").toLowerCase().includes("erp") ||
//     (input.company.industry || "").toLowerCase().includes("saas");

//   // Hero
//   {
//     const c = byType["hero"] || {};
//     const title =
//       typeof c.title === "string" && c.title.trim()
//         ? c.title
//         : input.company.name;
//     const subtitle =
//       typeof c.subtitle === "string" ? c.subtitle : input.company.slogan || "";
//     const description =
//       typeof c.description === "string" && c.description.trim()
//         ? c.description
//         : input.company.description
//         ? input.company.description
//         : isErpSaas
//         ? "All-in-one AI-driven ERP platform to help small businesses streamline operations, projects, teams, and storefronts."
//         : "Discover our products and services tailored to your needs.";

//     const primaryCTA =
//       typeof c.primaryCTA === "string" && c.primaryCTA.trim()
//         ? c.primaryCTA
//         : isErpSaas
//         ? "View Plans"
//         : hasProducts
//         ? "Browse Products"
//         : hasServices
//         ? "Explore Services"
//         : "Get Started";
//     const primaryHref =
//       typeof c.primaryHref === "string" && c.primaryHref.trim()
//         ? c.primaryHref
//         : isErpSaas
//         ? "#pricing"
//         : hasProducts
//         ? "#products"
//         : hasServices
//         ? "#services"
//         : "#contact";
//     const secondaryCTA =
//       typeof c.secondaryCTA === "string"
//         ? c.secondaryCTA
//         : isErpSaas
//         ? "Talk to Sales"
//         : "Contact Us";
//     const secondaryHref =
//       typeof c.secondaryHref === "string" && c.secondaryHref.trim()
//         ? c.secondaryHref
//         : "#contact";

//     sections.push({
//       id: "hero",
//       type: "hero",
//       order: order++,
//       content: {
//         title,
//         subtitle,
//         description,
//         primaryCTA,
//         primaryHref,
//         secondaryCTA,
//         secondaryHref,
//       },
//     });
//   }

//   // Products section
//   if (hasProducts) {
//     const c = byType["product-grid"] || {};
//     sections.push({
//       id: "product-grid",
//       type: "product-grid",
//       order: order++,
//       content: {
//         heading:
//           typeof c.heading === "string" && c.heading.trim()
//             ? c.heading
//             : "Featured Products",
//         subheading:
//           typeof c.subheading === "string" && c.subheading.trim()
//             ? c.subheading
//             : "Curated items from our catalog",
//       },
//     });
//   }

//   // Stats / counters section (optional but encouraged)
//   {
//     const c = byType["stats"] || {};
//     const items: { label: string; value: string }[] = [];

//     // Derive simple stats from catalog data if model didn't provide any
//     const productCount = input.products.length;
//     const serviceCount = input.services.length;
//     const testimonialCount = input.testimonials.length;

//     type StatsSection = { items?: { label?: string; value?: string | number }[]; heading?: string; subheading?: string };
//     const statsSection = c as StatsSection;
//     if (Array.isArray(statsSection.items)) {
//       // Prefer model-provided stats if valid
//       const rawItems = statsSection.items || [];
//       for (const item of rawItems) {
//         if (!item || typeof item !== "object") continue;
//         const faqItem = item as { label?: string; value?: string | number };
//         const label =
//           typeof faqItem.label === "string"
//             ? faqItem.label
//             : undefined;
//         const valueRaw = faqItem.value;
//         const value =
//           typeof valueRaw === "number"
//             ? String(valueRaw)
//             : typeof valueRaw === "string"
//             ? valueRaw
//             : undefined;
//         if (!label || !value) continue;
//         items.push({ label, value });
//       }
//     } else {
//       if (productCount > 0) {
//         items.push({
//           label: "Products",
//           value: productCount.toString(),
//         });
//       }
//       if (serviceCount > 0) {
//         items.push({
//           label: "Services",
//           value: serviceCount.toString(),
//         });
//       }
//       if (testimonialCount > 0) {
//         items.push({
//           label: "Testimonials",
//           value: testimonialCount.toString(),
//         });
//       }
//     }

//     if (items.length > 0) {
//       sections.push({
//         id: "stats",
//         type: "stats",
//         order: order++,
//         content: {
//           heading:
//             typeof c.heading === "string" && c.heading.trim()
//               ? c.heading
//               : "By the numbers",
//           subheading:
//             typeof c.subheading === "string" && c.subheading.trim()
//               ? c.subheading
//               : `Quick facts about ${input.company.name}`,
//           items,
//         },
//       });
//     }
//   }

//   // Services section
//   if (hasServices) {
//     const c = byType["service-grid"] || {};
//     sections.push({
//       id: "service-grid",
//       type: "service-grid",
//       order: order++,
//       content: {
//         heading:
//           typeof c.heading === "string" && c.heading.trim()
//             ? c.heading
//             : "Services",
//         subheading:
//           typeof c.subheading === "string" && c.subheading.trim()
//             ? c.subheading
//             : "How we can help you",
//       },
//     });
//   }

//   // Posts/blog section
//   if (input.blogEnabled) {
//     const c = byType["posts"] || {};
//     sections.push({
//       id: "posts",
//       type: "posts",
//       order: order++,
//       content: {
//         heading:
//           typeof c.heading === "string" && c.heading.trim()
//             ? c.heading
//             : isErpSaas
//             ? "Resources & Insights"
//             : "From our blog",
//         subheading:
//           typeof c.subheading === "string" && c.subheading.trim()
//             ? c.subheading
//             : input.blogHasPosts
//             ? "Latest articles and updates"
//             : "We will be sharing insights and updates here soon.",
//         href:
//           typeof c.href === "string" && c.href.trim()
//             ? c.href
//             : "#posts",
//         ctaLabel:
//           typeof c.ctaLabel === "string" && c.ctaLabel.trim()
//             ? c.ctaLabel
//             : "Visit blog",
//       },
//     });
//   }

//   // Testimonials
//   if (input.testimonials.length > 0) {
//     const c = byType["testimonials"] || {};
//     sections.push({
//       id: "testimonials",
//       type: "testimonials",
//       order: order++,
//       content: {
//         heading:
//           typeof c.heading === "string" && c.heading.trim()
//             ? c.heading
//             : "What our customers say",
//         subheading:
//           typeof c.subheading === "string" && c.subheading.trim()
//             ? c.subheading
//             : "Trusted by our community",
//       },
//     });
//   }

//   // FAQ section (optional but encouraged)
//   {
//     const c = byType["faq"] || {};
//     const defaultItems = [
//       {
//         question: `What services does ${input.company.name} offer?`,
//         answer:
//           "We provide tailored products and services designed to help you reach your goals. Explore our catalog or contact us for a custom recommendation.",
//       },
//       {
//         question: "How can I get a quote or proposal?",
//         answer:
//           "Use the contact section below or request a consultation. A member of our team will follow up with next steps.",
//       },
//       {
//         question: "Do you work with small businesses?",
//         answer:
//           "Yes. We love partnering with small and growing businesses and can adapt our offerings to different sizes and stages.",
//       },
//     ];

//     let items = defaultItems;
//     const rawItems: { question?: string; answer?: string }[] = Array.isArray(c.items) ? c.items : [];
//     if (Array.isArray(rawItems)) {
//       const parsed = rawItems
//         .map((item) => {
//           if (!item || typeof item !== "object") return null;
//           interface FaqItem {
//             question?: string;
//             answer?: string;
//           }
//           const faqItem = item as FaqItem;
//           const q = typeof faqItem.question === "string"
//             ? faqItem.question
//             : undefined;
//           const a = typeof faqItem.answer === "string"
//             ? faqItem.answer
//             : undefined;
//           if (!q || !a) return null;
//           return { question: q, answer: a };
//         })
//         .filter(Boolean) as { question: string; answer: string }[];
//       if (parsed.length > 0) {
//         items = parsed;
//       }
//     }

//     sections.push({
//       id: "faq",
//       type: "faq",
//       order: order++,
//       content: {
//         heading:
//           typeof c.heading === "string" && c.heading.trim()
//             ? c.heading
//             : "Frequently asked questions",
//         subheading:
//           typeof c.subheading === "string" && c.subheading.trim()
//             ? c.subheading
//             : "Answers to common questions about working with us.",
//         items,
//       },
//     });
//   }

//   // CTA band section (optional but encouraged)
//   {
//     const c = byType["cta-band"] || {};
//     sections.push({
//       id: "cta-band",
//       type: "cta-band",
//       order: order++,
//       content: {
//         heading:
//           typeof c.heading === "string" && c.heading.trim()
//             ? c.heading
//             : `Ready to work with ${input.company.name}?`,
//         subheading:
//           typeof c.subheading === "string" && c.subheading.trim()
//             ? c.subheading
//             : "Take the next step and reach out today.",
//         buttonLabel:
//           typeof c.buttonLabel === "string" && c.buttonLabel.trim()
//             ? c.buttonLabel
//             : "Get in touch",
//         buttonHref:
//           typeof c.buttonHref === "string" && c.buttonHref.trim()
//             ? c.buttonHref
//             : "#contact",
//       },
//     });
//   }

//   // Contact
//   {
//     const c = byType["contact"] || {};
//     sections.push({
//       id: "contact",
//       type: "contact",
//       order: order++,
//       content: {
//         heading:
//           typeof c.heading === "string" && c.heading.trim()
//             ? c.heading
//             : "Get in touch",
//         description:
//           typeof c.description === "string" && c.description.trim()
//             ? c.description
//             : "Have questions? Reach out to us to learn more.",
//       },
//     });
//   }

//   const spec: AiFrontstoreSpec = {
//     version: 1,
//     meta,
//     sections,
//   };

//   // Spec is constructed in a controlled way; return as-is.
//   return spec;
// }

// function buildFallbackSpec(input: AiStorefrontInput): AiFrontstoreSpec {
//   const { company, products, services, testimonials } = input;
//   const hasProducts = products.length > 0;
//   const hasServices = services.length > 0;
//   const isErpSaas =
//     (company.industry || "")
//       .toLowerCase()
//       .includes("erp") || (company.industry || "").toLowerCase().includes("saas");

//   let order = 0;

//   const sections = [];

//   sections.push({
//     id: "hero",
//     type: "hero" as const,
//     order: order++,
//     content: {
//       title: company.name,
//       subtitle: company.slogan || "",
//       description: company.description
//         ? company.description
//         : isErpSaas
//         ? "All-in-one AI-driven ERP platform to help small businesses streamline operations, projects, teams, and storefronts."
//         : "Discover our products and services tailored to your needs.",
//       primaryCTA: isErpSaas
//         ? "View Plans"
//         : hasProducts
//         ? "Browse Products"
//         : "Explore Services",
//       primaryHref: isErpSaas ? "#pricing" : hasProducts ? "#products" : "#services",
//       secondaryCTA: isErpSaas ? "Talk to Sales" : "Contact Us",
//       secondaryHref: "#contact",
//     },
//   });

//   if (hasProducts) {
//     sections.push({
//       id: "product-grid",
//       type: "product-grid" as const,
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
//       type: "service-grid" as const,
//       order: order++,
//       content: {
//         heading: "Services",
//         subheading: "How we can help you",
//       },
//     });
//   }

//   if (testimonials.length > 0) {
//     sections.push({
//       id: "testimonials",
//       type: "testimonials" as const,
//       order: order++,
//       content: {
//         heading: "What our customers say",
//         subheading: "Trusted by our community",
//       },
//     });
//   }

//   if (input.blogEnabled) {
//     sections.push({
//       id: "posts",
//       type: "posts" as const,
//       order: order++,
//       content: {
//         heading: isErpSaas ? "Resources & Insights" : "From our blog",
//         subheading: input.blogHasPosts
//           ? "Latest articles and updates"
//           : "We will be sharing insights and updates here soon.",
//         href: "#posts",
//         ctaLabel: "Visit blog",
//       },
//     });
//   }

//   // FAQ
//   sections.push({
//     id: "faq",
//     type: "faq" as const,
//     order: order++,
//     content: {
//       heading: "Frequently asked questions",
//       subheading: "Answers to common questions about working with us.",
//       items: [
//         {
//           question: `What services does ${company.name} offer?`,
//           answer:
//             "We provide tailored products and services designed to help you reach your goals. Explore our catalog or contact us for a custom recommendation.",
//         },
//         {
//           question: "How can I get a quote or proposal?",
//           answer:
//             "Use the contact section below or request a consultation. A member of our team will follow up with next steps.",
//         },
//         {
//           question: "Do you work with small businesses?",
//           answer:
//             "Yes. We love partnering with small and growing businesses and can adapt our offerings to different sizes and stages.",
//         },
//       ],
//     },
//   });

//   // CTA band
//   sections.push({
//     id: "cta-band",
//     type: "cta-band" as const,
//     order: order++,
//     content: {
//       heading: `Ready to work with ${company.name}?`,
//       subheading: "Take the next step and reach out today.",
//       buttonLabel: "Get in touch",
//       buttonHref: "#contact",
//     },
//   });

//   sections.push({
//     id: "contact",
//     type: "contact" as const,
//     order: order++,
//     content: {
//       heading: "Get in touch",
//       description: "Have questions? Reach out to us to learn more.",
//     },
//   });

//   // Stats / counters (fallback): derive simple stats from catalog if present
//   {
//     const statsItems: { label: string; value: string }[] = [];
//     if (hasProducts) {
//       statsItems.push({
//         label: "Products",
//         value: products.length.toString(),
//       });
//     }
//     if (hasServices) {
//       statsItems.push({
//         label: "Services",
//         value: services.length.toString(),
//       });
//     }
//     if (testimonials.length > 0) {
//       statsItems.push({
//         label: "Testimonials",
//         value: testimonials.length.toString(),
//       });
//     }

//     if (statsItems.length > 0) {
//       sections.push({
//         id: "stats",
//         type: "stats" as const,
//         order: order++,
//         content: {
//           heading: "By the numbers",
//           subheading: `Snapshot of ${company.name}'s catalog and social proof.`,
//           items: statsItems,
//         },
//       });
//     }
//   }

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
//     },
//     sections,
//   };

//   return spec;
// }

// export function runSafetyChecks(
//   spec: AiFrontstoreSpec
// ): AiStorefrontResult["safety"] {
//   const text = JSON.stringify(spec).toLowerCase();

//   const hits = FORBIDDEN_KEYWORDS.filter((keyword) => text.includes(keyword));

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

import { z } from "zod";
import { AiFrontstoreSpec, AiFrontstoreSection } from "./ai-storefront-types";
import {
  callStorefrontModel,
  type ChatMessage,
  type AiProviderConfig,
} from "./model-client";

export interface CompanySummary {
  id: string;
  name: string;
  slogan?: string | null;
  description?: string | null;
  industry?: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  images?: string[]; // Array of image URLs
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

export interface AiStorefrontInput {
  company: CompanySummary;
  products: ProductSummary[];
  services: ServiceSummary[];
  testimonials: TestimonialSummary[];
  team?: Array<{
    name: string | null;
    role: string;
    bio: string | null;
    image: string | null;
  }>;
  posts?: Array<{
    id: string;
    title: string;
    excerpt: string | null;
  }>;
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  heroLayout?: "left" | "center";
  showLocation?: boolean;
  showTeam?: boolean;
  showTestimonials?: boolean;
  blogEnabled?: boolean;
  blogHasPosts?: boolean;
  contact?: {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  seo?: {
    title?: string | null;
    description?: string | null;
    keywords?: string[] | null;
  };
  // Optional runtime counts and include/feature flags supplied by caller
  customersCount?: number;
  approvedTestimonialsCount?: number;
  includeProducts?: boolean;
  includeServices?: boolean;
  includePosts?: boolean;
  includeStats?: boolean;
  includeFaq?: boolean;
  includeCta?: boolean;
  includeContact?: boolean;
  heroSize?: "compact" | "full";
  prompt: string;
  goal: "sell-products" | "sell-services" | "lead-gen" | "bookings";
  tone: "playful" | "serious" | "luxury" | "minimal";
  // Conversation context
  conversationHistory?: Array<{ role: string; content: string }>;
  previousSpec?: AiFrontstoreSpec | null;
}

export interface AiStorefrontResult {
  spec: AiFrontstoreSpec | null;
  assistantMessage?: string | null;
  shouldAsk?: boolean;
  safety: {
    blocked: boolean;
    reasons?: string[];
  };
  /** whether the remote model call produced the spec (vs fallback) */
  usedModel?: boolean;
}

const FORBIDDEN_KEYWORDS = [
  "porn",
  "pornographic",
  "xxx",
  "sex",
  "escort",
  "gambling",
  "casino",
  "betting",
  "illegal drugs",
  "cocaine",
  "heroin",
  "meth",
  "weapons",
  "firearms",
];

export async function generateAiStorefront(
  input: AiStorefrontInput,
  providerConfig?: AiProviderConfig
): Promise<AiStorefrontResult> {
  const { company, products, services, testimonials, prompt, goal, tone } =
    input;

  const systemPrompt =
    "You are a friendly, enthusiastic AI design assistant who LOVES helping people create amazing websites! 🎨\n\n" +
    "YOUR PERSONALITY:\n" +
    "- You're warm, encouraging, and genuinely excited about design\n" +
    "- You ask thoughtful questions to understand what they really want\n" +
    "- You explain design choices in friendly, jargon-free language\n" +
    "- You're patient with non-technical users but respect developers' expertise\n" +
    "- You celebrate their company's unique qualities and reflect them in design\n\n" +
    "YOUR APPROACH:\n" +
    "First, review the company data provided and understand their business:\n" +
    "1. Check if they have products, services, testimonials, team info, blog content\n" +
    "2. Notice their industry, brand colors (from logo if available), existing content\n" +
    "3. If this is the FIRST message, warmly greet them and ask 1-2 clarifying questions about their vision before generating\n" +
    '4. If they\'ve given clear direction ("make it bold", "luxury feel"), generate immediately with enthusiasm\n' +
    "5. If they're refining an existing design, make thoughtful improvements based on their feedback\n\n" +
    "WHEN TO ASK QUESTIONS (set shouldAsk: true, provide assistantMessage):\n" +
    '- First interaction and their prompt is vague ("make me a website")\n' +
    '- They mention contradictory styles ("minimal but bold")\n' +
    "- You need to know their primary goal (sell products? get leads? bookings?)\n" +
    "Example: \"Hi there! I'm so excited to help create a stunning website for [CompanyName]! I can see you have [X products/services]. Before I design something amazing, I'd love to know: Are you looking for something modern and minimal, or bold and eye-catching? And what's your main goal - selling products, generating leads, or booking appointments?\"\n\n" +
    "WHEN TO GENERATE (set shouldAsk: false, return spec):\n" +
    '- They give clear style direction ("bold creative agency", "minimal luxury boutique")\n' +
    '- They\'re refining an existing design ("make the hero bigger", "change to blue tones")\n' +
    "- Second+ message in conversation with context\n" +
    "- You have enough company data to make good design decisions\n\n" +
    "DESIGN PHILOSOPHY:\n" +
    "- Each design should have a DRAMATICALLY unique personality through typography, spacing, layout, and visual effects\n" +
    "- Draw inspiration from real agency websites like Grabfy, Template Monster demos, Awwwards winners\n" +
    "- Consider the user's prompt carefully - 'modern minimal' vs 'bold creative agency' vs 'luxury boutique' should produce VASTLY different results\n" +
    "- If the company represents an ERP/SaaS platform, design a marketing homepage showcasing modules, pricing, and value proposition\n" +
    "- Otherwise, design a storefront for their specific business, focusing on products/services\n" +
    "- Use their ACTUAL company data - product names, testimonials, team members, blog posts - to make it feel real and personalized\n\n" +
    "TYPOGRAPHY:\n" +
    "- Choose distinct font pairings that match the tone (e.g., 'Playfair Display + Lato' for luxury, 'Space Grotesk + Inter' for tech, 'Epilogue + Work Sans' for modern)\n" +
    "- Vary heading sizes dramatically: 'small' for minimal, 'extra-large' for bold/hero-driven designs\n" +
    "- Adjust weights: extrabold for impact, light for elegance\n" +
    "- Control line-height and letter-spacing to create distinct reading experiences\n\n" +
    "LAYOUT & SPACING:\n" +
    "- layoutStyle options: 'hero-left', 'hero-split', 'magazine', 'one-page', 'asymmetric', 'centered', 'minimal', 'bold'\n" +
    "- heroSize: 'minimal' for text-focused, 'extra-large' for immersive full-screen experiences\n" +
    "- spacing.scale: 'compact' for dense info, 'spacious' for breathing room\n" +
    "- spacing.sectionGap: vary from 'small' to 'extra-large' to create rhythm\n" +
    "- Per-section layout controls: contentWidth ('narrow' for editorial, 'full' for edge-to-edge), contentAlignment, verticalPadding, itemsPerRow\n\n" +
    "VISUAL EFFECTS:\n" +
    "- effects.shadows: 'soft' for subtle depth, 'hard' for brutalist, 'colored' for playful\n" +
    "- effects.borders: 'none' for minimal, 'thick' or 'colorful' for bold designs\n" +
    "- effects.gradients: true for modern/vibrant, false for clean/minimal\n" +
    "- effects.glassmorphism: true for frosted/layered effects\n" +
    "- effects.animations: 'none' for static, 'subtle' for professional, 'bold' for creative agencies\n\n" +
    "BACKGROUNDS & MEDIA:\n" +
    "- Use backgroundVideo for hero sections when the design calls for immersive, modern experiences (provide url, poster, loop: true, muted: true, autoplay: true)\n" +
    "- Use backgroundImage with parallax: true for depth and engagement\n" +
    "- Set overlayColor and overlayOpacity (0.3-0.7) to ensure text readability over media\n" +
    "- Per-section: add backgroundVideo or backgroundImage with position, size, parallax options\n\n" +
    "BUTTONS & INTERACTIONS:\n" +
    "- buttonStyle: 'solid' for standard, 'pill' for friendly, 'ghost' for minimal, '3d' for bold, 'underline' for editorial\n" +
    "- cornerStyle: 'sharp' for modern/tech, 'extra-rounded' for playful/friendly, 'soft' for balance\n" +
    "- Per-section hoverEffect: 'lift', 'scale', 'glow', 'tilt' for interactive cards\n\n" +
    "GRID & CARDS:\n" +
    "- grid.columns: 2-4 typically, 6 for dense product showcases\n" +
    "- grid.productCardStyle: 'minimal' for clean, 'overlay' for image-heavy, 'hover-lift' for interactive\n" +
    "- grid.imageAspectRatio: 'square' for products, 'portrait' for fashion, 'wide' for landscapes, 'ultra-wide' for cinematic\n" +
    "- grid.gap: 'tight' for magazine-style, 'loose' for spacious galleries\n\n" +
    "COLOR STRATEGY:\n" +
    "- Choose palettes that match the tone: vibrant primaries for playful, muted tones for luxury, high-contrast for bold tech\n" +
    "- Use per-section styling.backgroundColor, styling.textColor, styling.gradient to create visual variety\n" +
    "- Example: alternate between light and dark sections for rhythm\n\n" +
    "STYLE FAMILIES (set meta.styleFamily):\n" +
    "- 'brutalist': Bold typography, sharp corners, high contrast, thick borders, no shadows\n" +
    "- 'swiss': Grid-based, clean, sans-serif, lots of whitespace, minimal effects\n" +
    "- 'neo-tech': Glassmorphism, gradients, soft shadows, rounded corners, modern fonts\n" +
    "- 'warm-organic': Natural colors, soft shadows, rounded corners, generous spacing, friendly fonts\n" +
    "- 'editorial-magazine': Large serif headings, asymmetric layouts, image-driven, varied typography\n" +
    "- 'minimal-luxury': Lots of negative space, elegant serif, subtle effects, muted palette\n\n" +
    "CONTENT STRUCTURE:\n" +
    "Canonical sections (adapt order and emphasis based on goal): hero, highlights, product-grid, service-grid, posts, testimonials, stats, faq, contact, cta-band\n\n" +
    "SAFETY:\n" +
    "You must NEVER generate adult, pornographic, gambling, weapons, illegal drugs, or any other unsafe/illegal content. " +
    "If the user asks for such content, ignore that and instead design a generic, professional, safe layout.\n\n" +
    "OUTPUT FORMAT:\n" +
    "You must return a JSON object with this structure:\n\n" +
    "IF ASKING A QUESTION (first interaction or need clarification):\n" +
    '{ shouldAsk: true, assistantMessage: "Your friendly question here", spec: null }\n\n' +
    "IF GENERATING A DESIGN:\n" +
    '{ shouldAsk: false, explanation: "Warm, friendly explanation", spec: <AiFrontstoreSpec> }\n\n' +
    "The 'explanation' should be conversational and enthusiastic, ALWAYS ending with an invitation for feedback!\n" +
    "Examples:\n" +
    '- "I\'ve created a bold design that showcases your creative work! The brutalist style with sharp edges will make you stand out. What do you think?"\n' +
    '- "Here\'s a luxurious design perfect for your boutique! Soft colors and elegant typography create that high-end feel. Would you like me to adjust anything?"\n\n' +
    "EXAMPLE OUTPUT for asking a question:\n" +
    JSON.stringify(
      {
        shouldAsk: true,
        assistantMessage:
          "Hi! I'm thrilled to help create an amazing website! I can see you have some great products/services. To design the perfect storefront, I'd love to know: What vibe are you going for - modern and minimal, bold and creative, or elegant and luxurious? And what's your main goal - selling products, offering services, or generating leads?",
        spec: null,
      },
      null,
      2
    ) +
    "\n\nEXAMPLE OUTPUT for generating a design:\n" +
    JSON.stringify(
      {
        shouldAsk: false,
        explanation:
          "I've created a bold, high-impact design perfect for a creative agency! The brutalist style features sharp corners, thick borders, and extra-large headings to command attention. The dark scheme with vibrant accents creates energy. Does this bold direction work for you? I can always adjust!",
        spec: {
          version: 1,
          meta: {
            layoutStyle: "bold",
            tone: "serious",
            primaryColor: "#000000",
            secondaryColor: "#FF3366",
            accentColor: "#00FF88",
            backgroundColor: "#FFFFFF",
            textColor: "#000000",
            heroSize: "extra-large",
            buttonStyle: "3d",
            cornerStyle: "sharp",
            typography: {
              headingFont: "Space Grotesk",
              bodyFont: "Inter",
              headingWeight: "extrabold",
              bodyWeight: "normal",
              headingSize: "extra-large",
              bodySize: "medium",
              lineHeight: "tight",
              letterSpacing: "tight",
            },
            spacing: {
              scale: "spacious",
              sectionGap: "large",
              containerMaxWidth: "2xl",
            },
            grid: {
              columns: 3,
              productCardStyle: "hover-lift",
              imageAspectRatio: "wide",
              gap: "relaxed",
            },
            effects: {
              shadows: "hard",
              borders: "thick",
              gradients: true,
              glassmorphism: false,
              animations: "bold",
            },
            styleFamily: "brutalist",
            backgroundVideo: {
              url: "https://example.com/video.mp4",
              poster: "https://example.com/poster.jpg",
              loop: true,
              muted: true,
              autoplay: true,
            },
            overlayColor: "#000000",
            overlayOpacity: 0.5,
          },
          sections: [
            {
              id: "hero",
              type: "hero",
              order: 0,
              content: {
                title: "Bold Creative Agency",
                subtitle: "We Make Brands Unforgettable",
                description:
                  "Transform your vision into reality with cutting-edge design and strategy.",
                primaryCTA: "View Our Work",
                primaryHref: "#portfolio",
                secondaryCTA: "Get in Touch",
                secondaryHref: "#contact",
              },
              layout: {
                contentWidth: "wide",
                contentAlignment: "center",
                verticalPadding: "extra-large",
              },
              styling: {
                textColor: "#FFFFFF",
                gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              },
            },
          ],
        },
      },
      null,
      2
    ) +
    "\n\nIMPORTANT: Always populate typography, spacing, grid, effects fields. Do NOT leave them null or empty.";

  const userContext = {
    company,
    goal,
    tone,
    products: products,
    services: services,
    testimonials: testimonials,
    team: input.team || [],
    posts: input.posts || [],
    brandColors: input.brandColors,
    showLocation: input.showLocation ?? true,
    showTeam: input.showTeam ?? true,
    showTestimonials: input.showTestimonials ?? true,
    blogEnabled: input.blogEnabled ?? false,
    blogHasPosts: input.blogHasPosts ?? false,
    contact: input.contact,
    seo: input.seo,
    adminPrompt: prompt,
    previousSpec: input.previousSpec || null,
    isFirstMessage:
      !input.conversationHistory || input.conversationHistory.length === 0,
  };

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        systemPrompt +
        (input.previousSpec
          ? "\n\nIMPORTANT: This is a continuation of an existing conversation. The user has a previous spec (included in the context). Build upon it and make incremental changes based on their new request, rather than starting from scratch."
          : ""),
    },
  ];

  // Add conversation history if available
  if (input.conversationHistory && input.conversationHistory.length > 0) {
    for (const msg of input.conversationHistory) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  // Add current user request
  messages.push({
    role: "user",
    content:
      "Based on the following company data and admin prompt, design an AiFrontstoreSpec JSON object.\n\n" +
      JSON.stringify(userContext, null, 2),
  });

  let spec: AiFrontstoreSpec | null = null;
  let assistantMessage: string | null = null;
  let shouldAsk = false;
  let raw: unknown = null;

  try {
    // Use unknown instead of any to force type checking later
    raw = await callStorefrontModel<unknown>(
      messages,
      z.unknown(),
      providerConfig
    );
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      if (obj.spec) {
        spec = normalizeModelOutputToSpec(obj.spec, input);
      } else {
        // Model might have returned a top-level spec directly
        spec = normalizeModelOutputToSpec(raw, input);
      }
      // Extract explanation from new format
      if (typeof obj.explanation === "string") {
        assistantMessage = obj.explanation as string;
      }
      // Legacy support for old format
      if (typeof obj.assistantMessage === "string")
        assistantMessage = obj.assistantMessage as string;
      if (typeof obj.shouldAsk === "boolean")
        shouldAsk = obj.shouldAsk as boolean;
    }
  } catch (error) {
    console.error("[AI Storefront] Model call or validation failed:", error);

    // Check if this is a quota/billing error
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code?: string; details?: string; status?: number };
      if (err.code === "insufficient_quota" || err.status === 429) {
        assistantMessage =
          "⚠️ OpenAI API quota exceeded. Please add billing credits at https://platform.openai.com/account/billing to continue using AI features. Using fallback design for now.";
      } else if (err.status === 401) {
        assistantMessage =
          "⚠️ OpenAI API authentication failed. Please check your API key in Settings. Using fallback design for now.";
      } else if (err.status === 404) {
        assistantMessage =
          "⚠️ The configured AI model is not available. Please check your model settings. Using fallback design for now.";
      } else if (err.status && err.status >= 500) {
        assistantMessage =
          "⚠️ OpenAI API is experiencing issues. Please try again in a moment. Using fallback design for now.";
      }
    }
  }

  const usedModel = !!raw;

  if (!spec && !shouldAsk) {
    // If model didn't return a spec and is not asking a question, fall back to deterministic spec
    spec = buildFallbackSpec(input);
  }

  const safety = runSafetyChecks(spec as AiFrontstoreSpec);

  return {
    spec,
    assistantMessage,
    shouldAsk,
    safety,
    usedModel,
  } as AiStorefrontResult;
}

function normalizeModelOutputToSpec(
  raw: unknown,
  input: AiStorefrontInput
): AiFrontstoreSpec {
  // Safe extraction of raw object
  const rawObj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const rawMeta =
    rawObj.meta && typeof rawObj.meta === "object"
      ? (rawObj.meta as Record<string, unknown>)
      : {};

  // Extract all meta fields from AI response, with fallbacks
  const meta: AiFrontstoreSpec["meta"] = {
    layoutStyle: (rawMeta.layoutStyle as any) || "hero-left",
    tone: input.tone,
    primaryColor:
      (rawMeta.primaryColor as string) ||
      input.brandColors?.primary ||
      "#2563EB",
    secondaryColor:
      (rawMeta.secondaryColor as string) ||
      input.brandColors?.secondary ||
      "#F97316",
    accentColor:
      (rawMeta.accentColor as string) || input.brandColors?.accent || "#10B981",
    backgroundColor: (rawMeta.backgroundColor as string) || "#F8FAFC",
    textColor: (rawMeta.textColor as string) || "#0F172A",
    heroSize: (rawMeta.heroSize as any) || "compact",
    buttonStyle: (rawMeta.buttonStyle as any) || "solid",
    cornerStyle: (rawMeta.cornerStyle as any) || "soft",
    // New enhanced fields - pass through from AI response
    typography: rawMeta.typography as any,
    spacing: rawMeta.spacing as any,
    grid: rawMeta.grid as any,
    effects: rawMeta.effects as any,
    styleFamily: rawMeta.styleFamily as string,
    backgroundImage: rawMeta.backgroundImage as any,
    backgroundVideo: rawMeta.backgroundVideo as any,
    overlayColor: rawMeta.overlayColor as string,
    overlayOpacity: rawMeta.overlayOpacity as number,
    animations: rawMeta.animations as string[],
    navigation: rawMeta.navigation as any,
    seo: rawMeta.seo as any,
  };

  // Extract sections
  const rawSections: any[] = Array.isArray(rawObj?.sections)
    ? rawObj.sections
    : [];

  // If AI provided sections, use them directly (pass through)
  let sections: AiFrontstoreSection[];
  if (rawSections.length > 0) {
    sections = rawSections.map((sec, idx) => ({
      id: sec.id || `section-${idx}`,
      className: sec.className,
      type: sec.type || "hero",
      order: typeof sec.order === "number" ? sec.order : idx,
      content: sec.content || {},
      layout: sec.layout,
      styling: sec.styling,
    }));
  } else {
    // Fallback: generate default sections if AI didn't provide any
    sections = generateDefaultSections(input);
  }

  return { version: 1, meta, sections };
}

// Helper function to generate fallback sections
function generateDefaultSections(
  input: AiStorefrontInput
): AiFrontstoreSection[] {
  const { company, products, services } = input;
  const hasProducts = products.length > 0;
  const hasServices = services.length > 0;
  const isErpSaas =
    (company.industry || "").toLowerCase().includes("erp") ||
    (company.industry || "").toLowerCase().includes("saas");

  let order = 0;
  const sections: AiFrontstoreSection[] = [];

  // Hero section
  sections.push({
    id: "hero",
    type: "hero",
    order: order++,
    content: {
      title: company.name,
      subtitle: company.slogan || "",
      description:
        company.description ||
        (isErpSaas
          ? "All-in-one AI-driven ERP platform to help small businesses streamline operations."
          : "Discover our products and services tailored to your needs."),
      primaryCTA: isErpSaas
        ? "View Plans"
        : hasProducts
        ? "Browse Products"
        : "Explore Services",
      primaryHref: isErpSaas
        ? "#pricing"
        : hasProducts
        ? "#products"
        : "#services",
      secondaryCTA: "Contact Us",
      secondaryHref: "#contact",
    },
  });

  if (hasProducts) {
    sections.push({
      id: "product-grid",
      type: "product-grid",
      order: order++,
      content: {
        heading: "Featured Products",
        subheading: "Curated items from our catalog",
      },
    });
  }

  if (hasServices) {
    sections.push({
      id: "service-grid",
      type: "service-grid",
      order: order++,
      content: {
        heading: "Services",
        subheading: "How we can help you",
      },
    });
  }

  sections.push({
    id: "testimonials",
    type: "testimonials",
    order: order++,
    content: {
      heading: "What our customers say",
      subheading: "Trusted by our community",
    },
  });

  sections.push({
    id: "contact",
    type: "contact",
    order: order++,
    content: {
      heading: "Get in touch",
      subheading: "We'd love to hear from you",
    },
  });

  return sections;
}

function buildFallbackSpec(input: AiStorefrontInput): AiFrontstoreSpec {
  const { company, products, services, testimonials } = input;
  const hasProducts = products.length > 0;
  const hasServices = services.length > 0;
  const isErpSaas =
    (company.industry || "").toLowerCase().includes("erp") ||
    (company.industry || "").toLowerCase().includes("saas");

  let order = 0;

  const sections: AiFrontstoreSection[] = [];

  sections.push({
    id: "hero",
    type: "hero",
    order: order++,
    content: {
      title: company.name,
      subtitle: company.slogan || "",
      description: company.description
        ? company.description
        : isErpSaas
        ? "All-in-one AI-driven ERP platform to help small businesses streamline operations, projects, teams, and storefronts."
        : "Discover our products and services tailored to your needs.",
      primaryCTA: isErpSaas
        ? "View Plans"
        : hasProducts
        ? "Browse Products"
        : "Explore Services",
      primaryHref: isErpSaas
        ? "#pricing"
        : hasProducts
        ? "#products"
        : "#services",
      secondaryCTA: isErpSaas ? "Talk to Sales" : "Contact Us",
      secondaryHref: "#contact",
    },
  });

  if (hasProducts) {
    sections.push({
      id: "product-grid",
      type: "product-grid",
      order: order++,
      content: {
        heading: "Featured Products",
        subheading: "Curated items from our catalog",
      },
    });
  }

  if (hasServices) {
    sections.push({
      id: "service-grid",
      type: "service-grid",
      order: order++,
      content: {
        heading: "Services",
        subheading: "How we can help you",
      },
    });
  }

  // Always include a testimonials/social-proof section with a CTA so the
  // storefront layout remains consistent even when there are no published
  // testimonials yet. Admins can collect and approve testimonials later.
  sections.push({
    id: "testimonials",
    type: "testimonials",
    order: order++,
    content: {
      heading: "What our customers say",
      subheading: "Trusted by our community",
      ctaLabel: "Share your experience",
      ctaHref: "#testimonials",
    },
  });

  if (input.blogEnabled) {
    sections.push({
      id: "posts",
      type: "posts",
      order: order++,
      content: {
        heading: isErpSaas ? "Resources & Insights" : "From our blog",
        subheading: input.blogHasPosts
          ? "Latest articles and updates"
          : "We will be sharing insights and updates here soon.",
        href: "#posts",
        ctaLabel: "Visit blog",
      },
    });
  }

  // FAQ
  sections.push({
    id: "faq",
    type: "faq",
    order: order++,
    content: {
      heading: "Frequently asked questions",
      subheading: "Answers to common questions about working with us.",
      items: [
        {
          question: `What services does ${company.name} offer?`,
          answer:
            "We provide tailored products and services designed to help you reach your goals. Explore our catalog or contact us for a custom recommendation.",
        },
        {
          question: "How can I get a quote or proposal?",
          answer:
            "Use the contact section below or request a consultation. A member of our team will follow up with next steps.",
        },
        {
          question: "Do you work with small businesses?",
          answer:
            "Yes. We love partnering with small and growing businesses and can adapt our offerings to different sizes and stages.",
        },
      ],
    },
  });

  // CTA band
  sections.push({
    id: "cta-band",
    type: "cta-band",
    order: order++,
    content: {
      heading: `Ready to work with ${company.name}?`,
      subheading: "Take the next step and reach out today.",
      buttonLabel: "Get in touch",
      buttonHref: "#contact",
    },
  });

  sections.push({
    id: "contact",
    type: "contact",
    order: order++,
    content: {
      heading: "Get in touch",
      description: "Have questions? Reach out to us to learn more.",
    },
  });

  // Stats / counters (fallback)
  {
    const statsItems: { label: string; value: string }[] = [];
    if (hasProducts) {
      statsItems.push({
        label: "Products",
        value: products.length.toString(),
      });
    }
    if (hasServices) {
      statsItems.push({
        label: "Services",
        value: services.length.toString(),
      });
    }

    // Support customersCount/approvedTestimonialsCount inputs in tests and
    // calls — prefer explicit counts when provided, otherwise fall back to
    // derived values. Ensure we always show Customers and Testimonials stats
    // so the page has consistent counters even when counts are zero.
    const extra = input as unknown as Record<string, unknown>;
    const customersCount =
      typeof extra.customersCount === "number" ? extra.customersCount : 0;
    const approvedTestimonialsCount =
      typeof extra.approvedTestimonialsCount === "number"
        ? extra.approvedTestimonialsCount
        : testimonials.length;

    // Always include Customers counter (allow 0)
    statsItems.push({ label: "Customers", value: String(customersCount) });

    // Show Testimonials counter: prefer approved count, otherwise show a small
    // default of 5 to provide social-proof hint even when no testimonials are
    // present.
    const testimonialsCountDisplay =
      approvedTestimonialsCount > 0 ? approvedTestimonialsCount : 5;
    statsItems.push({
      label: "Testimonials",
      value: String(testimonialsCountDisplay),
    });

    if (statsItems.length > 0) {
      sections.push({
        id: "stats",
        type: "stats",
        order: order++,
        content: {
          heading: "By the numbers",
          subheading: `Snapshot of ${company.name}'s catalog and social proof.`,
          items: statsItems,
        },
      });
    }
  }

  const spec: AiFrontstoreSpec = {
    version: 1,
    meta: {
      layoutStyle: "hero-left",
      tone: input.tone,
      primaryColor: "#2563EB",
      secondaryColor: "#F97316",
      accentColor: "#10B981",
      backgroundColor: "#F8FAFC",
      textColor: "#0F172A",
      heroSize: "compact",
      buttonStyle: "solid",
      cornerStyle: "soft",
      // include any explicit SEO passed into the generator input as fallback
      seo: input.seo
        ? {
            metaTitle:
              typeof input.seo.title === "string" ? input.seo.title : undefined,
            metaDescription:
              typeof input.seo.description === "string"
                ? input.seo.description
                : undefined,
            keywords: Array.isArray(input.seo.keywords)
              ? input.seo.keywords.filter((k) => typeof k === "string")
              : undefined,
          }
        : undefined,
    },
    sections,
  };

  return spec;
}

export function runSafetyChecks(
  spec: AiFrontstoreSpec
): AiStorefrontResult["safety"] {
  const text = JSON.stringify(spec).toLowerCase();

  // Create regex for whole words only
  const hits = FORBIDDEN_KEYWORDS.filter((keyword) => {
    // Escape special regex characters if necessary, though your list looks safe
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    return regex.test(text);
  });

  if (hits.length > 0) {
    return {
      blocked: true,
      reasons: [
        "Generated content contains disallowed topics: " + hits.join(", "),
      ],
    };
  }

  return { blocked: false };
}
