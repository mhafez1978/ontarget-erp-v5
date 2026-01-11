import type { NextRequest } from "next/server";
import type { GeneratedSection } from "@prisma/client";

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

    // Load company context with real services data
    const { getCompanyContext, generateFallbackServicesContent } = await import(
      "@/lib/frontstore/v6-data-service"
    );
    const ctx = await getCompanyContext(companyId);
    const servicesData =
      ctx.services.length > 0
        ? ctx.services.slice(0, 6).map((s) => ({
            title: s.name,
            description:
              s.description || `Professional ${s.name.toLowerCase()} service`,
            price: s.price ? `$${s.price}` : undefined,
            duration: s.duration ? `${s.duration} min` : undefined,
            category: s.category,
          }))
        : generateFallbackServicesContent(ctx);

    const now = Date.now();

    // Generate 4 DESIGN variants (not just asset variants)
    const variants: Record<string, unknown>[] = [];

    // Variant 1: Material Design - Grid Layout
    variants.push({
      id: `svc-material-${now}`,
      title: "Material Design Grid",
      type: "services",
      designSystem: "material",
      layout: "grid",
      schema: {
        headline: "Our Services",
        subheadline: `${
          ctx.stats.totalServices > 0 ? ctx.stats.totalServices : "Premium"
        } professional services to meet your needs`,
        services: servicesData,
        columns: 3,
        showPricing: servicesData.some((s) => s.price),
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "material",
        typography: {
          headingFont: "Roboto",
          bodyFont: "Roboto",
          headingScale: 1.414,
          lineHeight: "1.5",
        },
        spacing: {
          sectionPadding: "80px",
          itemGap: "24px",
        },
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          accent: "#FF4081",
        },
      },
    });

    // Variant 2: Apple HIG - List Layout
    variants.push({
      id: `svc-apple-${now}`,
      title: "Apple HIG List",
      type: "services",
      designSystem: "apple",
      layout: "list",
      schema: {
        headline: "What We Offer",
        subheadline: `Expertly crafted ${
          ctx.company.industry || "services"
        } for your success`,
        services: servicesData,
        showIcons: true,
        showPricing: servicesData.some((s) => s.price),
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "apple",
        typography: {
          headingFont: "SF Pro Display",
          bodyFont: "SF Pro Text",
          headingScale: 1.618,
          lineHeight: "1.4",
        },
        spacing: {
          sectionPadding: "96px",
          itemGap: "32px",
        },
        colors: {
          primary: "#007AFF",
          secondary: "#8E8E93",
          accent: "#FF3B30",
        },
      },
    });

    // Variant 3: Minimalist - Cards Layout
    variants.push({
      id: `svc-minimal-${now}`,
      title: "Minimalist Cards",
      type: "services",
      designSystem: "minimalist",
      layout: "cards",
      schema: {
        headline: "Services",
        subheadline: "",
        services: servicesData,
        columns: 2,
        showPricing: servicesData.some((s) => s.price),
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "minimalist",
        typography: {
          headingFont: "Inter",
          bodyFont: "Inter",
          headingScale: 1.25,
          lineHeight: "1.6",
          letterSpacing: "-0.02em",
        },
        spacing: {
          sectionPadding: "120px",
          itemGap: "48px",
        },
        colors: {
          primary: "#000000",
          secondary: "#666666",
          accent: "#000000",
        },
      },
    });

    // Variant 4: Bold & Vibrant - Masonry Layout
    variants.push({
      id: `svc-bold-${now}`,
      title: "Bold Masonry",
      type: "services",
      designSystem: "bold",
      layout: "masonry",
      schema: {
        headline: `🔥 ${
          ctx.stats.totalServices > 0 ? ctx.stats.totalServices : "Premium"
        } Services That Deliver`,
        subheadline: `Elevate your ${
          ctx.company.industry || "business"
        } with our expert solutions`,
        services: servicesData,
        showGradients: true,
        showPricing: servicesData.some((s) => s.price),
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "bold",
        typography: {
          headingFont: "Montserrat",
          bodyFont: "Open Sans",
          headingScale: 1.5,
          lineHeight: "1.5",
          fontWeight: "700",
        },
        spacing: {
          sectionPadding: "64px",
          itemGap: "20px",
        },
        colors: {
          primary: "#FF6B6B",
          secondary: "#4ECDC4",
          accent: "#FFE66D",
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
        message: `Generated ${variants.length} service section variants with real data`,
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
