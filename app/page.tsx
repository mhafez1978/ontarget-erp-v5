import { cache } from "react";
import { HeroSection } from "@/components/homepage/HeroSection";
import { CTA1Section } from "@/components/homepage/CTA1Section";
import { ContactSection } from "@/components/contact-section";
import { PowerfulFeaturesSection } from "@/components/homepage/powerful-features-section";
import { ApprovedTestimonials } from "@/components/homepage/ApprovedTestimonials";
import { Footer } from "@/components/homepage/Footer";
import { HomepagePricing } from "@/components/homepage-pricing";
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";
import { db } from "@/lib/db";

// Cached data fetching functions - prevents duplicate queries
const getRootCompany = cache(async () => {
  return db.company.findFirst({
    where: { isRoot: true },
    select: {
      id: true,
      name: true,
      slug: true,
      aiStorefrontEnabled: true,
      aiStorefrontSpec: true,
    },
  });
});

const getPricingData = cache(async () => {
  return db.planPricing.findMany({
    orderBy: { monthlyPrice: "asc" },
  });
});

const getTestimonials = cache(async (companyId: string) => {
  return db.testimonial.findMany({
    where: { companyId, status: "APPROVED" },
    orderBy: [
      { isFeatured: "desc" },
      { displayOrder: "asc" },
      { createdAt: "desc" },
    ],
    take: 24,
    select: {
      id: true,
      customerName: true,
      testimonial: true,
      customerPhoto: true,
    },
  });
});

// export const revalidate = 3600; // Cache for 1 hour - static content doesn't change often

export default async function HomePage() {
  // Parallel data fetching - all queries run simultaneously
  const [rootCompany, pricingData] = await Promise.all([
    getRootCompany(),
    getPricingData(),
  ]);

  const aiEnabled =
    rootCompany?.aiStorefrontEnabled && rootCompany.aiStorefrontSpec;

  // Fetch testimonials only if we have a root company
  const approvedTestimonials = rootCompany
    ? await getTestimonials(rootCompany.id)
    : [];

  // Create pricing map for easy access
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

  if (aiEnabled && rootCompany?.aiStorefrontSpec) {
    return (
      <div className="flex flex-col min-h-screen">
        <AiStorefrontRenderer
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          spec={rootCompany.aiStorefrontSpec as any}
          slug={rootCompany.slug || ""}
          companyName={rootCompany.name}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <HeroSection />
      {/* Features Section */}
      <PowerfulFeaturesSection />
      {/* Testimonials Section */}
      <ApprovedTestimonials
        approvedTestimonials={approvedTestimonials}
        testimonialFormProps={testimonialFormProps}
      />
      {/* Pricing Section */}
      <HomepagePricing pricingMap={pricingMap} />

      {/* CTA Section */}
      <CTA1Section />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
