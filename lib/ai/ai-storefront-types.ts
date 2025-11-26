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
  type: aiFrontstoreSectionTypeSchema,
  order: z.number().int(),
  content: z.record(z.string(), z.unknown()),
  layout: z.record(z.string(), z.unknown()).optional(),
  styling: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
      gradient: z.string().optional(),
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
  }),
  sections: z.array(aiFrontstoreSectionSchema),
});

export type AiFrontstoreSectionType = z.infer<
  typeof aiFrontstoreSectionTypeSchema
>;

export type AiFrontstoreSection = z.infer<typeof aiFrontstoreSectionSchema>;

export type AiFrontstoreSpec = z.infer<typeof aiFrontstoreSpecSchema>;
