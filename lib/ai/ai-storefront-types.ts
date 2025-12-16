import { z } from "zod";

export const aiFrontstoreSectionTypeSchema = z.enum([
  "hero",
  "highlights",
  "product-grid",
  "service-grid",
  "portfolio",
  "posts",
  "testimonials",
  "stats",
  "faq",
  "contact",
  "contact-map",
  "cta-band",
]);

export const aiFrontstoreSectionSchema = z.object({
  id: z.string(),
  className: z.string().optional(),
  type: aiFrontstoreSectionTypeSchema,
  order: z.number().int(),
  content: z.record(z.string(), z.unknown()),
  layout: z
    .object({
      contentWidth: z.enum(["narrow", "medium", "wide", "full"]).optional(),
      contentAlignment: z.enum(["left", "center", "right"]).optional(),
      verticalPadding: z
        .enum(["none", "small", "medium", "large", "extra-large"])
        .optional(),
      horizontalPadding: z
        .enum(["none", "small", "medium", "large"])
        .optional(),
      itemsPerRow: z.number().min(1).max(6).optional(), // For grids
      itemSpacing: z.enum(["tight", "normal", "relaxed", "loose"]).optional(),
    })
    .optional(),
  styling: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      gradient: z.string().optional(),
      // Background image
      backgroundImage: z
        .object({
          url: z.string().optional(),
          alt: z.string().optional(),
          position: z
            .enum(["center", "top", "bottom", "left", "right"])
            .optional(),
          size: z.enum(["cover", "contain", "auto"]).optional(),
          parallax: z.boolean().optional(),
        })
        .optional(),
      // Video background
      backgroundVideo: z
        .object({
          url: z.string(),
          poster: z.string().optional(), // Fallback image
          loop: z.boolean().optional(),
          muted: z.boolean().optional(),
          autoplay: z.boolean().optional(),
        })
        .optional(),
      overlayColor: z.string().optional(),
      overlayOpacity: z.number().min(0).max(1).optional(),
      // Border and shadow overrides
      border: z
        .object({
          width: z.string().optional(),
          color: z.string().optional(),
          style: z.enum(["solid", "dashed", "dotted", "none"]).optional(),
          radius: z.string().optional(),
        })
        .optional(),
      shadow: z.string().optional(), // CSS box-shadow value
      // Per-section animation hints (e.g. "fade-up", "slide-in", "parallax")
      animations: z.array(z.string()).optional(),
      // Hover effects for interactive sections
      hoverEffect: z.enum(["none", "lift", "scale", "glow", "tilt"]).optional(),
    })
    .optional(),
});

export const aiFrontstoreSpecSchema = z.object({
  version: z.literal(1),
  meta: z.object({
    layoutStyle: z.enum([
      "hero-left",
      "hero-split",
      "magazine",
      "one-page",
      "asymmetric",
      "centered",
      "minimal",
      "bold",
    ]),
    tone: z.enum(["playful", "serious", "luxury", "minimal"]),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    heroSize: z.enum(["compact", "full", "extra-large", "minimal"]).optional(),
    buttonStyle: z
      .enum(["solid", "outline", "pill", "ghost", "3d", "underline"])
      .optional(),
    cornerStyle: z
      .enum(["rounded", "soft", "sharp", "extra-rounded"])
      .optional(),
    // Typography system
    typography: z
      .object({
        headingFont: z.string().optional(), // e.g., "Inter", "Playfair Display", "Space Grotesk"
        bodyFont: z.string().optional(),
        headingWeight: z
          .enum(["light", "normal", "medium", "semibold", "bold", "extrabold"])
          .optional(),
        bodyWeight: z
          .enum(["light", "normal", "medium", "semibold"])
          .optional(),
        headingSize: z
          .enum(["small", "medium", "large", "extra-large"])
          .optional(),
        bodySize: z.enum(["small", "medium", "large"]).optional(),
        lineHeight: z.enum(["tight", "normal", "relaxed", "loose"]).optional(),
        letterSpacing: z.enum(["tight", "normal", "wide", "wider"]).optional(),
      })
      .optional(),
    // Spacing system
    spacing: z
      .object({
        scale: z.enum(["compact", "normal", "relaxed", "spacious"]).optional(),
        sectionGap: z
          .enum(["small", "medium", "large", "extra-large"])
          .optional(),
        containerMaxWidth: z
          .enum(["sm", "md", "lg", "xl", "2xl", "full"])
          .optional(),
      })
      .optional(),
    // Grid and layout controls
    grid: z
      .object({
        columns: z.number().min(1).max(12).optional(),
        productCardStyle: z
          .enum(["minimal", "card", "overlay", "hover-lift"])
          .optional(),
        imageAspectRatio: z
          .enum(["square", "portrait", "landscape", "wide", "ultra-wide"])
          .optional(),
        gap: z.enum(["tight", "normal", "relaxed", "loose"]).optional(),
      })
      .optional(),
    // Visual effects
    effects: z
      .object({
        shadows: z
          .enum(["none", "soft", "medium", "hard", "colored"])
          .optional(),
        borders: z
          .enum(["none", "thin", "medium", "thick", "colorful"])
          .optional(),
        gradients: z.boolean().optional(),
        glassmorphism: z.boolean().optional(),
        animations: z.enum(["none", "subtle", "moderate", "bold"]).optional(),
      })
      .optional(),
    styleFamily: z.string().optional(), // e.g., "brutalist", "swiss", "neo-tech", "warm-organic", "glassmorphic"
    // Optional high-level hero/background image
    backgroundImage: z
      .object({
        url: z.string().optional(),
        alt: z.string().optional(),
        position: z
          .enum(["center", "top", "bottom", "left", "right"])
          .optional(),
        size: z.enum(["cover", "contain", "auto"]).optional(),
        parallax: z.boolean().optional(),
      })
      .optional(),
    // Optional hero/background video
    backgroundVideo: z
      .object({
        url: z.string(),
        poster: z.string().optional(), // Fallback image when video not supported
        loop: z.boolean().optional(),
        muted: z.boolean().optional(),
        autoplay: z.boolean().optional(),
      })
      .optional(),
    // Overlay when a background image/video is present to help text contrast
    overlayColor: z.string().optional(),
    overlayOpacity: z.number().min(0).max(1).optional(),
    // Animation hints the renderer can use for subtle effects (fade, slide, parallax)
    animations: z.array(z.string()).optional(),
    // Navigation style
    navigation: z
      .object({
        style: z
          .enum(["floating", "sticky", "transparent", "solid", "minimal"])
          .optional(),
        position: z.enum(["top", "side"]).optional(),
      })
      .optional(),
    // SEO metadata helpers for export to Content Wizard
    seo: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        ogImage: z.string().url().optional(),
      })
      .optional(),
  }),
  sections: z.array(aiFrontstoreSectionSchema),
});

export const StorefrontTestimonialSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string().optional(),
  quote: z.string(),
  image: z.string().url().optional(),
});

export const FeaturedTeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().optional(),
  image: z.string().url().optional(),
});

export const PortfolioProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  client: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

export const FeaturedServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string().url().optional(),
});

export const FeaturedProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  image: z.string().url().optional(),
});

export type AiFrontstoreSectionType = z.infer<
  typeof aiFrontstoreSectionTypeSchema
>;
export type AiFrontstoreSection = z.infer<typeof aiFrontstoreSectionSchema>;

export type AiFrontstoreSpec = z.infer<typeof aiFrontstoreSpecSchema>;
export type AiFrontstoreSection = z.infer<typeof aiFrontstoreSectionSchema>;

export type AiFrontstoreSpec = z.infer<typeof aiFrontstoreSpecSchema>;

export type StorefrontTestimonial = z.infer<typeof StorefrontTestimonialSchema>;

export type FeaturedTeamMember = z.infer<typeof FeaturedTeamMemberSchema>;

export type FeaturedService = z.infer<typeof FeaturedServiceSchema>;

export type FeaturedProduct = z.infer<typeof FeaturedProductSchema>;

export type PortfolioProject = z.infer<typeof PortfolioProjectSchema>;
