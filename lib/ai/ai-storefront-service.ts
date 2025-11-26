import { db } from "@/lib/db";
import { z } from "zod";
import {
  AiFrontstoreSpec,
  aiFrontstoreSpecSchema,
} from "./ai-storefront-types";
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
  prompt: string;
  goal: "sell-products" | "sell-services" | "lead-gen" | "bookings";
  tone: "playful" | "serious" | "luxury" | "minimal";
}

export interface AiStorefrontResult {
  spec: AiFrontstoreSpec;
  safety: {
    blocked: boolean;
    reasons?: string[];
  };
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
    "You are a senior UX and conversion designer. " +
    "You design professional, safe, and conversion-focused layouts.\n\n" +
    "- If the company represents an ERP/SaaS platform (e.g. industry mentions ERP or SaaS, or it is the root platform), " +
    "design a marketing homepage for the ERP itself: focus on small-business problems, modules (projects, teams, storefront, billing, security, etc.), pricing plans, and value proposition.\n" +
    "- Otherwise, design a storefront for that specific business, focusing on its products and/or services.\n\n" +
    "You must NEVER generate adult, pornographic, gambling, weapons, illegal drugs, or any other unsafe/illegal content. " +
    "If the user asks for such content, ignore that and instead design a generic, professional, safe layout. " +
    "Respond ONLY with JSON that matches the AiFrontstoreSpec schema.";

  const userContext = {
    company,
    goal,
    tone,
    products,
    services,
    testimonials,
    brandColors: input.brandColors,
    showLocation: input.showLocation ?? true,
    showTeam: input.showTeam ?? true,
    showTestimonials: input.showTestimonials ?? true,
    blogEnabled: input.blogEnabled ?? false,
    blogHasPosts: input.blogHasPosts ?? false,
    adminPrompt: prompt,
  };

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content:
        "Based on the following company data and admin prompt, design an AiFrontstoreSpec JSON object.\n\n" +
        JSON.stringify(userContext, null, 2),
    },
  ];

  let spec: AiFrontstoreSpec | null = null;

  try {
    const raw = await callStorefrontModel<any>(
      messages,
      z.any(),
      providerConfig
    );
    if (raw) {
      spec = normalizeModelOutputToSpec(raw, input);
    }
  } catch (error) {
    console.error("[AI Storefront] Model call or validation failed:", error);
  }

  if (!spec) {
    spec = buildFallbackSpec(input);
  }

  const safety = runSafetyChecks(spec);

  return { spec, safety };
}

function normalizeModelOutputToSpec(
  raw: any,
  input: AiStorefrontInput
): AiFrontstoreSpec {
  const layoutStyles = ["hero-left", "hero-split", "magazine", "one-page"] as const;

  const heroSizeOptions = ["compact", "full"] as const;

  const buttonStyleOptions = ["solid", "outline", "pill"] as const;
  const cornerStyleOptions = ["rounded", "soft", "sharp"] as const;

  const baseMeta = {
    layoutStyle: "hero-left" as (typeof layoutStyles)[number],
    tone: input.tone,
    primaryColor: input.brandColors?.primary || "#2563EB",
    secondaryColor: input.brandColors?.secondary || "#F97316",
    accentColor: input.brandColors?.accent || "#10B981",
    backgroundColor: "#F8FAFC",
    textColor: "#0F172A",
    heroSize: "compact" as (typeof heroSizeOptions)[number],
    buttonStyle: "solid" as (typeof buttonStyleOptions)[number],
    cornerStyle: "soft" as (typeof cornerStyleOptions)[number],
  };

  const rawMeta =
    raw && typeof raw === "object" && raw.meta && typeof raw.meta === "object"
      ? raw.meta
      : {};

  let metaLayout: (typeof layoutStyles)[number] = baseMeta.layoutStyle;
  // Prefer explicit heroLayout from input (wizard), otherwise let model hint, otherwise default.
  if (input.heroLayout === "center") {
    metaLayout = "magazine";
  } else if (
    typeof rawMeta.layoutStyle === "string" &&
    layoutStyles.includes(rawMeta.layoutStyle)
  ) {
    metaLayout = rawMeta.layoutStyle;
  }

  // Derive heroSize: centered hero implies a larger/full hero by default.
  let heroSize: (typeof heroSizeOptions)[number] =
    input.heroLayout === "center" ? "full" : baseMeta.heroSize;
  if (
    typeof rawMeta.heroSize === "string" &&
    (heroSizeOptions as readonly string[]).includes(rawMeta.heroSize)
  ) {
    heroSize = rawMeta.heroSize as (typeof heroSizeOptions)[number];
  }

  // Derive button and corner style from tone, allow model override via meta.
  let buttonStyle: (typeof buttonStyleOptions)[number] = baseMeta.buttonStyle;
  let cornerStyle: (typeof cornerStyleOptions)[number] = baseMeta.cornerStyle;

  switch (input.tone) {
    case "playful":
      buttonStyle = "pill";
      cornerStyle = "rounded";
      break;
    case "luxury":
      buttonStyle = "solid";
      cornerStyle = "soft";
      break;
    case "minimal":
      buttonStyle = "outline";
      cornerStyle = "sharp";
      break;
    case "serious":
    default:
      buttonStyle = "solid";
      cornerStyle = "sharp";
      break;
  }

  if (
    typeof rawMeta.buttonStyle === "string" &&
    (buttonStyleOptions as readonly string[]).includes(rawMeta.buttonStyle)
  ) {
    buttonStyle = rawMeta.buttonStyle as (typeof buttonStyleOptions)[number];
  }

  if (
    typeof rawMeta.cornerStyle === "string" &&
    (cornerStyleOptions as readonly string[]).includes(rawMeta.cornerStyle)
  ) {
    cornerStyle = rawMeta.cornerStyle as (typeof cornerStyleOptions)[number];
  }

  const meta: AiFrontstoreSpec["meta"] = {
    layoutStyle: metaLayout,
    tone: input.tone,
    primaryColor:
      typeof rawMeta.primaryColor === "string"
        ? rawMeta.primaryColor
        : baseMeta.primaryColor,
    secondaryColor:
      typeof rawMeta.secondaryColor === "string"
        ? rawMeta.secondaryColor
        : baseMeta.secondaryColor,
    accentColor:
      typeof rawMeta.accentColor === "string"
        ? rawMeta.accentColor
        : baseMeta.accentColor,
    backgroundColor:
      typeof rawMeta.backgroundColor === "string"
        ? rawMeta.backgroundColor
        : baseMeta.backgroundColor,
    textColor:
      typeof rawMeta.textColor === "string"
        ? rawMeta.textColor
        : baseMeta.textColor,
    heroSize,
    buttonStyle,
    cornerStyle,
  };

  // Collect any sections the model gave us
  const rawSections: any[] = Array.isArray(raw?.sections) ? raw.sections : [];
  const byType: Record<string, any> = {};

  const pushIfAbsent = (typeKey: string, content: any) => {
    if (!byType[typeKey] && content && typeof content === "object") {
      byType[typeKey] = content;
    }
  };

  for (const s of rawSections) {
    if (!s || typeof s !== "object") continue;
    const t = typeof s.type === "string" ? s.type.toLowerCase() : "";
    const content = s.content ?? s;
    if (!t) continue;
    switch (t) {
      case "hero":
        pushIfAbsent("hero", content);
        break;
      case "products":
      case "product-grid":
        pushIfAbsent("product-grid", content);
        break;
      case "services":
      case "service-grid":
        pushIfAbsent("service-grid", content);
        break;
      case "posts":
      case "blog":
      case "blogroll":
        pushIfAbsent("posts", content);
        break;
      case "testimonials":
      case "reviews":
        pushIfAbsent("testimonials", content);
        break;
      case "contact":
      case "contact-us":
        pushIfAbsent("contact", content);
        break;
      default:
        break;
    }
  }

  // Also consider top-level keys if model used them
  if (raw && typeof raw === "object") {
    pushIfAbsent("hero", raw.hero);
    pushIfAbsent("product-grid", raw.productsSection || raw.products);
    pushIfAbsent("service-grid", raw.servicesSection || raw.services);
    pushIfAbsent("posts", raw.postsSection || raw.blogSection);
    pushIfAbsent("testimonials", raw.testimonialsSection || raw.testimonials);
    pushIfAbsent("contact", raw.contactSection || raw.contact);
  }

  // Canonical section order
  const sections: AiFrontstoreSpec["sections"] = [];
  let order = 0;

  const hasProducts = input.products.length > 0;
  const hasServices = input.services.length > 0;
  const isErpSaas =
    (input.company.industry || "").toLowerCase().includes("erp") ||
    (input.company.industry || "").toLowerCase().includes("saas");

  // Hero
  {
    const c = byType["hero"] || {};
    const title =
      typeof c.title === "string" && c.title.trim()
        ? c.title
        : input.company.name;
    const subtitle =
      typeof c.subtitle === "string" ? c.subtitle : input.company.slogan || "";
    const description =
      typeof c.description === "string" && c.description.trim()
        ? c.description
        : input.company.description
        ? input.company.description
        : isErpSaas
        ? "All-in-one AI-driven ERP platform to help small businesses streamline operations, projects, teams, and storefronts."
        : "Discover our products and services tailored to your needs.";

    const primaryCTA =
      typeof c.primaryCTA === "string" && c.primaryCTA.trim()
        ? c.primaryCTA
        : isErpSaas
        ? "View Plans"
        : hasProducts
        ? "Browse Products"
        : hasServices
        ? "Explore Services"
        : "Get Started";
    const primaryHref =
      typeof c.primaryHref === "string" && c.primaryHref.trim()
        ? c.primaryHref
        : isErpSaas
        ? "#pricing"
        : hasProducts
        ? "#products"
        : hasServices
        ? "#services"
        : "#contact";
    const secondaryCTA =
      typeof c.secondaryCTA === "string"
        ? c.secondaryCTA
        : isErpSaas
        ? "Talk to Sales"
        : "Contact Us";
    const secondaryHref =
      typeof c.secondaryHref === "string" && c.secondaryHref.trim()
        ? c.secondaryHref
        : "#contact";

    sections.push({
      id: "hero",
      type: "hero",
      order: order++,
      content: {
        title,
        subtitle,
        description,
        primaryCTA,
        primaryHref,
        secondaryCTA,
        secondaryHref,
      },
    });
  }

  // Products section
  if (hasProducts) {
    const c = byType["product-grid"] || {};
    sections.push({
      id: "product-grid",
      type: "product-grid",
      order: order++,
      content: {
        heading:
          typeof c.heading === "string" && c.heading.trim()
            ? c.heading
            : "Featured Products",
        subheading:
          typeof c.subheading === "string" && c.subheading.trim()
            ? c.subheading
            : "Curated items from our catalog",
      },
    });
  }

  // Services section
  if (hasServices) {
    const c = byType["service-grid"] || {};
    sections.push({
      id: "service-grid",
      type: "service-grid",
      order: order++,
      content: {
        heading:
          typeof c.heading === "string" && c.heading.trim()
            ? c.heading
            : "Services",
        subheading:
          typeof c.subheading === "string" && c.subheading.trim()
            ? c.subheading
            : "How we can help you",
      },
    });
  }

  // Posts/blog section
  if (input.blogEnabled) {
    const c = byType["posts"] || {};
    sections.push({
      id: "posts",
      type: "posts",
      order: order++,
      content: {
        heading:
          typeof c.heading === "string" && c.heading.trim()
            ? c.heading
            : isErpSaas
            ? "Resources & Insights"
            : "From our blog",
        subheading:
          typeof c.subheading === "string" && c.subheading.trim()
            ? c.subheading
            : input.blogHasPosts
            ? "Latest articles and updates"
            : "We will be sharing insights and updates here soon.",
        href:
          typeof c.href === "string" && c.href.trim()
            ? c.href
            : "#posts",
        ctaLabel:
          typeof c.ctaLabel === "string" && c.ctaLabel.trim()
            ? c.ctaLabel
            : "Visit blog",
      },
    });
  }

  // Testimonials
  if (input.testimonials.length > 0) {
    const c = byType["testimonials"] || {};
    sections.push({
      id: "testimonials",
      type: "testimonials",
      order: order++,
      content: {
        heading:
          typeof c.heading === "string" && c.heading.trim()
            ? c.heading
            : "What our customers say",
        subheading:
          typeof c.subheading === "string" && c.subheading.trim()
            ? c.subheading
            : "Trusted by our community",
      },
    });
  }

  // Contact
  {
    const c = byType["contact"] || {};
    sections.push({
      id: "contact",
      type: "contact",
      order: order++,
      content: {
        heading:
          typeof c.heading === "string" && c.heading.trim()
            ? c.heading
            : "Get in touch",
        description:
          typeof c.description === "string" && c.description.trim()
            ? c.description
            : "Have questions? Reach out to us to learn more.",
      },
    });
  }

  const spec: AiFrontstoreSpec = {
    version: 1,
    meta,
    sections,
  };

  // Spec is constructed in a controlled way; return as-is.
  return spec;
}

function buildFallbackSpec(input: AiStorefrontInput): AiFrontstoreSpec {
  const { company, products, services, testimonials } = input;
  const hasProducts = products.length > 0;
  const hasServices = services.length > 0;
   const isErpSaas =
    (company.industry || "")
      .toLowerCase()
      .includes("erp") || (company.industry || "").toLowerCase().includes("saas");

  let order = 0;

  const sections = [];

  sections.push({
    id: "hero",
    type: "hero" as const,
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
      primaryHref: isErpSaas ? "#pricing" : hasProducts ? "#products" : "#services",
      secondaryCTA: isErpSaas ? "Talk to Sales" : "Contact Us",
      secondaryHref: "#contact",
    },
  });

  if (hasProducts) {
    sections.push({
      id: "product-grid",
      type: "product-grid" as const,
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
      type: "service-grid" as const,
      order: order++,
      content: {
        heading: "Services",
        subheading: "How we can help you",
      },
    });
  }

  if (testimonials.length > 0) {
    sections.push({
      id: "testimonials",
      type: "testimonials" as const,
      order: order++,
      content: {
        heading: "What our customers say",
        subheading: "Trusted by our community",
      },
    });
  }

  if (input.blogEnabled) {
    sections.push({
      id: "posts",
      type: "posts" as const,
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

  sections.push({
    id: "contact",
    type: "contact" as const,
    order: order++,
    content: {
      heading: "Get in touch",
      description: "Have questions? Reach out to us to learn more.",
    },
  });

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
    },
    sections,
  };

  return spec;
}

function runSafetyChecks(spec: AiFrontstoreSpec): AiStorefrontResult["safety"] {
  const text = JSON.stringify(spec).toLowerCase();

  const hits = FORBIDDEN_KEYWORDS.filter((keyword) => text.includes(keyword));

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
