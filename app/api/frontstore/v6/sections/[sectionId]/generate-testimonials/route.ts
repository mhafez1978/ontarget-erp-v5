import type { NextRequest } from "next/server";
import type { GeneratedSection } from "@/generated/prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ sectionId: string }> }
) {
  const params = await context.params;
  try {
    const { sectionId } = params;
    const { pathToFileURL } = await import("url");
    const vs = await import(
      pathToFileURL(`${process.cwd()}/lib/validate-session.ts`).href
    );
    const validation = await vs.validateSessionForAPI(req);
    if (!validation.valid) return validation.response;
    const user = validation.user;
    const firstCompany = user.ownedCompanies?.[0];
    const companyId = user.companyId || firstCompany?.id;
    if (!companyId)
      return new Response(JSON.stringify({ error: "No company context" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    const dbModule = await import(
      pathToFileURL(`${process.cwd()}/lib/db.ts`).href
    );
    const db = dbModule.db;

    const section = (await db.generatedSection.findUnique({
      where: { id: sectionId },
    })) as GeneratedSection | null;
    if (!section)
      return new Response(JSON.stringify({ error: "Section not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    if (section.companyId !== companyId)
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });

    // Load company context with real testimonials data
    const { getCompanyContext, generateFallbackTestimonials } = await import(
      "@/lib/frontstore/v6-data-service"
    );
    const ctx = await getCompanyContext(companyId);

    // Build testimonials data from real database records or use fallbacks
    const testimonialsData =
      ctx.testimonials.length > 0
        ? ctx.testimonials.slice(0, 6).map((t) => ({
            id: t.id,
            author: t.customerName,
            role: t.position || "Customer",
            content: t.content,
            rating: t.rating || 5,
            date: new Date().toISOString(),
            verified: true,
            company: t.companyName || undefined,
          }))
        : generateFallbackTestimonials(ctx);

    const now = Date.now();

    // Generate 4 DESIGN variants with schema.org markup
    const variants: Record<string, unknown>[] = [];

    // Variant 1: Material Design - Card Grid
    variants.push({
      id: `test-material-${now}`,
      title: "Material Design Testimonial Cards",
      type: "testimonials",
      designSystem: "material",
      layout: "card-grid",
      schema: {
        headline: "What Our Clients Say",
        subheadline: `Trusted by ${
          ctx.stats.totalTestimonials > 0
            ? ctx.stats.totalTestimonials
            : "hundreds of"
        } satisfied customers`,
        testimonials: testimonialsData,
        columns: 3,
        showRatings: true,
        showDates: false,
        showPhotos: false,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "material",
        typography: {
          headingFont: "Roboto",
          bodyFont: "Roboto",
          headingScale: 1.414,
          lineHeight: "1.6",
          quoteFont: "Roboto Slab",
        },
        spacing: {
          sectionPadding: "80px",
          itemGap: "24px",
          cardPadding: "24px",
        },
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          accent: "#FF4081",
          cardBg: "#F5F5F5",
          quoteMark: "#E0E0E0",
        },
        seo: {
          schemaType: "Review",
          itemReviewed: ctx.company.name,
          ratingValue: calculateAverageRating(testimonialsData),
          reviewCount: testimonialsData.length,
        },
      },
    });

    // Variant 2: Apple HIG - Minimal Quotes
    variants.push({
      id: `test-apple-${now}`,
      title: "Apple HIG Minimal Quotes",
      type: "testimonials",
      designSystem: "apple",
      layout: "minimal-quotes",
      schema: {
        headline: "Testimonials",
        subheadline: `Stories from people who love ${ctx.company.name}`,
        testimonials: testimonialsData,
        columns: 2,
        showRatings: true,
        showDates: false,
        showPhotos: true,
        largeQuotes: true,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "apple",
        typography: {
          headingFont: "SF Pro Display",
          bodyFont: "SF Pro Text",
          headingScale: 1.618,
          lineHeight: "1.5",
          quoteFont: "New York",
        },
        spacing: {
          sectionPadding: "96px",
          itemGap: "48px",
          cardPadding: "32px",
        },
        colors: {
          primary: "#007AFF",
          secondary: "#8E8E93",
          accent: "#FF3B30",
          cardBg: "transparent",
          quoteMark: "#D1D1D6",
        },
        seo: {
          schemaType: "Review",
          itemReviewed: ctx.company.name,
          ratingValue: calculateAverageRating(testimonialsData),
          reviewCount: testimonialsData.length,
        },
      },
    });

    // Variant 3: Minimalist - Text Focus
    variants.push({
      id: `test-minimal-${now}`,
      title: "Minimalist Text Focus",
      type: "testimonials",
      designSystem: "minimalist",
      layout: "text-focus",
      schema: {
        headline: "Reviews",
        subheadline: "",
        testimonials: testimonialsData,
        columns: 1,
        showRatings: false,
        showDates: true,
        showPhotos: false,
        centerAlign: true,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "minimalist",
        typography: {
          headingFont: "Inter",
          bodyFont: "Inter",
          headingScale: 1.25,
          lineHeight: "1.8",
          letterSpacing: "-0.01em",
          quoteFont: "Georgia",
        },
        spacing: {
          sectionPadding: "120px",
          itemGap: "80px",
          cardPadding: "0px",
        },
        colors: {
          primary: "#000000",
          secondary: "#666666",
          accent: "#000000",
          cardBg: "transparent",
          quoteMark: "#E5E5E5",
        },
        seo: {
          schemaType: "Review",
          itemReviewed: ctx.company.name,
          ratingValue: calculateAverageRating(testimonialsData),
          reviewCount: testimonialsData.length,
        },
      },
    });

    // Variant 4: Bold - Featured Testimonials
    variants.push({
      id: `test-bold-${now}`,
      title: "Bold Featured Testimonials",
      type: "testimonials",
      designSystem: "bold",
      layout: "featured",
      schema: {
        headline: `⭐ ${
          testimonialsData.filter((t) => t.rating === 5).length
        } Five-Star Reviews`,
        subheadline: `Join ${
          ctx.stats.totalTestimonials > 0
            ? `${ctx.stats.totalTestimonials} happy customers`
            : "our satisfied customers"
        }`,
        testimonials: testimonialsData,
        columns: 2,
        showRatings: true,
        showDates: false,
        showPhotos: true,
        useGradients: true,
        highlightBest: true,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "bold",
        typography: {
          headingFont: "Montserrat",
          bodyFont: "Open Sans",
          headingScale: 1.5,
          lineHeight: "1.6",
          fontWeight: "700",
          quoteFont: "Merriweather",
        },
        spacing: {
          sectionPadding: "64px",
          itemGap: "24px",
          cardPadding: "32px",
        },
        colors: {
          primary: "#FF6B6B",
          secondary: "#4ECDC4",
          accent: "#FFE66D",
          cardBg: "#FFFFFF",
          quoteMark: "#FFE66D",
          gradientBg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        },
        seo: {
          schemaType: "Review",
          itemReviewed: ctx.company.name,
          ratingValue: calculateAverageRating(testimonialsData),
          reviewCount: testimonialsData.length,
        },
      },
    });

    const newVariants = [
      ...(Array.isArray(section.variants) ? section.variants : []),
      ...variants,
    ];

    // Update section with new variants
    await db.generatedSection.update({
      where: { id: sectionId },
      data: { variants: newVariants },
    });

    return new Response(
      JSON.stringify({
        success: true,
        variants: newVariants,
        message: `Generated ${variants.length} testimonial section variants with schema.org markup`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Calculate average rating for schema.org
function calculateAverageRating(
  testimonials: Array<{ rating?: number }>
): number {
  const ratingsOnly = testimonials
    .map((t) => t.rating)
    .filter((r): r is number => typeof r === "number");
  if (ratingsOnly.length === 0) return 5.0;
  const sum = ratingsOnly.reduce((acc, r) => acc + r, 0);
  return Math.round((sum / ratingsOnly.length) * 10) / 10;
}
