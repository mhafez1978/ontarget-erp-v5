import { z } from "zod";

export const aiFrontstoreSectionTypeSchema = z.enum([
  "hero",
  "highlights",
  "product-grid",
  "service-grid",
  "posts",
  "testimonials",
  "stats",
  "faq",
  "contact",
  "cta-band",
]);

export const aiFrontstoreSectionSchema = z.object({
  id: z.string(),
  className: z.string().optional(),
  type: aiFrontstoreSectionTypeSchema,
  order: z.number().int(),
  content: z.record(z.string(), z.unknown()),
  layout: z.record(z.string(), z.unknown()).optional(),
  styling: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      gradient: z.string().optional(),
      // Per-section optional background / imagery
      backgroundImage: z
        .object({ url: z.string().optional(), alt: z.string().optional() })
        .optional(),
      overlayColor: z.string().optional(),
      overlayOpacity: z.number().min(0).max(1).optional(),
      // Per-section animation hints (e.g. "fade-up", "slide-in")
      animations: z.array(z.string()).optional(),
    })
    .optional(),
});

export const aiFrontstoreSpecSchema = z.object({
  version: z.literal(1),
  meta: z.object({
    layoutStyle: z.enum(["hero-left", "hero-split", "magazine", "one-page"]),
    tone: z.enum(["playful", "serious", "luxury", "minimal"]),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    heroSize: z.enum(["compact", "full"]).optional(),
    buttonStyle: z.enum(["solid", "outline", "pill"]).optional(),
    cornerStyle: z.enum(["rounded", "soft", "sharp"]).optional(),
    // Optional high-level hero/background image. Prefer an internal asset key or URL.
    backgroundImage: z
      .object({ url: z.string().optional(), alt: z.string().optional() })
      .optional(),
    // Overlay when a background image is present to help text contrast.
    overlayColor: z.string().optional(),
    overlayOpacity: z.number().min(0).max(1).optional(),
    // Animation hints the renderer can use for subtle effects (fade, slide, parallax)
    animations: z.array(z.string()).optional(),
    // SEO metadata helpers for export to Content Wizard
    seo: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      })
      .optional(),
  }),
  sections: z.array(aiFrontstoreSectionSchema),
});

export const StorefrontTestimonialSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string().optional(),
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

export type StorefrontTestimonial = z.infer<typeof StorefrontTestimonialSchema>;

export type FeaturedTeamMember = z.infer<typeof FeaturedTeamMemberSchema>;

export type FeaturedService = z.infer<typeof FeaturedServiceSchema>;

export type FeaturedProduct = z.infer<typeof FeaturedProductSchema>;
