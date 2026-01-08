/**
 * V3 to Content Wizard Mapper
 *
 * Converts V3 website sections to Content Wizard (ThemeSection) format
 */

import type { V3Website, V3Page, V3Section } from "./v3-types.ts";
import type { ThemeSection } from "@/lib/storefront-themes";

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
function convertSectionContent(
  section: V3Section,
  _pageSlug: string
): ThemeSection["content"] {
  const content = section.content as any;
  const type = section.type;

  // Hero section
  if (type === "hero") {
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      description: content.description || "",
      ctaText: content.ctaText || "Learn More",
      ctaLink: content.ctaLink || "#",
      backgroundImage: content.backgroundImage || "",
      showCta: !!content.ctaText,
    };
  }

  // Features/Highlights
  if (type === "features") {
    const items = Array.isArray(content) ? content : [];
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      items: items.map((item: any) => ({
        icon: item.icon || "Sparkles",
        title: item.title || "",
        description: item.description || "",
        image: item.image || undefined,
      })),
    };
  }

  // Catalog/Products/Services
  if (type === "catalog" || type === "pricing") {
    const items = Array.isArray(content) ? content : [];
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      items: items.map((item: any) => ({
        name: item.name || "",
        description: item.description || "",
        price: item.price || 0,
        image: item.image || "",
        category: item.category || "",
      })),
    };
  }

  // Testimonials
  if (type === "testimonials") {
    const items = Array.isArray(content) ? content : [];
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      testimonials: items.map((item: any) => ({
        quote: item.quote || item.testimonial || "",
        author: item.author || item.customerName || "",
        role: item.role || item.customerTitle || "",
        photo: item.photo || item.customerPhoto || "",
        rating: item.rating || 5,
      })),
    };
  }

  // About section
  if (type === "about") {
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      description:
        typeof content === "object"
          ? content.description || ""
          : String(content),
      image: typeof content === "object" ? content.image || "" : "",
    };
  }

  // FAQ section
  if (type === "faq") {
    const items = Array.isArray(content) ? content : [];
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      faqs: items.map((item: any) => ({
        question: item.question || "",
        answer: item.answer || "",
      })),
    };
  }

  // CTA section
  if (type === "cta") {
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      description: content.description || "",
      buttonText: content.buttonText || content.ctaText || "Get Started",
      buttonLink: content.buttonLink || content.ctaLink || "#",
      backgroundImage: content.backgroundImage || "",
    };
  }

  // Contact section
  if (type === "contact") {
    const locations = content.locations || [];
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      email: content.email || locations[0]?.email || "",
      phone: content.phone || locations[0]?.phone || "",
      address: content.address || locations[0]?.address || "",
      locations: locations.map((loc: any) => ({
        name: loc.name || "",
        type: loc.type || "",
        address: loc.address || "",
        city: loc.city || "",
        state: loc.state || "",
        country: loc.country || "",
        phone: loc.phone || "",
        email: loc.email || "",
      })),
    };
  }

  // Team section
  if (type === "team") {
    const items = Array.isArray(content) ? content : [];
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      members: items.map((item: any) => ({
        name: item.name || "",
        role: item.role || "",
        bio: item.bio || "",
        photo: item.photo || item.image || "",
      })),
    };
  }

  // Portfolio section
  if (type === "portfolio") {
    const items = Array.isArray(content) ? content : [];
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      projects: items.map((item: any) => ({
        title: item.title || item.name || "",
        description: item.description || "",
        image: item.image || "",
        link: item.link || "#",
      })),
    };
  }

  // Stats section
  if (type === "stats") {
    const items = Array.isArray(content) ? content : [];
    return {
      heading: section.heading,
      subheading: section.subheading || "",
      stats: items.map((item: any) => ({
        value: item.value || item.number || "",
        label: item.label || item.description || "",
        icon: item.icon || "TrendingUp",
      })),
    };
  }

  // Generic fallback
  return {
    heading: section.heading,
    subheading: section.subheading || "",
    ...content,
  };
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
      content: convertSectionContent(section, page.slug),
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
