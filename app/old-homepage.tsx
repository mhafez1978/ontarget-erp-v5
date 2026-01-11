import { cache } from "react";
import dynamic from "next/dynamic";
//import { HeroSection } from "@/components/homepage/HeroSection";
import { HeroBanner } from "@/components/hero-banner/HeroBanner";
//import { SocialProof } from "@/components/social-proof/SocialProof";
import { CloudKitchenHero } from "@/components/hero-banner/CloudKitchenHero";
import { FlamingPanHero } from "@/components/hero-banner/FlamingPanHero";
import { MechanicsTaregtedHero } from "@/components/hero-banner/MechanicsTaregtedHero";
//import { FeaturesShowcase } from "@/components/hero-banner/FeaturesShowcase";
import { db } from "@/lib/db";

// Lazy load below-the-fold components to reduce initial JS
const CTA1Section = dynamic(() =>
  import("@/components/homepage/CTA1Section").then((m) => ({
    default: m.CTA1Section,
  }))
);
const ContactSection = dynamic(() =>
  import("@/components/contact-section").then((m) => ({
    default: m.ContactSection,
  }))
);
const PowerfulFeaturesSection = dynamic(() =>
  import("@/components/homepage/powerful-features-section").then((m) => ({
    default: m.PowerfulFeaturesSection,
  }))
);
const ApprovedTestimonials = dynamic(() =>
  import("@/components/homepage/ApprovedTestimonials").then((m) => ({
    default: m.ApprovedTestimonials,
  }))
);
const Footer = dynamic(() =>
  import("@/components/homepage/Footer").then((m) => ({ default: m.Footer }))
);
const HomepagePricing = dynamic(() =>
  import("@/components/homepage-pricing").then((m) => ({
    default: m.HomepagePricing,
  }))
);
const AiStorefrontRenderer = dynamic(() =>
  import("@/components/storefront/ai-storefront-renderer").then((m) => ({
    default: m.AiStorefrontRenderer,
  }))
);

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
    where: { companyId, status: "APPROVED", isFeatured: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
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
      <HeroBanner />
      <FlamingPanHero />
      <MechanicsTaregtedHero />
      <CloudKitchenHero />
      {/* <FeaturesShowcase /> */}
      {/* <SocialProof /> */}
      {/* Hero Section */}
      {/* <HeroSection /> */}
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
