import { expect } from "chai";
import { generateAiStorefront } from "@/lib/ai/ai-storefront-service";
import type { AiStorefrontInput } from "@/lib/ai/ai-storefront-service";

describe("AI storefront service fallback generation", () => {
  it("always includes Customers and Testimonials (default 5) in stats when counts are zero", async () => {
    const input: AiStorefrontInput = {
      company: { id: "c1", name: "Acme Co" },
      products: [],
      services: [],
      testimonials: [],
      customersCount: 0,
      approvedTestimonialsCount: 0,
      prompt: "Make me a simple storefront",
      goal: "sell-products",
      tone: "minimal",
    };

    const result = await generateAiStorefront(input);
    if (!result.spec) throw new Error("AI did not return a spec");
    const statsSection = result.spec.sections.find((s) => s.type === "stats");
    void expect(statsSection).to.exist;
    void expect(statsSection).to.not.be.undefined;
    const rawItems =
      ((statsSection!.content as Record<string, unknown>).items as Array<{
        label?: string;
        value?: string;
      }>) || [];
    const customers = rawItems.find((it) =>
      (it.label || "").toLowerCase().includes("customer")
    );
    const testimonials = rawItems.find((it) =>
      (it.label || "").toLowerCase().includes("testimonial")
    );

    void expect(customers).to.exist;
    void expect(customers).to.not.be.undefined;
    expect(customers!.value).to.equal("0");

    void expect(testimonials).to.exist;
    void expect(testimonials).to.not.be.undefined;
    expect(testimonials!.value).to.equal("5");
  });

  it("always includes testimonials section with CTA fields", async () => {
    const input: AiStorefrontInput = {
      company: { id: "c1", name: "Acme Co" },
      products: [],
      services: [],
      testimonials: [],
      customersCount: 0,
      approvedTestimonialsCount: 0,
      prompt: "Make me a simple storefront",
      goal: "sell-products",
      tone: "minimal",
    };

    const result = await generateAiStorefront(input);
    if (!result.spec) throw new Error("AI did not return a spec");
    const testimonials = result.spec.sections.find(
      (s) => s.type === "testimonials"
    );
    void expect(testimonials).to.exist;
    void expect(testimonials).to.not.be.undefined;
    const content = testimonials!.content as Record<string, unknown>;
    const hasCta = !!(content.ctaLabel || content.ctaText);
    void expect(hasCta).to.be.true;
  });

  it("populates fallback SEO metadata from input when model doesn't return spec", async () => {
    const input: AiStorefrontInput = {
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
    };

    const result = await generateAiStorefront(input);
    if (!result.spec) throw new Error("AI did not return a spec");
    void expect(result.spec.meta).to.exist;
    void expect(result.spec.meta).to.not.be.undefined;
    void expect(result.spec.meta.seo).to.exist;
    void expect(result.spec.meta.seo).to.not.be.undefined;

    // Assert seo exists for type narrowing
    if (!input.seo) throw new Error("test setup error: seo should be defined");

    expect(result.spec.meta.seo?.metaTitle).to.equal(input.seo.title);
    expect(result.spec.meta.seo?.metaDescription).to.equal(
      input.seo.description
    );
    expect(result.spec.meta.seo?.keywords).to.deep.equal(input.seo.keywords);
  });
});
