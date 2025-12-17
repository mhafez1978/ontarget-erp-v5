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
import {
  getContrastRatio,
  makeAccessible,
  isLightColor,
} from "@/lib/utils/wcag-contrast";

export interface CompanySummary {
  id: string;
  name: string;
  slogan?: string | null;
  description?: string | null;
  industry?: string | null;
  logo?: string | null;
  logoLight?: string | null;
  logoDark?: string | null;
  extractedBrandColors?: {
    dominantColors: string[];
    primarySuggestion: string;
    secondarySuggestion: string;
    accentSuggestions: string[];
    isDarkLogo: boolean;
    isLightLogo: boolean;
  };
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
  includeContactMap?: boolean;
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

/**
 * Provider-agnostic validation: ensures all mandatory sections exist
 * regardless of which AI model generated the content.
 * Adds missing sections with sensible defaults if they're not present.
 */
function ensureMandatorySections(
  spec: AiFrontstoreSpec,
  input: AiStorefrontInput
): AiFrontstoreSpec {
  const { company } = input;
  const existingSectionTypes = new Set(spec.sections.map((s) => s.type));
  const missingSections: AiFrontstoreSpec["sections"] = [];

  // Define mandatory sections that MUST always exist
  const mandatorySections = [
    "announcement-bar",
    "header",
    "hero",
    "stats",
    "footer",
  ];

  let nextOrder = spec.sections.length;

  // Check each mandatory section
  mandatorySections.forEach((sectionType) => {
    if (!existingSectionTypes.has(sectionType as any)) {
      console.warn(
        `[Provider Validation] Missing mandatory section: ${sectionType}. Adding default.`
      );

      // Add default section based on type
      switch (sectionType) {
        case "announcement-bar":
          missingSections.push({
            id: "announcement-bar",
            type: "announcement-bar",
            order: 0, // Always first
            content: {
              text: `Welcome to ${company.name}`,
              link: "#contact",
              dismissible: true,
            },
            styling: {
              backgroundColor: spec.meta.accentColor || "#0066CC",
              textColor: "#FFFFFF",
            },
          });
          break;

        case "header":
          missingSections.push({
            id: "header",
            type: "header",
            order: 1, // Always second
            content: {
              logoText: company.name,
              navigationItems: [
                { label: "Home", href: "#hero" },
                { label: "Services", href: "#services" },
                { label: "Contact", href: "#contact" },
              ],
              ctaLabel: "Get Started",
              ctaHref: "#contact",
            },
            styling: {
              position: "sticky",
              backgroundColor: "#FFFFFF",
              textColor: spec.meta.primaryColor || "#000000",
            },
          });
          break;

        case "hero":
          missingSections.push({
            id: "hero",
            type: "hero",
            order: 2,
            content: {
              headline: company.slogan || `Welcome to ${company.name}`,
              subheadline:
                company.description ||
                `Discover what makes ${company.name} special`,
              ctaLabel: "Learn More",
              ctaHref: "#contact",
              imageUrl:
                "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
            },
            styling: {
              layout: "center",
              backgroundImage: {
                url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
              },
            },
          });
          break;

        case "stats":
          missingSections.push({
            id: "stats",
            type: "stats",
            order: nextOrder++,
            content: {
              heading: `Why Choose ${company.name}`,
              items: [
                {
                  label: "Experience",
                  value: "10+",
                  suffix: "Years",
                },
                {
                  label: "Clients",
                  value: "500",
                  suffix: "+",
                },
                {
                  label: "Satisfaction",
                  value: "99",
                  suffix: "%",
                },
              ],
            },
          });
          break;

        case "footer":
          missingSections.push({
            id: "footer",
            type: "footer",
            order: 999, // Always last
            content: {
              companyName: company.name,
              description: company.description || undefined,
              columns: [
                {
                  title: "Quick Links",
                  links: [
                    { label: "Home", href: "#hero" },
                    { label: "Services", href: "#services" },
                    { label: "Contact", href: "#contact" },
                  ],
                },
              ],
              socialLinks: [],
              legalLinks: [
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ],
            },
            styling: {
              backgroundColor: spec.meta.primaryColor || "#1A1A1A",
              textColor: "#FFFFFF",
            },
          });
          break;
      }
    }
  });

  // If we added any missing sections, merge them and re-sort by order
  if (missingSections.length > 0) {
    console.log(
      `[Provider Validation] Added ${missingSections.length} missing mandatory sections`
    );

    const allSections = [...spec.sections, ...missingSections];

    // Re-sort by order and ensure sequential ordering
    allSections.sort((a, b) => a.order - b.order);
    allSections.forEach((section, index) => {
      section.order = index;
    });

    return {
      ...spec,
      sections: allSections,
    };
  }

  return spec;
}

export async function generateAiStorefront(
  input: AiStorefrontInput,
  providerConfig?: AiProviderConfig
): Promise<AiStorefrontResult> {
  const { company, products, services, testimonials, prompt, goal, tone } =
    input;

  // Detect regenerate intent - if user wants completely new design
  const regenerateKeywords = [
    "regenerate",
    "start fresh",
    "new design",
    "completely different",
    "start over",
    "create new",
  ];
  const isRegenerateIntent =
    prompt &&
    regenerateKeywords.some((keyword) =>
      prompt.toLowerCase().includes(keyword)
    );

  // If regenerating, ignore previous spec to get fresh design
  const effectivePreviousSpec = isRegenerateIntent ? null : input.previousSpec;

  const systemPrompt =
    "You are a friendly, enthusiastic AI design consultant who LOVES helping people create amazing websites! 🎨\n\n" +
    "YOUR PERSONALITY:\n" +
    "- You're warm, encouraging, and genuinely excited about design\n" +
    "- You're an EDUCATOR - you explain WHY you make design decisions\n" +
    "- You offer MULTIPLE OPTIONS with distinct personalities/vibes\n" +
    "- You use COLOR PSYCHOLOGY to explain palette choices\n" +
    '- You compare to real brands ("like Netflix but warmer", "think Apple minimalism")\n' +
    "- You ask thoughtful questions to understand what they really want\n" +
    "- You explain design choices in friendly, jargon-free language\n" +
    "- You're patient with non-technical users but respect developers' expertise\n" +
    "- You celebrate their company's unique qualities and reflect them in design\n\n" +
    "YOUR CONSULTATIVE APPROACH:\n" +
    "When starting a new design conversation:\n" +
    "1. ANALYZE their brand: Review company name, industry, logo colors (if extractedBrandColors exists)\n" +
    "2. EDUCATE: Explain color psychology relevant to their industry/brand\n" +
    "3. OFFER OPTIONS: Present 2-3 distinct palette directions with:\n" +
    '   - Named colors (e.g., "Ocean Blue", "Sunset Orange", "Forest Green")\n' +
    '   - Personality/Vibe labels (e.g., "Trust & Tech", "Creative Studio", "Modern Minimalist")\n' +
    '   - Real-world brand comparisons (e.g., "like Stripe but warmer")\n' +
    "   - Accessibility notes (contrast ratios, which combos work)\n" +
    "4. RECOMMEND: Confidently suggest which option fits their brand best and WHY\n" +
    "5. GENERATE: Once they choose or give clear direction, create the full design\n\n" +
    "WHEN TO CONSULT vs GENERATE:\n" +
    '- FIRST MESSAGE + vague prompt ("make me a website") → CONSULT MODE (offer 2-3 palette options)\n' +
    '- FIRST MESSAGE + clear direction ("bold creative agency") → GENERATE with brief explanation\n' +
    "- CONTINUATION message → GENERATE refinement with reasoning\n" +
    '- They ask "why did you choose X?" → EDUCATE MODE (explain reasoning)\n\n' +
    "CONSULTATION EXAMPLE (when offering options):\n" +
    '"For [CompanyName], a [industry] business, your color palette needs to communicate [key qualities].\n\n' +
    "I've identified your logo's dominant color: [Color Name] (#HEX) - this represents [psychology].\n\n" +
    "Here are three accessible palette options:\n\n" +
    "**Option 1: The '[Personality Label]' Palette**\n" +
    "Vibe: [adjectives]\n" +
    "Think: [Real brand comparison]\n" +
    "- Primary: [Named Color] (#HEX) - [reasoning]\n" +
    "- Secondary: [Named Color] (#HEX) - [reasoning]\n" +
    "- Accent: [Named Color] (#HEX) - [reasoning]\n" +
    "- Background: [Named Color] (#HEX)\n" +
    "Accessibility: [Contrast ratios + which combos pass WCAG]\n\n" +
    "**Option 2: The '[Personality Label]' Palette**\n" +
    "[Same structure]\n\n" +
    "**Option 3: The '[Personality Label]' Palette**\n" +
    "[Same structure]\n\n" +
    "💡 My Recommendation: I suggest Option [X] because [strategic reasoning based on their brand/industry].\n\n" +
    'Which direction resonates with your vision? Or would you like me to generate one of these?"\n\n' +
    "YOUR APPROACH:\n" +
    "First, review the comprehensive company data provided and understand their business:\n" +
    "1. COMPANY BASICS: name, slogan, description, industry - use these to create personalized, relevant content\n" +
    "2. CONTACT INFO: email, salesEmail, supportEmail, phone - include appropriate contact methods throughout\n" +
    "3. LOCATION: addressLine1, addressLine2, city, state, country, postalCode - use for local SEO and contact sections\n" +
    "   🚨 CRITICAL: Check if locations array contains latitude/longitude coordinates - if YES, 'contact-map' section is MANDATORY\n" +
    "4. PRODUCTS: Check product names, descriptions, prices, categories, images - showcase their actual offerings\n" +
    "5. SERVICES: Review service names, descriptions, categories - highlight what they provide\n" +
    "6. PROJECTS: Look at featured projects with clients, categories, descriptions - perfect for portfolio sections\n" +
    "7. TEAM: Review employees with names, roles, jobTitles, bios, images - use for team/about sections\n" +
    "8. TESTIMONIALS: Customer feedback with names, titles, ratings - add social proof throughout\n" +
    "9. BLOG POSTS: Check if they have published posts with titles, excerpts - include blog section if available\n" +
    "10. BRAND IDENTITY: Notice logos, colors, industry to match their existing brand\n\n" +
    "CRITICAL: Use REAL company data to make the website feel authentic and personalized:\n" +
    "- Hero should mention their actual business name and slogan\n" +
    "- About section should use their real description and industry\n" +
    "- Contact section must include their actual email(s), phone, and full address\n" +
    "- Product/service sections should list their actual offerings with real names and descriptions\n" +
    "- Team section should feature their actual employees with real names, titles, and bios\n" +
    "- Portfolio should showcase their actual projects with real client names\n" +
    "- Testimonials should use real customer quotes and names\n" +
    "- If they have blog posts, include them with real titles and excerpts\n\n" +
    "Never use placeholder text like 'Your Company' or 'Lorem Ipsum' - you have ALL the real data!\n\n" +
    "COLOR PSYCHOLOGY GUIDE:\n" +
    "Use these insights when explaining palette choices:\n" +
    "- **Blue**: Trust, professionalism, tech, healthcare (IBM, Facebook, PayPal)\n" +
    "- **Red**: Energy, urgency, passion, food (Netflix, Coca-Cola, YouTube)\n" +
    "- **Yellow/Gold**: Optimism, creativity, innovation, warmth (McDonald's, IKEA)\n" +
    "- **Green**: Growth, health, nature, sustainability (Starbucks, Whole Foods)\n" +
    "- **Purple**: Luxury, creativity, spirituality (Twitch, Hallmark)\n" +
    "- **Orange**: Friendly, playful, affordable (Nickelodeon, Amazon)\n" +
    "- **Black/Dark**: Sophistication, luxury, modern (Apple, Nike, Chanel)\n" +
    "- **Navy**: Corporate trust, authority (Best Buy, Ford, American Express)\n\n" +
    "PALETTE PERSONALITY ARCHETYPES:\n" +
    "When offering options, use these proven combinations:\n" +
    "1. **Trust & Tech**: Navy + Bright Color + White/Light Grey (Professional, Corporate)\n" +
    "   - Example: Blue (#002366) + Gold (#FFC107) + Grey (#F4F6F8)\n" +
    "2. **Creative Studio**: Complementary Colors (Bold, Artistic, High-end)\n" +
    "   - Example: Purple (#2A1A40) + Yellow (#FFC107) + White\n" +
    "3. **Modern Minimalist**: Almost-Black + Accent + White (Sleek, Efficient)\n" +
    "   - Example: Charcoal (#121212) + Bright Accent + White\n" +
    "4. **Warm & Friendly**: Earth Tones + Soft Accent (Approachable, Organic)\n" +
    "   - Example: Terracotta + Sage Green + Cream\n" +
    "5. **Bold & Energetic**: Primary Colors + High Contrast (Playful, Dynamic)\n" +
    "   - Example: Red + Blue + Yellow + White\n" +
    "6. **Luxury & Elegant**: Deep Rich Colors + Gold/Metallic (Premium, Sophisticated)\n" +
    "   - Example: Deep Purple + Gold + Off-White\n\n" +
    "BRAND COMPARISON EXAMPLES:\n" +
    "Help users visualize by comparing to familiar brands:\n" +
    '- "Like Stripe but warmer" (Navy + soft colors instead of purple)\n' +
    '- "Think Apple minimalism with your brand personality" (Clean + accent color)\n' +
    '- "Similar to Airbnb but more corporate" (Coral becomes blue, same warmth)\n' +
    '- "The energy of Netflix with a professional edge" (Red + Navy instead of all red)\n' +
    '- "Spotify\'s vibe but in your brand colors" (Bold accent + dark background)\n\n' +
    "FIRST MESSAGE STRATEGY:\n" +
    "3. If this is the FIRST message, warmly greet them BY NAME using their company.name, and ask 1-2 clarifying questions about their vision before generating\n" +
    '4. If they\'ve given clear direction ("make it bold", "luxury feel"), generate immediately with enthusiasm using all their real data\n' +
    "5. If they're refining an existing design, make thoughtful improvements based on their feedback\n\n" +
    "SEO-OPTIMIZED CONTENT GENERATION:\n" +
    "Every piece of copy you write should be SEO-friendly by default! Here's how:\n\n" +
    "HEADLINES & HERO COPY:\n" +
    "- Include the company name naturally in hero headlines when possible\n" +
    "- Use industry-relevant keywords (e.g., for a bakery: 'Artisan Bakery', 'Fresh Baked Goods', 'Custom Cakes')\n" +
    "- Make headlines descriptive AND compelling (not just clever/vague)\n" +
    "- Examples:\n" +
    "  ❌ 'We Make Magic Happen' (vague, no keywords)\n" +
    "  ✅ '[CompanyName] - Premium Web Design & Development Services'\n" +
    "  ✅ 'Handcrafted Artisan Furniture | Custom Woodworking by [CompanyName]'\n\n" +
    "PRODUCT & SERVICE DESCRIPTIONS:\n" +
    "- Use actual product/service names from the database - they're real business terms customers search for\n" +
    "- Naturally incorporate:\n" +
    "  • Category keywords (e.g., 'organic skincare', 'HVAC repair', 'corporate event planning')\n" +
    "  • Feature keywords (e.g., 'eco-friendly', '24/7 emergency service', 'award-winning')\n" +
    "  • Location keywords if company.city/state available (e.g., 'in Austin, Texas', 'serving Greater Boston')\n" +
    "- Write descriptions that inform AND sell (150-300 characters ideal)\n" +
    "- Example: Instead of 'Our best product', write: 'Organic Lavender Face Cream - Handmade with certified organic ingredients for sensitive skin. Vegan & cruelty-free skincare.'\n\n" +
    "SECTION HEADLINES:\n" +
    "- Use keyword-rich section titles that describe content:\n" +
    "  • Instead of 'What We Do' → 'Our Services' or '[Industry] Services'\n" +
    "  • Instead of 'Our Work' → 'Featured Projects' or '[Industry] Portfolio'\n" +
    "  • Instead of 'Why Choose Us' → 'Why Choose [CompanyName]' or industry-specific benefits\n" +
    "- Include location/specialty when relevant: 'Denver Home Renovation Services', 'Luxury Wedding Photography'\n\n" +
    "CTA COPY:\n" +
    "- Make CTAs action-oriented with keywords:\n" +
    "  • 'Shop [ProductCategory]' instead of 'Shop Now'\n" +
    "  • 'Schedule Your Free Consultation' instead of 'Get Started'\n" +
    "  • 'View Our Portfolio' instead of 'Learn More'\n" +
    "- Use company-specific terms: 'Book Your Massage Therapy Session', 'Request a Plumbing Quote'\n\n" +
    "TESTIMONIAL PRESENTATION:\n" +
    "- Include customer titles/companies when available (adds credibility + keywords)\n" +
    "- Example: 'Sarah Johnson, Marketing Director at TechCorp' (includes role keywords)\n\n" +
    "STATS & HIGHLIGHTS:\n" +
    "- Use specific, measurable statements:\n" +
    "  • '500+ Happy Customers' → '500+ [Industry] Clients Served'\n" +
    "  • '10 Years' → '10 Years of Expert [Service] Experience'\n" +
    "- Include achievement keywords: 'Award-Winning', 'Certified', 'Licensed', 'Insured', 'Veteran-Owned'\n\n" +
    "CONTENT WRITING RULES:\n" +
    "1. Use company data intelligently:\n" +
    "   - Company.name in hero and key sections\n" +
    "   - Company.industry keywords throughout\n" +
    "   - Company.slogan if it contains good keywords\n" +
    "   - Actual product.name, service.name, project.category from database\n\n" +
    "2. Natural keyword density (don't overstuff!):\n" +
    "   - Hero: 2-3 primary keywords\n" +
    "   - Each section: 1-2 relevant keywords\n" +
    "   - Product/service cards: Include category/type naturally\n\n" +
    "3. Write for humans first, search engines second:\n" +
    "   - Conversational, engaging copy that flows naturally\n" +
    "   - Keywords should feel organic, not forced\n" +
    "   - Maintain the brand's tone (playful/serious/luxury)\n\n" +
    "4. Location-based SEO (if company has location data):\n" +
    "   - Include city/region in hero or about sections\n" +
    "   - Example: 'Serving Portland and the Pacific Northwest since 2010'\n" +
    "   - Use local landmarks/areas if relevant to industry\n\n" +
    "5. Long-tail keyword opportunities:\n" +
    "   - Service descriptions: 'emergency 24-hour plumbing services'\n" +
    "   - Product descriptions: 'handmade wooden dining tables custom built'\n" +
    "   - Combine: category + benefit + location when applicable\n\n" +
    "6. Blog/content section SEO:\n" +
    "   - Use real post.title from database (they're already keyword-optimized by users)\n" +
    "   - Section headline: '[Industry] Resources', '[Topic] Blog', 'Expert [Category] Guides'\n\n" +
    "7. Metadata considerations (for future enhancement):\n" +
    "   - Hero headline serves as effective H1\n" +
    "   - Section headlines are H2s with keywords\n" +
    "   - Product/service names are H3s with natural keywords\n\n" +
    "EXAMPLES OF SEO-FRIENDLY COPY:\n" +
    "Hero for a bakery:\n" +
    "headline: 'Sweet Dreams Bakery - Artisan Breads & Custom Cakes in Brooklyn'\n" +
    "subheadline: 'Handcrafted baked goods made fresh daily with organic ingredients. Specializing in custom wedding cakes, sourdough breads, and European pastries.'\n\n" +
    "Service card for HVAC company:\n" +
    "title: 'Emergency AC Repair'\n" +
    "description: '24/7 emergency air conditioning repair services in Dallas-Fort Worth. Licensed HVAC technicians respond within 2 hours. Same-day service available.'\n\n" +
    "Portfolio section for agency:\n" +
    "headline: 'Featured Web Design & Development Projects'\n" +
    "intro: 'Explore our portfolio of responsive websites, e-commerce platforms, and custom web applications for clients across healthcare, finance, and technology sectors.'\n\n" +
    "REMEMBER: You have all the data you need - company info, products, services, projects, industry, location. Use it to create naturally SEO-optimized content that helps them rank while maintaining beautiful, persuasive copy!\n\n" +
    "MARKETING & CONVERSION PRINCIPLES:\n" +
    "Apply proven marketing psychology to drive conversions and engagement:\n\n" +
    "1. VALUE PROPOSITION (Hero Section):\n" +
    "   - Lead with the BENEFIT, not just features\n" +
    "   - Answer: 'What's in it for me?' within 3 seconds\n" +
    "   - Formula: [What you do] + [Who it's for] + [Unique benefit]\n" +
    "   - Examples:\n" +
    "     ❌ 'We Build Websites' (feature-focused)\n" +
    "     ✅ 'Custom Websites That Convert Visitors Into Customers'\n" +
    "     ✅ 'Handcrafted Furniture Built to Last Generations'\n" +
    "     ✅ 'Get Your AC Fixed Today - 2-Hour Response Time'\n\n" +
    "2. SOCIAL PROOF (Testimonials, Stats, Trust Signals):\n" +
    "   - Place testimonials EARLY, not just at bottom\n" +
    "   - Use specific numbers in stats: '847 Happy Clients' not 'Many Clients'\n" +
    "   - Include credentials: 'Licensed', 'Certified', 'Award-Winning', '15 Years Experience'\n" +
    "   - Show customer results when possible: 'Increased sales by 40%', 'Saved $10k annually'\n" +
    "   - Position testimonials near related products/services for context\n\n" +
    "3. SCARCITY & URGENCY (When Appropriate):\n" +
    "   - For limited services: 'Limited Slots Available This Month'\n" +
    "   - For seasonal: 'Holiday Special Offer', 'Summer Service Package'\n" +
    "   - For booking: 'Book Now - Next Available: [Date]'\n" +
    "   - Keep it honest - only use if genuinely applicable to business model\n\n" +
    "4. CLEAR CALL-TO-ACTION HIERARCHY:\n" +
    "   - Primary CTA in hero: Most important action (Shop, Book, Get Quote, Contact)\n" +
    "   - Secondary CTA: Lower commitment (Learn More, View Portfolio, Browse Products)\n" +
    "   - Repeat CTAs strategically: After benefits, after testimonials, after pricing\n" +
    "   - Make CTAs action-specific and benefit-driven:\n" +
    "     ✅ 'Get Your Free Estimate' (benefit: free, action: estimate)\n" +
    "     ✅ 'Start Your 14-Day Trial' (benefit: trial, timeframe: 14 days)\n" +
    "     ✅ 'Book Your First Massage - $20 Off' (benefit: discount, action: book)\n" +
    "   - Use contrasting colors for primary CTAs (visibility!)\n\n" +
    "5. BENEFITS OVER FEATURES:\n" +
    "   - Translate features into customer outcomes\n" +
    "   - Feature → Benefit translation:\n" +
    "     • '24/7 Support' → 'Get Help Whenever You Need It'\n" +
    "     • 'Organic Ingredients' → 'Better for Your Health & the Planet'\n" +
    "     • 'Cloud-Based' → 'Access Your Data from Anywhere'\n" +
    "   - Use highlights/features section to show benefit-driven points\n" +
    "   - Include icons that represent benefits (shield=security, clock=fast, heart=quality)\n\n" +
    "6. FRICTION REDUCTION:\n" +
    "   - Clear pricing when possible (transparency builds trust)\n" +
    "   - FAQ section addresses objections: cost, process, guarantees, returns\n" +
    "   - Multiple contact methods: phone, email, form, chat\n" +
    "   - Show process/steps: 'How It Works' for services\n" +
    "   - Make next steps crystal clear: 'Book Online in 3 Easy Steps'\n\n" +
    "7. EMOTIONAL TRIGGERS BY INDUSTRY:\n" +
    "   - Healthcare/Wellness: Trust, care, transformation, peace of mind\n" +
    "   - Luxury: Exclusivity, status, quality, craftsmanship\n" +
    "   - B2B/SaaS: Efficiency, ROI, growth, time-savings\n" +
    "   - E-commerce: Value, convenience, lifestyle, belonging\n" +
    "   - Services: Reliability, expertise, results, stress-relief\n" +
    "   - Use emotional language in subheadlines and descriptions\n\n" +
    "8. STORYTELLING STRUCTURE:\n" +
    "   - Hero: Strong opening that resonates with target audience\n" +
    "   - Problem: Subtle acknowledgment of customer pain points\n" +
    "   - Solution: How company solves it (products/services)\n" +
    "   - Proof: Testimonials and case studies validate solution\n" +
    "   - Action: Clear path forward with CTA\n\n" +
    "9. VISUAL HIERARCHY FOR CONVERSION:\n" +
    "   - F-pattern reading: Most important info top-left\n" +
    "   - Use whitespace to guide eye to CTAs\n" +
    "   - Size/color/position = importance\n" +
    "   - Break up text with subheadings, bullets, highlighted stats\n" +
    "   - Hero image/video should support message, not distract\n\n" +
    "10. GOAL-BASED SECTION ORDERING:\n" +
    "    SELL PRODUCTS goal:\n" +
    "    hero → highlights → product-grid → testimonials → stats → faq → cta-band\n    \n" +
    "    SELL SERVICES goal:\n" +
    "    hero → service-grid → highlights (benefits) → portfolio/testimonials → faq → contact\n    \n" +
    "    LEAD GENERATION goal:\n" +
    "    hero → highlights → testimonials → stats → cta-band (form) → portfolio → contact\n    \n" +
    "    BOOKINGS goal:\n" +
    "    hero → service-grid → testimonials → faq → cta-band (book now) → contact\n\n" +
    "11. TRUST BUILDING ELEMENTS:\n" +
    "    - Include stats section with specific achievements\n" +
    "    - Show team if available (humanizes brand)\n" +
    "    - Display certifications, awards, partnerships\n" +
    "    - Use customer company names in testimonials (with permission assumed)\n" +
    "    - Include location/local presence for local businesses\n\n" +
    "12. MOBILE-FIRST THINKING:\n" +
    "    - Keep headlines punchy and scannable\n" +
    "    - Primary CTA should be visible without scrolling\n" +
    "    - Click-to-call for phone numbers prominent on mobile\n" +
    "    - Simplified forms (fewer fields = more conversions)\n\n" +
    "MARKETING COPY EXAMPLES:\n" +
    "\n" +
    "SaaS Hero (benefit-driven + social proof):\n" +
    "headline: 'Manage Your Entire Business in One Platform'\n" +
    "subheadline: 'Join 10,000+ growing companies using [CompanyName] to streamline operations, boost productivity, and increase revenue by an average of 35%.'\n" +
    "primaryCTA: 'Start Free 14-Day Trial'\n" +
    "secondaryCTA: 'Watch 2-Minute Demo'\n" +
    "\n" +
    "Local Service (urgency + trust):\n" +
    "headline: 'Emergency Plumbing Services - 2-Hour Response Time'\n" +
    "subheadline: 'Licensed & insured plumbers serving [City] for 20 years. Available 24/7 for your peace of mind.'\n" +
    "primaryCTA: 'Call Now: [Phone]'\n" +
    "secondaryCTA: 'Request Free Quote'\n" +
    "\n" +
    "E-commerce (value + lifestyle):\n" +
    "headline: 'Sustainable Fashion That Doesn\\'t Cost the Earth'\n" +
    "subheadline: 'Ethically-made clothing from organic materials. Look good, feel good, do good.'\n" +
    "primaryCTA: 'Shop New Arrivals'\n" +
    "secondaryCTA: 'Learn Our Story'\n" +
    "\n" +
    "Agency Portfolio (results-focused):\n" +
    "headline: 'Web Design That Converts Visitors Into Customers'\n" +
    "subheadline: 'We\\'ve helped 200+ businesses increase online revenue through strategic design and development.'\n" +
    "primaryCTA: 'View Our Work'\n" +
    "secondaryCTA: 'Get Your Free Proposal'\n\n" +
    "WHEN TO ASK QUESTIONS (set shouldAsk: true, provide assistantMessage):\n" +
    '- First interaction and their prompt is vague ("make me a website")\n' +
    '- They mention contradictory styles ("minimal but bold")\n' +
    "- You need to know their primary goal (sell products? get leads? bookings?)\n" +
    "- If blogEnabled is false and they haven't mentioned blogging, ASK if they want to include a blog section for articles, updates, or resources\n" +
    'Example: "Hi [Name]! I\'m excited to design something perfect for [CompanyName]. Before I dive in, let me ask a few quick questions to nail the vibe:\\n\\n**What feeling should your site evoke?**\\n• Bold & energetic (bright colors, big headlines, eye-catching)\\n• Clean & professional (minimal, trustworthy, sophisticated)\\n• Warm & approachable (friendly, inviting, personable)\\n\\n**Primary goal?**\\nAre you focused on selling products, generating leads, or booking appointments?\\n\\n**Blog section?**\\nWould you like a place to share updates, articles, or resources with customers?"\n\n' +
    "WHEN TO GENERATE (set shouldAsk: false, return spec):\n" +
    '- They give clear style direction ("bold creative agency", "minimal luxury boutique")\n' +
    '- They\'re refining an existing design ("make the hero bigger", "change to blue tones")\n' +
    "- Second+ message in conversation with context\n" +
    "- You have enough company data to make good design decisions\n\n" +
    "EDUCATIONAL EXPLANATIONS:\n" +
    "When generating designs, provide rich explanations that educate and justify your choices:\n" +
    "- Explain color psychology and how palette choices support brand personality\n" +
    "- Describe the visual vibe/mood you're creating and why it fits their business\n" +
    "- Compare design directions (e.g., 'bold & energetic vs. clean & professional')\n" +
    "- Reference design trends, industry standards, or successful examples when relevant\n" +
    "- Call out accessibility considerations you've made (contrast ratios, readable fonts)\n" +
    "- Use descriptive color names (e.g., 'Deep Ocean Blue' not just '#1E3A8A')\n" +
    "Example: 'I've designed a bold, modern palette with Deep Ocean Blue as the primary. Blue conveys trust and professionalism—perfect for financial services—while the vibrant Coral accent (#FF6B6B) adds energy and warmth to CTAs. This creates an approachable yet credible feel that balances authority with friendliness.'\n\n" +
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
    "FREE STOCK IMAGES FROM UNSPLASH:\n" +
    "Use high-quality stock images to enrich sections and make designs more visually compelling. Unsplash provides free, professional images.\n\n" +
    "HERO SECTION BACKGROUNDS:\n" +
    "Always add a relevant hero background image unless the design is extremely minimal. Use Unsplash URLs:\n" +
    "- Tech/SaaS: https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80 (tech abstract)\n" +
    "- Business/Corporate: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80 (office/cityscape)\n" +
    "- Creative Agency: https://images.unsplash.com/photo-1558655146-d09347e92766?w=1920&q=80 (colorful workspace)\n" +
    "- Wellness/Healthcare: https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80 (wellness/spa)\n" +
    "- Food/Restaurant: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80 (food prep)\n" +
    "- Retail/E-commerce: https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80 (retail store)\n" +
    "- Construction/Real Estate: https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80 (architecture)\n" +
    "- Fashion: https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80 (fashion/shopping)\n" +
    "- Fitness: https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80 (gym/fitness)\n" +
    "- Education: https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&q=80 (learning/education)\n" +
    "- Finance: https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80 (business/analytics)\n" +
    "- Travel/Hospitality: https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80 (travel/adventure)\n" +
    "- Legal: https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80 (law/justice)\n" +
    "- Automotive: https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80 (cars/automotive)\n" +
    "- Home Services: https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1920&q=80 (modern home)\n" +
    "Add overlay: 0.4-0.6 opacity dark overlay for text readability\n\n" +
    "SERVICE CARDS WITHOUT IMAGES:\n" +
    "When services don't have images in database, add relevant stock images:\n" +
    "- Web Design/Development: https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80\n" +
    "- Marketing/SEO: https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&q=80\n" +
    "- Consulting: https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80\n" +
    "- Accounting/Finance: https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80\n" +
    "- Legal Services: https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&q=80\n" +
    "- Photography: https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80\n" +
    "- Video Production: https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&q=80\n" +
    "- Graphic Design: https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80\n" +
    "- Content Writing: https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80\n" +
    "- Social Media Management: https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80\n" +
    "- IT Support: https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80\n" +
    "- Cloud Services: https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80\n" +
    "- Plumbing: https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80\n" +
    "- HVAC: https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80\n" +
    "- Electrical: https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80\n" +
    "- Landscaping: https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800&q=80\n" +
    "- Cleaning: https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80\n" +
    "- Moving: https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80\n" +
    "- Pet Care: https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80\n" +
    "- Massage Therapy: https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80\n" +
    "- Personal Training: https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80\n" +
    "- Nutrition: https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80\n" +
    "- Therapy/Counseling: https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80\n" +
    "- Event Planning: https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80\n" +
    "- Catering: https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80\n\n" +
    "HIGHLIGHTS/FEATURES SECTION ICONS & IMAGES:\n" +
    "When showcasing features/benefits, consider adding section background or decorative images:\n" +
    "- Technology features: https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80\n" +
    "- Team collaboration: https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80\n" +
    "- Customer service: https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80\n" +
    "- Quality/craftsmanship: https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&q=80\n" +
    "- Innovation: https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80\n" +
    "Use as subtle background with low opacity or parallax effect\n\n" +
    "CTA BAND BACKGROUNDS:\n" +
    "Make CTA sections more engaging with background images:\n" +
    "- Motivational/Success: https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1600&q=80\n" +
    "- Team/Community: https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80\n" +
    "- Growth/Achievement: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80\n" +
    "- Professional: https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=80\n" +
    "Add dark overlay (0.5-0.7) to ensure CTA button stands out\n\n" +
    "PORTFOLIO/PROJECT PLACEHOLDER IMAGES:\n" +
    "When company has no project images, use relevant industry images:\n" +
    "- Web Design Project: https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80\n" +
    "- Mobile App Project: https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80\n" +
    "- Branding Project: https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80\n" +
    "- Interior Design: https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80\n" +
    "- Architecture: https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80\n" +
    "- Construction: https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80\n\n" +
    "TESTIMONIAL SECTION BACKGROUNDS:\n" +
    "Add subtle backgrounds to testimonial sections:\n" +
    "- Abstract patterns: https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1600&q=80\n" +
    "- Soft gradients: https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1600&q=80\n" +
    "- Minimal texture: https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=1600&q=80\n" +
    "Use very low opacity (0.1-0.2) for subtle texture without distraction\n\n" +
    "IMAGE USAGE RULES:\n" +
    "1. ALWAYS use actual product/service images from database when available (product.images[0])\n" +
    "2. For services without images, intelligently match service.name or service.category to appropriate stock image\n" +
    "3. Hero sections should almost always have a background image (unless brutalist/ultra-minimal style)\n" +
    "4. Match image mood to overall design tone (vibrant for playful, muted for luxury, sharp for tech)\n" +
    "5. Add appropriate overlays for text readability: 0.4-0.6 for hero, 0.5-0.7 for CTAs\n" +
    "6. Use consistent aspect ratios within sections (all cards same ratio)\n" +
    "7. Higher quality images (w=1920) for hero/full-width, medium (w=800-1200) for cards\n" +
    "8. Consider parallax: true for hero and feature section backgrounds\n" +
    "9. All Unsplash URLs should include width param (?w=800 or ?w=1920) and quality (?q=80)\n" +
    "10. When in doubt, image > no image (visual richness improves engagement)\n\n" +
    "INTELLIGENT IMAGE MATCHING:\n" +
    "Parse service/product names and categories to select most relevant stock images:\n" +
    "- 'Web Design', 'Website Development' → web design stock images\n" +
    "- 'HVAC', 'Air Conditioning', 'Heating' → HVAC/climate control images\n" +
    "- 'Marketing', 'SEO', 'Digital Marketing' → marketing/analytics images\n" +
    "- 'Plumbing', 'Pipe Repair' → plumbing tools/work images\n" +
    "- 'Photography', 'Photo Shoot' → camera/photography images\n" +
    "- Extract keywords from company.industry and match to hero background\n" +
    "- Look for terms like 'spa', 'fitness', 'restaurant', 'legal', 'medical' in company data\n\n" +
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
    "WCAG ACCESSIBILITY STANDARDS (CRITICAL - MUST FOLLOW):\n" +
    "You MUST ensure ALL designs meet WCAG 2.1 Level AA standards minimum:\n\n" +
    "COLOR CONTRAST REQUIREMENTS:\n" +
    "- Normal text (under 18pt): Minimum 4.5:1 contrast ratio (AA), 7:1 ideal (AAA)\n" +
    "- Large text (18pt+ or 14pt bold): Minimum 3:1 contrast ratio (AA), 4.5:1 ideal (AAA)\n" +
    "- UI components and graphical objects: Minimum 3:1 contrast ratio\n" +
    "- Target: 4.58:1 or higher for optimal readability across all elements\n\n" +
    "CRITICAL: WHEN LOGO/BRAND COLORS PROVIDED:\n" +
    "If input.company.extractedBrandColors exists, use those colors as the foundation:\n" +
    "1. Extract dominant colors from company.extractedBrandColors.dominantColors array\n" +
    "2. Use extractedBrandColors.primarySuggestion as starting point for meta.primaryColor\n" +
    "3. Use extractedBrandColors.secondarySuggestion for meta.secondaryColor\n" +
    "4. Choose from extractedBrandColors.accentSuggestions for meta.accentColor\n" +
    "5. ALWAYS test each color combination for WCAG contrast compliance before using\n" +
    "6. If brand color fails contrast test:\n" +
    "   - For backgrounds: Lighten by 10-30% until it passes\n" +
    "   - For text/buttons: Darken by 20-40% until it passes\n" +
    "   - Document in design that you adjusted for accessibility\n" +
    "7. If extractedBrandColors.isDarkLogo is true: Use light backgrounds (#FFFFFF, #F9FAFB) with darkened brand colors for text\n" +
    "8. If extractedBrandColors.isLightLogo is true: Use darker backgrounds or ensure sufficient text contrast\n" +
    "9. Generate accessible color variations:\n" +
    "   - Primary button: Use brand color for background, ensure white or dark text has 4.5:1 contrast\n" +
    "   - Secondary elements: Lighten/darken brand color by 15-25% and verify contrast\n" +
    "   - Hover states: Darken buttons by 10%, increase contrast, never decrease it\n\n" +
    "SECTION-SPECIFIC CONTRAST RULES:\n" +
    "- Hero Section:\n" +
    "  * Title text MUST have 7:1 contrast (large text, high importance)\n" +
    "  * Body text MUST have 4.5:1 contrast minimum\n" +
    "  * CTA buttons MUST have 4.5:1+ contrast between button color and text\n" +
    "  * If using background image: Add dark overlay (0.5-0.7 opacity) to ensure text contrast\n" +
    "- Navigation:\n" +
    "  * Nav links MUST have 4.5:1 contrast with header background\n" +
    "  * NEVER use white text on white/light backgrounds or similar low-contrast combos\n" +
    "  * Hover states should darken/increase contrast, not lighten\n" +
    "  * Active page indicator needs 3:1 contrast minimum\n" +
    "- Product/Service Cards:\n" +
    "  * Card text on card backgrounds: 4.5:1 minimum\n" +
    "  * Prices and important info: 7:1 for prominence\n" +
    "  * Text over images: ALWAYS add dark overlay (0.5-0.7) or use text shadows for contrast\n" +
    "  * Button CTAs on cards: 4.5:1 contrast\n" +
    "- Testimonials:\n" +
    "  * Quote text needs 7:1 for AAA compliance (important social proof)\n" +
    "  * Author names: 4.5:1 minimum\n" +
    "  * Stars/ratings: Bright colors (yellow/gold) need dark background for contrast\n" +
    "- Footer:\n" +
    "  * Maintain 4.5:1 contrast even on dark backgrounds\n" +
    "  * Links must be distinguishable: underline or sufficient color difference\n" +
    "  * Social icons: 3:1 contrast with background\n" +
    "- Forms & Contact:\n" +
    "  * Input labels: 4.5:1 contrast minimum\n" +
    "  * Placeholder text: 4.5:1 (not 3:1, must be readable)\n" +
    "  * Input borders: Visible 3:1 contrast\n" +
    "  * Error messages: High contrast (7:1) in red/warning color that still passes WCAG\n" +
    "  * Submit buttons: Same as CTA buttons, 4.5:1 minimum\n\n" +
    "TYPOGRAPHY ACCESSIBILITY:\n" +
    "Font sizes MUST support readability:\n" +
    "- h1: 2.25rem-3rem (36px-48px) - Large enough for hero impact and readability\n" +
    "- h2: 1.875rem-2.25rem (30px-36px) - Section headings, clearly distinct from body\n" +
    "- h3: 1.5rem-1.875rem (24px-30px) - Subsections and card titles\n" +
    "- h4: 1.25rem-1.5rem (20px-24px) - Minor headings\n" +
    "- body/p: 1rem-1.125rem (16px-18px) - NEVER go below 16px for body text\n" +
    "- small text: 0.875rem (14px) minimum - Use sparingly for captions, fine print\n" +
    "- Line height: 1.5-1.75 for body text (improves readability and scanability)\n" +
    "- Letter spacing: normal to slightly relaxed (0-0.025em) for body, tighter for headings\n" +
    "- Font weight: Minimum 400 (normal) for body, 600-700 for headings\n" +
    "- NEVER use font weights below 300 (too thin, poor contrast)\n\n" +
    "ACCESSIBLE COLOR PALETTE GENERATION:\n" +
    "When generating color palettes (with or without brand colors):\n" +
    "1. Start with brand colors if provided via extractedBrandColors\n" +
    "2. Select primary color (most prominent from logo or tone-appropriate)\n" +
    "3. Generate complementary colors using color theory:\n" +
    "   - Analogous: Colors next to primary on color wheel (harmonious, low-risk)\n" +
    "   - Complementary: Opposite on wheel (high contrast, use carefully - verify WCAG)\n" +
    "   - Triadic: 3 colors evenly spaced (vibrant, balanced)\n" +
    "4. Test EVERY color combination for WCAG compliance:\n" +
    "   - Primary on background: Must be 4.5:1+\n" +
    "   - Secondary on background: Must be 4.5:1+\n" +
    "   - Accent on background: Must be 4.5:1+\n" +
    "   - Text on primary: Must be 4.5:1+\n" +
    "5. Create accessible variations if needed:\n" +
    "   - For light backgrounds: Darken colors by 20-40% for text use\n" +
    "   - For dark backgrounds: Lighten colors by 20-40% for text use\n" +
    "   - For buttons: Ensure button background + text = 4.5:1+\n" +
    "6. Document contrast ratios mentally and ensure compliance\n\n" +
    "FALLBACK ACCESSIBLE PALETTES (use if extraction fails or colors don't work):\n" +
    "- Modern Blue: primary: #2563EB, secondary: #1E40AF, accent: #10B981, bg: #FFFFFF, text: #111827 (4.98:1, 8.59:1, 4.68:1)\n" +
    "- Professional Gray: primary: #475569, secondary: #1E293B, accent: #3B82F6, bg: #F8FAFC, text: #0F172A (5.32:1, 12.63:1, 5.14:1)\n" +
    "- Warm Orange: primary: #EA580C, secondary: #9A3412, accent: #059669, bg: #FFF7ED, text: #7C2D12 (4.74:1, 9.28:1, 4.89:1)\n" +
    "- Fresh Green: primary: #059669, secondary: #065F46, accent: #2563EB, bg: #ECFDF5, text: #064E3B (4.92:1, 8.43:1, 6.21:1)\n" +
    "- Luxury Purple: primary: #7C3AED, secondary: #5B21B6, accent: #F59E0B, bg: #FAFAF9, text: #1C1917 (5.67:1, 9.84:1, 4.52:1)\n" +
    "- Bold Red: primary: #DC2626, secondary: #991B1B, accent: #2563EB, bg: #FFFBEB, text: #7F1D1D (5.89:1, 10.21:1, 6.43:1)\n" +
    "All above palettes are pre-tested and meet WCAG AA standards. Use them when brand colors fail or aren't provided.\n\n" +
    "EXAMPLES OF ACCESSIBLE COMBINATIONS:\n" +
    "✅ GOOD - These pass WCAG AA:\n" +
    "- Dark blue (#1E3A8A) on light blue bg (#DBEAFE) = 8.2:1\n" +
    "- Dark gray (#1F2937) on white (#FFFFFF) = 16.1:1\n" +
    "- Forest green (#065F46) on mint bg (#ECFDF5) = 5.8:1\n" +
    "- Deep purple (#5B21B6) on lavender bg (#F3E8FF) = 8.9:1\n" +
    "- Navy (#1E40AF) on white (#FFFFFF) = 8.59:1\n\n" +
    "❌ BAD - These FAIL WCAG (NEVER use these):\n" +
    "- White (#FFFFFF) on light blue (#DBEAFE) = 1.2:1 ❌\n" +
    "- Yellow (#FCD34D) on white (#FFFFFF) = 1.3:1 ❌\n" +
    "- Light gray (#D1D5DB) on white (#FFFFFF) = 1.5:1 ❌\n" +
    "- Light green (#BBF7D0) on white (#FFFFFF) = 1.4:1 ❌\n" +
    "- White text on light backgrounds WITHOUT sufficient overlay ❌\n" +
    "- Pale colors on pale backgrounds ❌\n\n" +
    "TESTING YOUR DESIGNS BEFORE RESPONDING:\n" +
    "Mentally verify each section:\n" +
    "✓ No white-on-white or similar low-contrast anywhere\n" +
    "✓ All nav links have 4.5:1+ contrast with header background\n" +
    "✓ CTA buttons stand out with high contrast (4.5:1+) AND sufficient size\n" +
    "✓ Text over images uses dark overlay (0.5-0.7 opacity) or has text shadows\n" +
    "✓ Form inputs have visible borders (3:1) and labels (4.5:1)\n" +
    "✓ Hover states INCREASE contrast, never decrease\n" +
    "✓ All text is 16px+ (14px minimum for captions only)\n" +
    "✓ Important content (CTAs, prices, testimonials) has 7:1 contrast when possible\n\n" +
    "STYLE FAMILIES (set meta.styleFamily):\n" +
    "- 'brutalist': Bold typography, sharp corners, high contrast, thick borders, no shadows\n" +
    "- 'swiss': Grid-based, clean, sans-serif, lots of whitespace, minimal effects\n" +
    "- 'neo-tech': Glassmorphism, gradients, soft shadows, rounded corners, modern fonts\n" +
    "- 'glassmorphic': Frosted glass effects, soft blurs, translucency, layered depth, modern\n" +
    "- 'retro': Vintage typography, bold colors, nostalgic vibes, playful elements, 70s/80s/90s inspired\n" +
    "- 'warm-organic': Natural colors, soft shadows, rounded corners, generous spacing, friendly fonts\n" +
    "- 'editorial-magazine': Large serif headings, asymmetric layouts, image-driven, varied typography\n" +
    "- 'minimal-luxury': Lots of negative space, elegant serif, subtle effects, muted palette\n\n" +
    "INDUSTRY-AWARE COLOR INTELLIGENCE:\n" +
    "CRITICAL: Choose colors that make sense for the business! Use common sense and designer intuition:\n" +
    "- **Florists/Garden Centers**: Vibrant greens, pinks, purples, florals - NOT grayscale!\n" +
    "- **Restaurants/Food**: Warm appetizing colors (reds, oranges, browns, creams)\n" +
    "- **Health/Medical**: Clean blues, greens, whites - trustworthy and calming\n" +
    "- **Kids/Toys**: Bright primary colors, playful pastels, fun and energetic\n" +
    "- **Finance/Law**: Professional blues, grays, navy - credible and serious\n" +
    "- **Creative Agencies**: Bold, vibrant, unexpected - showcase creativity\n" +
    "- **Luxury Brands**: Gold, black, deep jewel tones - elegant and premium\n" +
    "- **Tech/SaaS**: Modern blues, teals, purples - innovative and forward-thinking\n" +
    "- **Fashion/Beauty**: Depends on brand personality - can be bold, minimal, or feminine\n" +
    "If you extract brand colors from their logo, USE THEM as the foundation but expand intelligently!\n\n" +
    "CONTENT STRUCTURE - MANDATORY SECTIONS:\n" +
    "🚨 CRITICAL: EVERY design MUST include these core sections in this exact order:\n\n" +
    "1. **ANNOUNCEMENT-BAR** (type: 'announcement-bar', order: 0) - REQUIRED\n" +
    "   - MUST be included in every design, no exceptions\n" +
    "   - Appears at very top of EVERY page\n" +
    "   - Use for: Promotions, sales, free shipping, limited offers, important announcements\n" +
    "   - If no promo exists, create a welcoming message like 'Welcome to [CompanyName]!'\n" +
    "   - Content: { text: string, link?: string, dismissible: boolean }\n" +
    "   - Style: Contrasting background (accent color), white/light text\n" +
    "   - Examples: '🎉 50% Off Spring Sale!', '✈️ Free Shipping $50+', '👋 Welcome to [Company]!'\n\n" +
    "2. **HEADER** (type: 'header', order: 1) - REQUIRED\n" +
    "   - MUST be included in every design, no exceptions\n" +
    "   - Contains: Logo OR company name, navigation, Login, Register, Cart\n" +
    "   - Logo: Use company.logoLight/logoDark if exists, else company.name in beautiful font\n" +
    "   - Navigation: Auto-generate from sections (Home, Products, Services, Blog, Team, Contact)\n" +
    "   - Auth buttons: Always include 'Login' and 'Register' buttons\n" +
    "   - Cart icon: Include if products.length > 0\n" +
    "   - Style: sticky (most common), solid, transparent, or floating\n" +
    "   - Content: { logo, companyName, navigation[], showAuth: true, showCart, style }\n\n" +
    "3. **HERO** (type: 'hero', order: 2) - REQUIRED\n" +
    "   - MUST be included in every design, no exceptions\n" +
    "   - Large impactful section with headline, subheadline, CTA buttons\n" +
    "   - ALWAYS include a background image from Unsplash (unless brutalist/minimal)\n" +
    "   - Image ratio: 1:1 (square) or 1:2 (wide landscape)\n" +
    "   - CTAs: 1-2 prominent action buttons\n" +
    "   - Content: { title, subtitle, description, primaryCTA, primaryHref, secondaryCTA, secondaryHref }\n" +
    "   - Styling: MUST include backgroundImage with overlay for text readability\n\n" +
    "4. **STATS/SOCIAL-PROOF** (type: 'stats', order: 3) - REQUIRED\n" +
    "   - MUST be included in every design, no exceptions\n" +
    "   - Show impressive numbers: projects, customers, satisfaction, years\n" +
    "   - If no real data: Create realistic placeholders ('500+ Clients', '98% Satisfaction')\n" +
    "   - Content: { stats: [{ number, label }] } - minimum 3-4 stats\n" +
    "   - Style: Clean, prominent numbers with descriptive labels\n\n" +
    "5. **DYNAMIC CONTENT SECTIONS** (orders 4+) - Include based on available data:\n" +
    "   - **PRODUCT-GRID** (type: 'product-grid') - if products.length > 0\n" +
    "     * MUST use product.images[0] when available\n" +
    "     * Grid with 2-4 columns, cards with hover effects\n" +
    "   - **SERVICE-GRID** (type: 'service-grid') - if services.length > 0\n" +
    "     * MUST use Unsplash images matching service names/categories\n" +
    "     * Example: 'Web Design' → web design stock image\n" +
    "   - **PORTFOLIO** (type: 'portfolio') - for agencies/consultants\n" +
    "     * Include if business type suggests it\n" +
    "     * Use Unsplash project images if no real projects\n" +
    "   - **POSTS** (type: 'posts') - if blogEnabled OR user requests\n" +
    "     * Show blog preview cards\n" +
    "   - **TEAM** (type: 'team') - if team.length > 0\n" +
    "     * MUST include when team members exist\n" +
    "     * Use member images or Unsplash person placeholders\n" +
    "     * Layout: Grid 2-4 per row with photo cards\n" +
    "   - **TESTIMONIALS** (type: 'testimonials') - if testimonials.length > 0\n" +
    "     * Magic UI styling - animated cards, engaging layouts\n" +
    "     * Include customer quotes, names, ratings\n" +
    "   - **FAQ** (type: 'faq') - optional, include for complex services\n" +
    "   - **CONTACT-MAP** (type: 'contact-map') - 🚨 REQUIRED when locations have latitude/longitude coordinates\n" +
    "     * MANDATORY: If any location has valid coordinates, you MUST include this section\n" +
    "     * Split view: Contact form + interactive map with company location\n" +
    "     * Even single location benefits from map visual!\n" +
    "     * Shows professionalism, helps customers find you\n" +
    "     * DO NOT use plain 'contact' section if coordinates exist - always use 'contact-map' instead\n" +
    "   - **CTA-BAND** (type: 'cta-band') - HIGHLY RECOMMENDED before footer\n" +
    "     * Final conversion push with strong CTA\n" +
    "     * Use Unsplash background with overlay\n\n" +
    "6. **FOOTER** (type: 'footer', order: 999) - REQUIRED\n" +
    "   - MUST be included in every design, no exceptions\n" +
    "   - Content: Company name, tagline, quick links, contact, social icons, copyright\n" +
    "   - Social icons: Include if metadata.socialLinks exists\n" +
    "   - Copyright: '© 2025 [CompanyName]. All rights reserved.'\n" +
    "   - Style: Multi-column desktop, stacked mobile, dark background\n\n" +
    "🚨 SECTION GENERATION RULES:\n" +
    "- Minimum 6 sections: announcement-bar, header, hero, stats, [1+ content], footer\n" +
    "- Maximum 12 sections for optimal performance\n" +
    "- Order must be sequential: 0, 1, 2, 3, 4, 5...\n" +
    "- NEVER skip announcement-bar, header, hero, stats, or footer\n" +
    "- Include ALL available content sections (products, services, team, testimonials)\n" +
    "- 🚨 MANDATORY: If locations array contains ANY entry with valid latitude/longitude coordinates, you MUST include 'contact-map' section\n" +
    "- NEVER use plain 'contact' section when coordinates are available - always use 'contact-map' instead\n" +
    "- Use Unsplash images when database images not available\n\n" +
    "SECTION-SPECIFIC DETAILS:\n\n" +
    "**CONTACT-MAP SECTION** (type: 'contact-map'):\n" +
    "  - 🚨 MANDATORY when ANY location has valid latitude/longitude coordinates\n" +
    "  - Combines contact form with interactive Leaflet map showing company location\n" +
    "  - Perfect for: ANY business with physical location (retail, restaurants, offices, services)\n" +
    "  - CRITICAL: Check locations array - if ANY location has latitude AND longitude values, this section is REQUIRED\n" +
    "  - NEVER use plain 'contact' section as substitute when coordinates exist\n" +
    "  - Data: Uses company address/lat/long to render map with marker\n" +
    "  - Layout: Split view - contact form left, interactive map right (desktop), stacked (mobile)\n" +
    "  - Benefits: Helps customers find you, visualizes location, builds trust\n\n" +
    "**PRODUCT-GRID/SERVICE-GRID**:\n" +
    "  - ALWAYS include product/service images! Images are crucial for visual appeal\n" +
    "  - Products: Use product.images[0] as image field\n" +
    "  - Services: Use Unsplash placeholders if no service images\n" +
    "  - Grid layout: 2-4 columns depending on style, cards with hover effects\n\n" +
    "**PORTFOLIO SECTION** (type: 'portfolio'):\n" +
    "  - For agencies, consultants, designers, developers, freelancers\n" +
    "  - Include if: Featured projects exist OR business suggests portfolio\n" +
    "  - Data: Project title, client, category, description, images\n" +
    "  - Style: Overlay cards, category badges, engaging hover effects\n" +
    "  - Create 3-6 placeholder projects if none exist but needed\n\n" +
    "**TEAM SECTION** (type: 'team'):\n" +
    "  - Meet the Team - showcase employees with photos, names, roles\n" +
    "  - Include if: Team members exist in company data\n" +
    "  - Style: Photo cards with names, job titles, short bios\n" +
    "  - Layout: Grid (2-4 per row) or carousel for large teams\n\n" +
    "**TESTIMONIALS** (type: 'testimonials'):\n" +
    "  - Use Magic UI styling - animated cards, engaging layouts, marquee effects\n" +
    "  - Include customer quotes, names, companies, ratings\n" +
    "  - Style: Cards with gradients, shadows, subtle animations\n" +
    "  - Layout options: Grid, carousel, marquee scroll, masonry\n\n" +
    "**POSTS/BLOG** (type: 'posts'):\n" +
    "  - When blogEnabled OR user requests it\n" +
    "  - If blog posts exist: Prominent engaging cards with excerpts\n" +
    "  - If placeholder: Style as 'coming soon' with engaging copy\n" +
    "  - Position: Early (content sites), mid-page (most), or bottom (product stores)\n\n" +
    "**FOOTER** (type: 'footer'):\n" +
    "  - MUST include in EVERY design as final section\n" +
    "  - Content: Company name + tagline, quick nav links, contact info\n" +
    "  - Social icons: Only include if metadata.socialLinks has values (Facebook, Twitter, Instagram, LinkedIn)\n" +
    "  - Copyright: '© 2025 [Company Name]. All rights reserved.'\n" +
    "  - Style: Multi-column layout on desktop, stacked on mobile, subtle background\n\n" +
    "SEO METADATA & PAGE HEAD:\n" +
    "The spec includes a 'seo' object in the root that you MUST populate for search engine optimization:\n" +
    "- seo.title: Page title for <title> tag (50-60 characters ideal)\n" +
    "  • Use format: '[Company Name] - [Primary Service/Product] | [Location if available]'\n" +
    "  • Example: 'Sweet Dreams Bakery - Artisan Breads & Custom Cakes | Brooklyn'\n" +
    "  • If metadata.title exists, use it; otherwise generate based on company data\n" +
    "- seo.description: Meta description for search results (150-160 characters)\n" +
    "  • Compelling summary of business with keywords and value proposition\n" +
    "  • Example: 'Handcrafted artisan breads, custom wedding cakes, and European pastries made fresh daily in Brooklyn. Using organic ingredients since 2010.'\n" +
    "  • If metadata.description exists, use it; otherwise generate based on company.description and industry\n" +
    "- seo.keywords: Array of relevant keywords (8-15 keywords)\n" +
    "  • If metadata.keywords exists and has items, use those\n" +
    "  • Otherwise, intelligently generate based on:\n" +
    "    * company.industry (e.g., 'bakery' → 'artisan bakery', 'custom cakes', 'fresh bread')\n" +
    "    * product/service categories (extract from actual product.category, service.category)\n" +
    "    * location (e.g., 'Brooklyn bakery', 'NYC pastries')\n" +
    "    * business type (e.g., 'web design agency', 'HVAC repair', 'luxury spa')\n" +
    "  • Mix short-tail (1-2 words) and long-tail (3-4 words) keywords\n" +
    "  • Example for tech agency: ['web design', 'custom software', 'app development', 'UX design', 'responsive websites', 'mobile apps', 'e-commerce solutions']\n" +
    "- seo.ogImage: Open Graph image for social sharing (use company.logo or hero background image)\n\n" +
    "SOCIAL MEDIA LINKS & FOOTER:\n" +
    "The metadata includes social links that MUST be incorporated into the design:\n" +
    "- If metadata.socialLinks has any values (facebook, twitter, instagram, linkedin), include social icons\n" +
    "- Add social icons in the FOOTER section (always include footer with social links)\n" +
    "- Icon placement options:\n" +
    "  • Footer: Most common - add a row of social icons with links\n" +
    "  • Hero: Can also add small social icons in hero section for certain design styles (modern, creative)\n" +
    "  • Contact section: Include social links alongside email/phone\n" +
    "- Icon styling should match overall design aesthetic:\n" +
    "  • Minimal designs: Simple outlined icons\n" +
    "  • Bold designs: Filled icons with brand colors\n" +
    "  • Playful designs: Icons with hover animations\n" +
    "- Only include icons for platforms that have actual URLs in metadata.socialLinks\n" +
    "- If no social links exist, still design footer but omit social icons section\n\n" +
    "FOOTER STRUCTURE REQUIREMENTS:\n" +
    "Every design MUST include a footer section with:\n" +
    "1. Company name and brief description\n" +
    "2. Quick navigation links (Home, Products, Services, Contact, etc.)\n" +
    "3. Contact information (email, phone, address if available)\n" +
    "4. Social media icons (if metadata.socialLinks has values)\n" +
    "5. Copyright notice with company name and current year\n" +
    "Example footer content structure:\n" +
    "{\n" +
    "  type: 'contact',  // or create a dedicated footer type\n" +
    "  content: {\n" +
    "    heading: 'Get In Touch',\n" +
    "    email: company.email,\n" +
    "    salesEmail: company.salesEmail,\n" +
    "    supportEmail: company.supportEmail,\n" +
    "    phone: company.phone,\n" +
    "    address: [company.addressLine1, company.city, company.state].filter(Boolean).join(', '),\n" +
    "    socialLinks: metadata.socialLinks,  // Include all available social links\n" +
    "    showSocialIcons: true,\n" +
    "    copyrightText: `© ${new Date().getFullYear()} ${company.name}. All rights reserved.`\n" +
    "  }\n" +
    "}\n\n" +
    "SAFETY:\n" +
    "You must NEVER generate adult, pornographic, gambling, weapons, illegal drugs, or any other unsafe/illegal content. " +
    "If the user asks for such content, ignore that and instead design a generic, professional, safe layout.\n\n" +
    "OUTPUT FORMAT:\n" +
    "You must return a JSON object with this structure:\n\n" +
    "IF ASKING A QUESTION (first interaction or need clarification):\n" +
    '{ shouldAsk: true, assistantMessage: "Your friendly question here", spec: null }\n\n' +
    "IF GENERATING A DESIGN:\n" +
    '{ shouldAsk: false, explanation: "Warm, friendly explanation", spec: <AiFrontstoreSpec> }\n\n' +
    "The 'explanation' should be conversational, educational, and enthusiastic, ALWAYS ending with an invitation for feedback!\n" +
    "Include:\n" +
    "- WHY you chose specific colors (psychology + accessibility)\n" +
    "- Brand personality the design communicates\n" +
    "- Real-world brand comparisons\n" +
    "- Specific contrast ratios and accessibility notes\n" +
    "- Strategic reasoning (why this works for their industry/goal)\n\n" +
    "Examples:\n" +
    "- \"I've created a bold, high-impact design perfect for a creative agency! The brutalist style with sharp edges commands attention, while the deep navy (#002366) paired with vibrant gold (#FFC107) creates an 8.2:1 contrast ratio - way above WCAG standards. Think 'Stripe meets creative studio.' The 3D button style makes CTAs impossible to miss. What do you think?\"\n" +
    '- "Here\'s a luxurious design for your boutique! I chose soft purple (#7B4FA0) as your primary because it communicates elegance and creativity - perfect for high-end retail. Paired with an almost-white background (#FAFAF9), it achieves 5.67:1 contrast for easy reading. The serif typography and generous spacing create that upscale magazine feel, like NET-A-PORTER but uniquely yours. Would you like me to adjust anything?"\n' +
    "- \"I've designed a modern, trust-building website for your financial services! Deep navy (#1E40AF) is your anchor color - it's the same psychology as American Express and Ford (trust + authority). Your accent blue (#3B82F6) has 5.14:1 contrast for perfect button readability. The clean grid layout and professional sans-serif fonts say 'We're serious about your money.' Does this capture your vision?\"\n\n" +
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
    "\n\nEXAMPLE OUTPUT for generating a design (MUST include ALL required sections with proper images):\n" +
    JSON.stringify(
      {
        shouldAsk: false,
        explanation:
          "I've created a bold, modern design for your creative agency! Deep Navy (#1E40AF) as primary conveys professionalism with 7.2:1 contrast - perfect for accessibility. The vibrant Coral accent (#FF6B6B) adds energy to CTAs. I've included ALL sections with real product images and Unsplash backgrounds for maximum visual impact. The brutalist style with sharp edges and bold typography commands attention. Notice how each section flows with varied layouts and rich imagery!",
        spec: {
          version: 1,
          meta: {
            layoutStyle: "bold",
            tone: "serious",
            primaryColor: "#1E40AF",
            secondaryColor: "#FF6B6B",
            accentColor: "#10B981",
            backgroundColor: "#FFFFFF",
            textColor: "#111827",
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
              lineHeight: "normal",
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
          },
          sections: [
            {
              id: "announcement-bar-1",
              type: "announcement-bar",
              order: 0,
              content: {
                text: "🎉 50% Off All Services This Month - Limited Time!",
                link: "#services",
                dismissible: true,
              },
              styling: {
                backgroundColor: "#FF6B6B",
                textColor: "#FFFFFF",
              },
            },
            {
              id: "header-1",
              type: "header",
              order: 1,
              content: {
                logo: null,
                companyName: "Creative Studios",
                navigation: [
                  { label: "Home", href: "#hero" },
                  { label: "Services", href: "#services" },
                  { label: "Portfolio", href: "#portfolio" },
                  { label: "Team", href: "#team" },
                  { label: "Contact", href: "#contact" },
                ],
                showAuth: true,
                showCart: false,
                style: "sticky",
              },
              styling: {
                backgroundColor: "#FFFFFF",
                textColor: "#111827",
              },
            },
            {
              id: "hero-1",
              type: "hero",
              order: 2,
              content: {
                title: "Bold Creative Agency",
                subtitle: "We Make Brands Unforgettable",
                description:
                  "Transform your vision into reality with cutting-edge design and strategy that drives results.",
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
                backgroundImage: {
                  url: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1920&q=80",
                  alt: "Creative workspace",
                  position: "center",
                  size: "cover",
                  parallax: true,
                },
                overlayColor: "#000000",
                overlayOpacity: 0.6,
                textColor: "#FFFFFF",
              },
            },
            {
              id: "stats-1",
              type: "stats",
              order: 3,
              content: {
                stats: [
                  { number: "500+", label: "Happy Clients" },
                  { number: "1,200", label: "Projects Completed" },
                  { number: "98%", label: "Client Satisfaction" },
                  { number: "15+", label: "Years Experience" },
                ],
              },
              layout: {
                contentWidth: "wide",
                verticalPadding: "large",
              },
            },
            {
              id: "services-1",
              type: "service-grid",
              order: 4,
              content: {
                heading: "Our Services",
                subheading: "Comprehensive solutions for your brand",
                services: [
                  {
                    id: "svc-1",
                    name: "Web Design",
                    description: "Beautiful, responsive websites",
                    image:
                      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80",
                    price: 2500,
                  },
                  {
                    id: "svc-2",
                    name: "Branding",
                    description: "Complete brand identity packages",
                    image:
                      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
                    price: 3500,
                  },
                  {
                    id: "svc-3",
                    name: "Marketing",
                    description: "Data-driven marketing campaigns",
                    image:
                      "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&q=80",
                    price: 1500,
                  },
                ],
              },
              layout: {
                contentWidth: "wide",
                itemsPerRow: 3,
                itemSpacing: "normal",
                verticalPadding: "large",
              },
            },
            {
              id: "team-1",
              type: "team",
              order: 5,
              content: {
                heading: "Meet Our Team",
                subheading: "Creative minds behind your success",
                members: [
                  {
                    id: "team-1",
                    name: "Sarah Johnson",
                    role: "Creative Director",
                    image:
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
                    bio: "15+ years crafting memorable brand experiences",
                  },
                  {
                    id: "team-2",
                    name: "Mike Chen",
                    role: "Lead Developer",
                    image:
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
                    bio: "Full-stack wizard specializing in React & Node",
                  },
                ],
              },
              layout: {
                contentWidth: "wide",
                itemsPerRow: 2,
                verticalPadding: "large",
              },
            },
            {
              id: "testimonials-1",
              type: "testimonials",
              order: 6,
              content: {
                heading: "Client Success Stories",
                subheading: "Hear what our clients say",
                testimonials: [
                  {
                    id: "test-1",
                    name: "John Smith",
                    company: "Tech Startup Inc",
                    quote:
                      "They transformed our brand and doubled our conversion rate!",
                    rating: 5,
                  },
                ],
              },
              layout: {
                contentWidth: "wide",
                verticalPadding: "large",
              },
              styling: {
                backgroundColor: "#F9FAFB",
              },
            },
            {
              id: "contact-map-1",
              type: "contact-map",
              order: 7,
              content: {
                heading: "Let's Create Something Amazing",
                subheading: "Visit our studio or get in touch",
                description: "We're here to help bring your vision to life",
              },
              layout: {
                contentWidth: "wide",
                verticalPadding: "extra-large",
              },
            },
            {
              id: "footer-1",
              type: "footer",
              order: 8,
              content: {
                companyName: "Creative Studios",
                tagline: "Making brands unforgettable since 2010",
                quickLinks: [
                  { label: "About", href: "/about" },
                  { label: "Services", href: "#services" },
                  { label: "Portfolio", href: "#portfolio" },
                  { label: "Contact", href: "#contact" },
                ],
                socialLinks: {
                  facebook: "https://facebook.com/creativestudios",
                  twitter: "https://twitter.com/creativestudios",
                  instagram: "https://instagram.com/creativestudios",
                  linkedin: "https://linkedin.com/company/creativestudios",
                },
                copyright: "© 2025 Creative Studios. All rights reserved.",
              },
              styling: {
                backgroundColor: "#111827",
                textColor: "#F9FAFB",
              },
            },
          ],
        },
      },
      null,
      2
    ) +
    "\n\nCRITICAL REQUIREMENTS:\n" +
    "1. ALWAYS include ALL sections: announcement-bar, header, hero, stats, [content sections], footer\n" +
    "2. ALWAYS use Unsplash images for hero backgrounds, service cards, team placeholders\n" +
    "3. ALWAYS use real product.images[0] when products have images in database\n" +
    "4. ALWAYS populate typography, spacing, grid, effects - never leave null\n" +
    "5. ALWAYS include image URLs with proper params (?w=800&q=80)\n" +
    "6. EVERY section must have proper content structure with all required fields";

  const userContext = {
    company,
    goal,
    tone,
    products: products,
    services: services,
    testimonials: testimonials,
    team: input.team || [],
    posts: input.posts || [],
    locations: input.locations || [],
    brandColors: input.brandColors,
    showLocation: input.showLocation ?? true,
    showTeam: input.showTeam ?? true,
    showTestimonials: input.showTestimonials ?? true,
    blogEnabled: input.blogEnabled ?? false,
    blogHasPosts: input.blogHasPosts ?? false,
    contact: input.contact,
    seo: input.seo,
    adminPrompt: prompt,
    previousSpec: effectivePreviousSpec || null,
    isFirstMessage:
      !input.conversationHistory || input.conversationHistory.length === 0,
  };

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        systemPrompt +
        (effectivePreviousSpec
          ? "\n\nIMPORTANT: This is a continuation of an existing conversation. The user has a previous spec (included in the context). Build upon it and make incremental changes based on their new request, rather than starting from scratch."
          : isRegenerateIntent
          ? "\n\nREGENERATE MODE: The user wants a COMPLETELY NEW design. Create something dramatically different with fresh creativity. Use a different style family, color palette, layout, and visual approach. DO NOT reference or build upon any previous design."
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

  // Log regenerate mode if active
  if (isRegenerateIntent) {
    console.log(
      "[AI Storefront] REGENERATE MODE: Creating fresh design, ignoring previous spec"
    );
  }

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

  // Validate WCAG compliance and auto-fix if needed
  if (spec && !shouldAsk) {
    const wcagValidation = validateWCAGCompliance(spec);
    if (!wcagValidation.valid) {
      console.log("[WCAG] Applying accessibility fixes to generated design");
      spec = wcagValidation.fixes;
    }
  }

  // Provider-agnostic validation: ensure all mandatory sections exist
  if (spec && !shouldAsk) {
    spec = ensureMandatorySections(spec, input);
  }

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

/**
 * Validate WCAG compliance for generated spec and auto-fix violations
 */
export function validateWCAGCompliance(spec: AiFrontstoreSpec): {
  valid: boolean;
  violations: string[];
  fixes: AiFrontstoreSpec;
} {
  const violations: string[] = [];
  const fixes: AiFrontstoreSpec = JSON.parse(JSON.stringify(spec)); // Deep clone

  // Check meta-level colors
  const bgColor = fixes.meta.backgroundColor || "#FFFFFF";
  const textColor = fixes.meta.textColor || "#111827";

  const textContrast = getContrastRatio(textColor, bgColor);

  if (!textContrast.passesAA) {
    violations.push(
      `Global text contrast ${textContrast.ratio}:1 fails WCAG AA (needs 4.5:1)`
    );
    // Auto-fix: Make text more contrasted
    fixes.meta.textColor = makeAccessible(textColor, bgColor, "AA");
    console.log(
      `[WCAG Fix] Adjusted text color from ${textColor} to ${fixes.meta.textColor}`
    );
  }

  // Check primary color contrast
  const primaryContrast = getContrastRatio(fixes.meta.primaryColor, bgColor);
  if (!primaryContrast.passesAA) {
    violations.push(
      `Primary color contrast ${primaryContrast.ratio}:1 fails WCAG AA`
    );
    fixes.meta.primaryColor = makeAccessible(
      fixes.meta.primaryColor,
      bgColor,
      "AA"
    );
    console.log(
      `[WCAG Fix] Adjusted primary color to ${fixes.meta.primaryColor}`
    );
  }

  // Check secondary color contrast
  const secondaryContrast = getContrastRatio(
    fixes.meta.secondaryColor,
    bgColor
  );
  if (!secondaryContrast.passesAA) {
    violations.push(
      `Secondary color contrast ${secondaryContrast.ratio}:1 fails WCAG AA`
    );
    fixes.meta.secondaryColor = makeAccessible(
      fixes.meta.secondaryColor,
      bgColor,
      "AA"
    );
    console.log(
      `[WCAG Fix] Adjusted secondary color to ${fixes.meta.secondaryColor}`
    );
  }

  // Check section-specific styling
  fixes.sections.forEach((section, index) => {
    if (section.styling?.backgroundColor && section.styling?.textColor) {
      const sectionContrast = getContrastRatio(
        section.styling.textColor,
        section.styling.backgroundColor
      );

      if (!sectionContrast.passesAA) {
        violations.push(
          `Section ${section.id} (${section.type}) text contrast ${sectionContrast.ratio}:1 fails WCAG AA`
        );

        // Auto-fix: Adjust section text color
        fixes.sections[index].styling!.textColor = makeAccessible(
          section.styling.textColor,
          section.styling.backgroundColor,
          "AA"
        );

        console.log(
          `[WCAG Fix] Adjusted section ${section.id} text color to ${
            fixes.sections[index].styling!.textColor
          }`
        );
      }
    }
  });

  // Log summary
  if (violations.length > 0) {
    console.warn(
      `[WCAG Validation] Found ${violations.length} accessibility violations:`
    );
    violations.forEach((v) => console.warn(`  - ${v}`));
    console.log(`[WCAG Validation] Applied ${violations.length} auto-fixes`);
  } else {
    console.log("[WCAG Validation] ✓ All colors pass WCAG AA standards");
  }

  return {
    valid: violations.length === 0,
    violations,
    fixes,
  };
}
