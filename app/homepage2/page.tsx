import { cache } from "react";
import dynamicImport from "next/dynamic";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Lazy load components
const ModernHero = dynamicImport(() =>
  import("@/components/homepage2/ModernHero").then((m) => ({
    default: m.ModernHero,
  }))
);
const InteractiveFeatures = dynamicImport(() =>
  import("@/components/homepage2/InteractiveFeatures").then((m) => ({
    default: m.InteractiveFeatures,
  }))
);
const StatsBanner = dynamicImport(() =>
  import("@/components/homepage2/StatsBanner").then((m) => ({
    default: m.StatsBanner,
  }))
);
const IndustryShowcase = dynamicImport(() =>
  import("@/components/homepage2/IndustryShowcase").then((m) => ({
    default: m.IndustryShowcase,
  }))
);
const TechStackSection = dynamicImport(() =>
  import("@/components/homepage2/TechStackSection").then((m) => ({
    default: m.TechStackSection,
  }))
);
const ComparisonTable = dynamicImport(() =>
  import("@/components/homepage2/ComparisonTable").then((m) => ({
    default: m.ComparisonTable,
  }))
);
const TestimonialsCarousel = dynamicImport(() =>
  import("@/components/homepage2/TestimonialsCarousel").then((m) => ({
    default: m.TestimonialsCarousel,
  }))
);
const PricingCards = dynamicImport(() =>
  import("@/components/homepage2/PricingCards").then((m) => ({
    default: m.PricingCards,
  }))
);
const FinalCTA = dynamicImport(() =>
  import("@/components/homepage2/FinalCTA").then((m) => ({
    default: m.FinalCTA,
  }))
);
const ContactSection = dynamicImport(() =>
  import("@/components/contact-section").then((m) => ({
    default: m.ContactSection,
  }))
);
const Footer = dynamicImport(() =>
  import("@/components/homepage/Footer").then((m) => ({ default: m.Footer }))
);

// Cached data fetching
const getRootCompany = cache(async () => {
  return db.company.findFirst({
    where: { isRoot: true },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
});

const getPricingData = async () => {
  try {
    return await db.planPricing.findMany({
      orderBy: { monthlyPrice: "asc" },
    });
  } catch (error) {
    console.error("Error fetching plan pricing:", error);
    return [];
  }
};

const getTestimonials = cache(async (companyId: string) => {
  return db.testimonial.findMany({
    where: { companyId, status: "APPROVED", isFeatured: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    take: 12,
    select: {
      id: true,
      customerName: true,
      testimonial: true,
      customerPhoto: true,
    },
  });
});

export default async function HomePage2() {
  const [rootCompany, pricingData] = await Promise.all([
    getRootCompany(),
    getPricingData(),
  ]);

  const approvedTestimonials = rootCompany
    ? await getTestimonials(rootCompany.id)
    : [];

  const pricingMap = pricingData.reduce((acc, p) => {
    acc[p.plan] = p;
    return acc;
  }, {} as Record<string, (typeof pricingData)[0]>);

  const testimonialFormProps = rootCompany
    ? {
        slug: rootCompany.slug ?? undefined,
        apiPath: rootCompany.slug
          ? undefined
          : `/api/storefront/by-id/${rootCompany.id}/testimonials`,
      }
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern Hero with animated elements */}
      <ModernHero />

      {/* Stats Banner */}
      <StatsBanner />

      {/* Interactive Features */}
      <InteractiveFeatures />

      {/* Industry-specific Showcase */}
      <IndustryShowcase />

      {/* Tech Stack */}
      <TechStackSection />

      {/* Comparison Table */}
      <ComparisonTable />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel
        testimonials={approvedTestimonials}
        testimonialFormProps={testimonialFormProps}
      />

      {/* Pricing Cards */}
      <PricingCards pricingMap={pricingMap} />

      {/* Final CTA */}
      <FinalCTA />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
