/**
 * V3 to Content Wizard Mapper
 *
 * Converts V3 website sections to Content Wizard (ThemeSection) format
 */

import type { V3Website, V3Page, V3Section } from "./v3-types.ts";
import type { ThemeSection } from "@/lib/storefront-themes";

// Helper type guards and accessors
function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function asString(input: unknown, fallback = ""): string {
  return typeof input === "string" ? input : fallback;
}

function asNumber(input: unknown, fallback = 0): number {
  return typeof input === "number" ? input : fallback;
}

function asArray(input: unknown): unknown[] {
  return Array.isArray(input) ? input : [];
}

/**
 * Map V3 section type to Content Wizard section type
 */
function mapSectionType(v3Type: string): ThemeSection["type"] {
  const typeMap: Record<string, ThemeSection["type"]> = {
    hero: "hero",
    features: "highlights",
    catalog: "product-grid",
    testimonials: "testimonials",
    about: "about",
    faq: "faq",
    cta: "cta-band",
    contact: "contact",
    team: "team",
    portfolio: "portfolio",
    stats: "stats",
    process: "highlights", // Map process to highlights
    pricing: "product-grid", // Map pricing to product-grid
    "blog-preview": "posts",
  };

  return typeMap[v3Type] || "about";
}

/**
 * Convert V3 section content to Content Wizard format
 */
function convertSectionContent(section: V3Section): ThemeSection["content"] {
  const content: Record<string, unknown> | unknown[] = section.content;
  const type = section.type;

  // Hero section
  if (type === "hero") {
    const c = isRecord(content) ? content : {};
    const ctaText = asString(c.ctaText, "");
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      description: asString(c.description, ""),
      ctaText: ctaText || "Learn More",
      ctaLink: asString(c.ctaLink, "#"),
      backgroundImage: asString(c.backgroundImage, ""),
      showCta: !!ctaText,
    };
  }

  // Features/Highlights
  if (type === "features") {
    const items = asArray(content);
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      items: items.map((item) => {
        const it = isRecord(item) ? item : {};
        return {
          icon: asString(it.icon, "Sparkles"),
          title: asString(it.title, ""),
          description: asString(it.description, ""),
          image:
            asString(it.image, undefined as unknown as string) || undefined,
        };
      }),
    };
  }

  // Catalog/Products/Services
  if (type === "catalog" || type === "pricing") {
    const items = asArray(content);
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      items: items.map((item) => {
        const it = isRecord(item) ? item : {};
        return {
          name: asString(it.name, ""),
          description: asString(it.description, ""),
          price: asNumber(it.price, 0),
          image: asString(it.image, ""),
          category: asString(it.category, ""),
        };
      }),
    };
  }

  // Testimonials
  if (type === "testimonials") {
    const items = asArray(content);
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      testimonials: items.map((item) => {
        const it = isRecord(item) ? item : {};
        return {
          quote: asString(it.quote, asString(it.testimonial, "")),
          author: asString(it.author, asString(it.customerName, "")),
          role: asString(it.role, asString(it.customerTitle, "")),
          photo: asString(it.photo, asString(it.customerPhoto, "")),
          rating: asNumber(it.rating, 5),
        };
      }),
    };
  }

  // About section
  if (type === "about") {
    if (isRecord(content)) {
      return {
        heading: section.heading,
        subheading: section.subheading || "",
        description: asString(content.description, ""),
        image: asString(content.image, ""),
      };
    }

    return {
      heading: section.heading,
      subheading: section.subheading || "",
      description: String(content || ""),
      image: "",
    };
  }

  // FAQ section
  if (type === "faq") {
    const items = asArray(content);
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      faqs: items.map((item) => {
        const it = isRecord(item) ? item : {};
        return {
          question: asString(it.question, ""),
          answer: asString(it.answer, ""),
        };
      }),
    };
  }

  // CTA section
  if (type === "cta") {
    const c = isRecord(content) ? content : {};
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      description: asString(c.description, ""),
      buttonText: asString(c.buttonText, asString(c.ctaText, "Get Started")),
      buttonLink: asString(c.buttonLink, asString(c.ctaLink, "#")),
      backgroundImage: asString(c.backgroundImage, ""),
    };
  }

  // Contact section
  if (type === "contact") {
    const c = isRecord(content) ? content : {};
    const locations = Array.isArray(c.locations)
      ? (c.locations as unknown[])
      : [];
    const primary =
      locations.length > 0 && isRecord(locations[0])
        ? (locations[0] as Record<string, unknown>)
        : {};
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      email: asString(c.email, asString(primary.email, "")),
      phone: asString(c.phone, asString(primary.phone, "")),
      address: asString(c.address, asString(primary.address, "")),
      locations: locations.map((loc) => {
        const l = isRecord(loc) ? loc : {};
        return {
          name: asString(l.name, ""),
          type: asString(l.type, ""),
          address: asString(l.address, ""),
          city: asString(l.city, ""),
          state: asString(l.state, ""),
          country: asString(l.country, ""),
          phone: asString(l.phone, ""),
          email: asString(l.email, ""),
        };
      }),
    };
  }

  // Team section
  if (type === "team") {
    const items = asArray(content);
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      members: items.map((item) => {
        const it = isRecord(item) ? item : {};
        return {
          name: asString(it.name, ""),
          role: asString(it.role, ""),
          bio: asString(it.bio, ""),
          photo: asString(it.photo, asString(it.image, "")),
        };
      }),
    };
  }

  // Portfolio section
  if (type === "portfolio") {
    const items = asArray(content);
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      projects: items.map((item) => {
        const it = isRecord(item) ? item : {};
        return {
          title: asString(it.title, asString(it.name, "")),
          description: asString(it.description, ""),
          image: asString(it.image, ""),
          link: asString(it.link, "#"),
        };
      }),
    };
  }

  // Stats section
  if (type === "stats") {
    const items = asArray(content);
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      stats: items.map((item) => {
        const it = isRecord(item) ? item : {};
        return {
          value: asString(it.value, String(asNumber(it.number, 0))),
          label: asString(it.label, asString(it.description, "")),
          icon: asString(it.icon, "TrendingUp"),
        };
      }),
    };
  }

  // Generic fallback - only spread if content is an object
  if (isRecord(content)) {
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      ...content,
    } as ThemeSection["content"];
  }

  return {
    heading: section.heading,
    subheading: section.subheading || "",
  } as ThemeSection["content"];
}

/**
 * Convert a V3 page to Content Wizard sections
 */
export function convertV3PageToThemeSections(page: V3Page): ThemeSection[] {
  return page.sections
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({
      id: `${page.slug}-${section.type}-${index}`,
      type: mapSectionType(section.type),
      enabled: true,
      order: index,
      content: convertSectionContent(section),
      styling: {
        backgroundColor: undefined,
        textColor: undefined,
      },
    }));
}

/**
 * Convert entire V3 website to Content Wizard sections
 * Combines all pages into a single section list
 */
export function convertV3WebsiteToThemeSections(
  website: V3Website
): ThemeSection[] {
  const allSections: ThemeSection[] = [];
  let orderCounter = 0;

  // Process homepage first
  const homepage = website.pages.find(
    (p) => p.slug === "home" || p.slug === "/"
  );
  if (homepage) {
    const homeSections = convertV3PageToThemeSections(homepage);
    homeSections.forEach((section) => {
      section.order = orderCounter++;
      allSections.push(section);
    });
  }

  // Process other pages
  website.pages
    .filter((p) => p.slug !== "home" && p.slug !== "/")
    .forEach((page) => {
      const pageSections = convertV3PageToThemeSections(page);
      pageSections.forEach((section) => {
        section.order = orderCounter++;
        allSections.push(section);
      });
    });

  return allSections;
}

/**
 * Convert specific V3 page by slug to Content Wizard sections
 */
export function convertV3PageBySlug(
  website: V3Website,
  pageSlug: string
): ThemeSection[] | null {
  const page = website.pages.find((p) => p.slug === pageSlug);
  if (!page) return null;

  return convertV3PageToThemeSections(page);
}
