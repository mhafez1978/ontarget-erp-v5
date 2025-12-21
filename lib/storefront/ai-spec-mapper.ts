import {
  AiFrontstoreSpec,
  AiFrontstoreSection,
} from "@/lib/ai/ai-storefront-types";
import { defaultThemes, type ThemeSection } from "@/lib/storefront-themes";

export function mapAiSpecToThemeSections(
  spec: AiFrontstoreSpec,
  themeId: string
): ThemeSection[] | null {
  const theme = defaultThemes.find((t) => t.id === themeId);
  if (!theme) return null;

  const cloneSections: ThemeSection[] = theme.sections.map((section) => ({
    ...section,
    content: { ...section.content },
  }));

  const findAiSection = (type: AiFrontstoreSection["type"]) =>
    spec.sections.find((s) => s.type === type);

  const aiHero = findAiSection("hero");
  if (aiHero) {
    const heroThemeSection = cloneSections.find((s) => s.type === "hero");
    if (heroThemeSection) {
      const heroContent = aiHero.content as Record<string, unknown>;
      heroThemeSection.content = {
        ...heroThemeSection.content,
        heading:
          (heroContent.title as string) ||
          (heroThemeSection.content.heading as string),
        subheading:
          (heroContent.subtitle as string) ||
          (heroThemeSection.content.subheading as string),
        description:
          (heroContent.description as string) ||
          (heroThemeSection.content.description as string),
      };
    }
  }

  const aiProducts = findAiSection("product-grid");
  if (aiProducts) {
    const productsThemeSection = cloneSections.find(
      (s) => s.type === "featured-products"
    );
    if (productsThemeSection) {
      const productContent = aiProducts.content as Record<string, unknown>;
      productsThemeSection.content = {
        ...productsThemeSection.content,
        heading:
          (productContent.heading as string) ||
          (productsThemeSection.content.heading as string),
        description:
          (productContent.subheading as string) ||
          (productsThemeSection.content.description as string),
      };
    }
  }

  const aiTestimonials = findAiSection("testimonials");
  if (aiTestimonials) {
    const socialProofSection = cloneSections.find(
      (s) => s.type === "social-proof"
    );
    if (socialProofSection) {
      const testimonialContent = aiTestimonials.content as Record<
        string,
        unknown
      >;
      socialProofSection.content = {
        ...socialProofSection.content,
        heading:
          (testimonialContent.heading as string) ||
          (socialProofSection.content.heading as string),
        description:
          (testimonialContent.subheading as string) ||
          (socialProofSection.content.description as string),
      };
    }
  }

  return cloneSections;
}

const aiSpecMapper = { mapAiSpecToThemeSections };

export default aiSpecMapper;
