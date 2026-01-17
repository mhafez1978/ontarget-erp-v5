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

    // Load company context with real products data
    const { getCompanyContext } = await import(
      "@/lib/frontstore/v6-data-service"
    );
    const ctx = await getCompanyContext(companyId);

    // Build products data from real database records or use industry-aware fallbacks
    const productsData =
      ctx.products.length > 0
        ? ctx.products.slice(0, 8).map((p) => ({
            title: p.name,
            description:
              p.description ||
              `High-quality ${p.name.toLowerCase()} from ${ctx.company.name}`,
            price: p.price ? `$${p.price}` : undefined,
            category: p.category,
            inStock: p.inStock,
            badge: p.inStock ? undefined : "Out of Stock",
          }))
        : generateFallbackProducts(ctx);

    const now = Date.now();

    // Generate 4 DESIGN variants (Material, Apple, Minimalist, Bold)
    const variants: Record<string, unknown>[] = [];

    // Variant 1: Material Design - Product Grid
    variants.push({
      id: `prod-material-${now}`,
      title: "Material Design Product Grid",
      type: "products",
      designSystem: "material",
      layout: "grid",
      schema: {
        headline: "Our Products",
        subheadline: `Discover ${
          ctx.stats.totalProducts > 0
            ? `${ctx.stats.totalProducts} premium`
            : "quality"
        } products`,
        products: productsData,
        columns: 4,
        showPricing: true,
        showQuickView: true,
        showAddToCart: true,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "material",
        typography: {
          headingFont: "Roboto",
          bodyFont: "Roboto",
          headingScale: 1.414,
          lineHeight: "1.5",
          priceFont: "Roboto Medium",
        },
        spacing: {
          sectionPadding: "80px",
          itemGap: "24px",
          cardPadding: "16px",
        },
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          accent: "#FF4081",
          cardBg: "#FFFFFF",
          priceBg: "#F5F5F5",
        },
        cardStyle: {
          borderRadius: "4px",
          elevation: "2",
          hoverElevation: "8",
        },
      },
    });

    // Variant 2: Apple HIG - Product Showcase
    variants.push({
      id: `prod-apple-${now}`,
      title: "Apple HIG Product Showcase",
      type: "products",
      designSystem: "apple",
      layout: "showcase",
      schema: {
        headline: "Shop Our Collection",
        subheadline: `Thoughtfully designed ${
          ctx.company.industry || "products"
        }`,
        products: productsData,
        columns: 3,
        showPricing: true,
        showQuickView: true,
        showAddToCart: true,
        largeImages: true,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        designSystem: "apple",
        typography: {
          headingFont: "SF Pro Display",
          bodyFont: "SF Pro Text",
          headingScale: 1.618,
          lineHeight: "1.4",
          priceFont: "SF Pro Display Medium",
        },
        spacing: {
          sectionPadding: "96px",
          itemGap: "40px",
          cardPadding: "0px",
        },
        colors: {
          primary: "#007AFF",
          secondary: "#8E8E93",
          accent: "#FF3B30",
          cardBg: "transparent",
          priceBg: "transparent",
        },
        cardStyle: {
          borderRadius: "18px",
          elevation: "none",
          hoverScale: "1.02",
        },
      },
    });

    // Variant 3: Minimalist - Clean Product Cards
    variants.push({
      id: `prod-minimal-${now}`,
      title: "Minimalist Product Cards",
      type: "products",
      designSystem: "minimalist",
      layout: "cards",
      schema: {
        headline: "Products",
        subheadline: "",
        products: productsData,
        columns: 3,
        showPricing: true,
        showQuickView: false,
        showAddToCart: true,
        minimalUI: true,
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
          priceFont: "Inter Medium",
        },
        spacing: {
          sectionPadding: "120px",
          itemGap: "64px",
          cardPadding: "0px",
        },
        colors: {
          primary: "#000000",
          secondary: "#666666",
          accent: "#000000",
          cardBg: "transparent",
          priceBg: "transparent",
        },
        cardStyle: {
          borderRadius: "0px",
          border: "1px solid #E5E5E5",
          hoverBorder: "1px solid #000000",
        },
      },
    });

    // Variant 4: Bold & Vibrant - Dynamic Product Grid
    variants.push({
      id: `prod-bold-${now}`,
      title: "Bold Product Grid",
      type: "products",
      designSystem: "bold",
      layout: "dynamic-grid",
      schema: {
        headline: `🛍️ Shop ${
          ctx.stats.totalProducts > 0 ? ctx.stats.totalProducts : "Premium"
        } Products`,
        subheadline: `Curated collection for ${ctx.company.industry || "you"}`,
        products: productsData,
        columns: 4,
        showPricing: true,
        showQuickView: true,
        showAddToCart: true,
        showBadges: true,
        useGradients: true,
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
          priceFont: "Montserrat Bold",
        },
        spacing: {
          sectionPadding: "64px",
          itemGap: "16px",
          cardPadding: "20px",
        },
        colors: {
          primary: "#FF6B6B",
          secondary: "#4ECDC4",
          accent: "#FFE66D",
          cardBg: "#FFFFFF",
          priceBg: "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)",
        },
        cardStyle: {
          borderRadius: "16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          hoverTransform: "translateY(-8px)",
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
        message: `Generated ${variants.length} product section variants with real data`,
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

// Fallback products generator when DB is empty
function generateFallbackProducts(ctx: {
  company: { name: string; industry: string | null };
  stats: { totalProducts: number };
}): Array<{
  title: string;
  description: string;
  price: string;
  category: string;
  badge?: string;
}> {
  const industry = ctx.company.industry || "retail";
  const companyName = ctx.company.name;

  const industryProducts: Record<
    string,
    Array<{ title: string; price: string; category: string }>
  > = {
    retail: [
      { title: "Premium Cotton T-Shirt", price: "$29.99", category: "Apparel" },
      { title: "Classic Denim Jeans", price: "$79.99", category: "Apparel" },
      { title: "Leather Wallet", price: "$49.99", category: "Accessories" },
      {
        title: "Stainless Steel Watch",
        price: "$199.99",
        category: "Accessories",
      },
    ],
    technology: [
      { title: "Wireless Keyboard", price: "$129.99", category: "Peripherals" },
      { title: "USB-C Hub", price: "$79.99", category: "Accessories" },
      { title: "Laptop Stand", price: "$49.99", category: "Accessories" },
      { title: "Screen Protector", price: "$19.99", category: "Protection" },
    ],
    food_beverage: [
      { title: "Artisan Coffee Blend", price: "$18.99", category: "Coffee" },
      { title: "Organic Tea Collection", price: "$24.99", category: "Tea" },
      { title: "Gourmet Cookie Box", price: "$29.99", category: "Bakery" },
      { title: "Specialty Spice Set", price: "$34.99", category: "Spices" },
    ],
    health_wellness: [
      { title: "Yoga Mat Pro", price: "$69.99", category: "Fitness" },
      { title: "Resistance Band Set", price: "$29.99", category: "Equipment" },
      { title: "Foam Roller", price: "$39.99", category: "Recovery" },
      { title: "Water Bottle", price: "$24.99", category: "Hydration" },
    ],
  };

  const products = industryProducts[industry] || industryProducts.retail;

  return products.map((p) => ({
    ...p,
    description: `Premium quality ${p.title.toLowerCase()} from ${companyName}`,
    badge: Math.random() > 0.5 ? "Featured" : undefined,
  }));
}
