import { getAllPlanPricing } from "@/lib/pricing";
import Hero from "@/components/new-designs/v6-upgrade/Hero";
import Features from "@/components/new-designs/v6-upgrade/Features";
import AIIntegration from "@/components/new-designs/v6-upgrade/AIIntegration";
import Blockchain from "@/components/new-designs/v6-upgrade/Blockchain";
import Security from "@/components/new-designs/v6-upgrade/Security";
import { ApprovedTestimonials } from "@/components/new-designs/v6-upgrade/Testimonials";
import { ContactSection } from "@/components/contact-section";
import { HomepagePricing } from "@/components/homepage-pricing";
import Footer from "@/components/new-designs/v6-upgrade/Footer";
import ImmutableStory from "@/components/new-designs/v6-upgrade/ImmutableStory";
import WShapeBlockchainVerificationProcess from "@/components/new-designs/v6-upgrade/WShapeBlockchainVerificationProcess";

const getPricingData = async () => {
  return getAllPlanPricing();
};

const pricingData = await getPricingData();

// Create pricing map for easy access
const pricingMap = pricingData.reduce((acc, p) => {
  acc[p.id] = {
    plan: p.id,
    monthlyPrice: p.monthlyPrice,
    annualPrice: p.annualPrice,
    annualPriceMonthly: p.annualPriceMonthly,
    monthlyPromoPrice: p.monthlyPromoPrice,
    transactionFeePercent: p.transactionFeePercent,
    transactionFeeFixed: p.transactionFeeFixed,
    extraStoragePricePerGB: p.extraStoragePricePerGB,
  };
  return acc;
}, {} as Record<string, { plan: string; monthlyPrice: number; annualPrice: number; annualPriceMonthly: number; monthlyPromoPrice: number | null; transactionFeePercent: number; transactionFeeFixed: number; extraStoragePricePerGB: number }>);

export default function Homepage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Features />
      <AIIntegration />
      <Blockchain />
      <WShapeBlockchainVerificationProcess />
      <ImmutableStory />
      {/* <BlockchainDiagram /> */}
      <Security />
      <HomepagePricing pricingMap={pricingMap} />
      <ApprovedTestimonials
        testimonialFormProps={{
          slug: "homepage",
          apiPath: "/api/homepage/approved-testimonials",
        }}
      />
      <ContactSection />
      <Footer />
    </div>
  );
}
