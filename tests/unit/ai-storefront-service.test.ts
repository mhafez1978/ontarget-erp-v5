import { expect } from "chai";
import { generateAiStorefront } from "@/lib/ai/ai-storefront-service";

describe("AI storefront service fallback generation", () => {
  it("always includes Customers and Testimonials (default 5) in stats when counts are zero", async () => {
    const input = {
      company: { id: "c1", name: "Acme Co" },
      products: [],
      services: [],
      testimonials: [],
      customersCount: 0,
      approvedTestimonialsCount: 0,
      prompt: "Make me a simple storefront",
      goal: "sell-products",
      tone: "minimal",
    } as any;

    const result = await generateAiStorefront(input);
    const statsSection = result.spec.sections.find((s) => s.type === "stats");
    expect(statsSection, "stats section should exist").to.exist;
    const rawItems = (statsSection!.content as any).items || [];
    const customers = rawItems.find((it: any) =>
      (it.label || "").toLowerCase().includes("customer")
    );
    const testimonials = rawItems.find((it: any) =>
      (it.label || "").toLowerCase().includes("testimonial")
    );

    expect(customers, "customers item should be present").to.exist;
    expect(customers!.value).to.equal("0");

    expect(testimonials, "testimonials should be present").to.exist;
    expect(testimonials!.value).to.equal("5");
  });

  it("always includes testimonials section with CTA fields", async () => {
    const input = {
      company: { id: "c1", name: "Acme Co" },
      products: [],
      services: [],
      testimonials: [],
      customersCount: 0,
      approvedTestimonialsCount: 0,
      prompt: "Make me a simple storefront",
      goal: "sell-products",
      tone: "minimal",
    } as any;

    const result = await generateAiStorefront(input);
    const testimonials = result.spec.sections.find(
      (s) => s.type === "testimonials"
    );
    expect(testimonials, "testimonials section should exist").to.exist;
    const content = testimonials!.content as Record<string, any>;
    expect(content.ctaLabel || content.ctaText).to.exist;
  });

  it("populates fallback SEO metadata from input when model doesn't return spec", async () => {
    const input = {
      company: { id: "c1", name: "Acme Co" },
      products: [],
      services: [],
      testimonials: [],
      customersCount: 0,
      approvedTestimonialsCount: 0,
      prompt: "Make me a simple storefront",
      goal: "sell-products",
      tone: "minimal",
      seo: {
        title: "Acme Store - Best Widgets",
        description: "Buy the best widgets at Acme Store",
        keywords: ["widgets", "acme", "shop"],
      },
    } as any;

    const result = await generateAiStorefront(input);
    expect(result.spec.meta).to.exist;
    expect(result.spec.meta.seo).to.exist;
    expect(result.spec.meta.seo?.metaTitle).to.equal(input.seo.title);
    expect(result.spec.meta.seo?.metaDescription).to.equal(
      input.seo.description
    );
    expect(result.spec.meta.seo?.keywords).to.deep.equal(input.seo.keywords);
  });
});
