import React from "react";
import {
  LayoutList,
  VenetianMask,
  NotebookPen,
  Globe,
  Mails,
  HeartHandshake,
  ShoppingBasket,
  Network,
  FileSignal,
  LifeBuoy,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

interface SectionProps {
  id: string;
  className?: string;
  backgroundImage?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  id,
  className = "",
  backgroundImage,
  children,
}) => (
  <section
    id={id}
    className={`section-background ${className}`}
    style={
      backgroundImage
        ? { backgroundImage: `url("${backgroundImage}")` }
        : undefined
    }
  >
    <div className="linear-overlay"></div>
    <div className="section-content">{children}</div>
  </section>
);

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className,
}) => {
  const base =
    "group aspect-square p-8 rounded-2xl border border-white/5 hover:border-primary/40 transition-all duration-500 flex flex-col items-center justify-center text-center min-h-80";
  const useGlass = !(className && className.includes("bg-"));
  return (
    <div
      className={`hover:scale-105 transition-all duration-10 ${base} ${
        useGlass ? "glass" : ""
      } ${className ?? ""}`}
    >
      <div className="size-20 rounded-xl flex items-center justify-center mb-6 bg-slate-200 group-hover:bg-slate-100 group-hover:scale-110 dark:bg-gray-700 dark:group-hover:scale-110 dark:group-hover:bg-gray-500 transition-all">
        {icon}
      </div>
      <h3 className="text-2xl md:text-2xl font-display font-bold mb-3 dark:text-black">
        {title}
      </h3>
      <p className="text-gray-700 text-base leading-relaxed max-w-[90%]">
        {description}
      </p>
    </div>
  );
};

const Features: React.FC = () => {
  return (
    <Section
      id="features"
      className="overflow-x-hidden flex items-center justify-center section-bg-linear-2 bg-background dark:bg-zinc-900/30 backdrop-blur-md rounded-2xl min-h-[60vh] pt-30"
    >
      <div className="flex flex-col justify-center items-center text-center mb-16">
        <div className="w-[280px] px-4 py-2 rounded-full border border-purple-500 text-purple-500 dark:text-[#2bee79] dark:border-[#2bee79] text-xs font-semibold mb-4">
          CHAPTER II: FOUNDATIONAL CAPABILITIES
        </div>
        <h2 className="max-w-4xl mx-auto text-5xl md:text-6xl font-display font-black tracking-tight mb-6 text-black dark:dark:text-gray-200">
          <span className="text-purple-500 dark:text-[#2bee79]">
            Worry-less{" "}
          </span>{" "}
          business orchestration
        </h2>
        <p className="w-full px-4 mx-auto text-base md:text-lg text-black dark:text-gray-50 mb-12 leading-relaxed md:max-w-4xl ">
          Core features that reduce operational overhead across companies,
          people, and finance — designed to keep your business running smoothly.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-24 gap-y-6">
        <FeatureCard
          className="bg-slate-200"
          icon={
            <NotebookPen className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Product Catalog"
          description="Your companies products in one dashboard and get notified on low inventory levels"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <VenetianMask className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Service Catalog"
          description="One Dashboard to manage services, descriptions, pricing, and enable scheduling."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <LayoutList className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Workforce Management"
          description="Add staff, set start date for onboarding, and let the AI-Agent do the rest"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <LayoutList className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Project Management"
          description="Plan projects, assign teamss, project manager, project lead, tasks, track progress"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <LayoutList className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Time & Attendance"
          description="Clock-in/out, staff events, and reliable time tracking for payroll accuracy."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <Globe className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Customer Portal"
          description="Customer dashboard shows active orders, purchase history, support articles, and invoices"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <Mails className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Email Marketing"
          description="Let AI Design and Email your email templates and send email campaigns to your customers"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <HeartHandshake className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Customer Testimonials"
          description="Collect, display, and manage verified customer testimonials to build trust."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <ShoppingBasket className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Online Store"
          description="AI-powered storefront and checkout with personalized recommendations and cart recovery."
        />

        <FeatureCard
          className="bg-slate-200"
          icon={
            <Network className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Payment Providers"
          description="Connect your company to a payment gateway or use OnTarget ERP Global Provider"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <FileSignal className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="White-label Branding"
          description="Override default OnTarget ERP branding with your company logo, and colors."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <FileSignal className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Webhooks Notifications"
          description="Get real-time notifications when leads created, invoices paid, and low inventory count"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <FileSignal className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Document Sharing"
          description="Configure your company encrypted cold storage provider. choose from S3, Azure, and DigitalOcean"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <FileSignal className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Cold Storage"
          description="Configure your company encrypted cold storage provider. choose from S3, Azure, and DigitalOcean"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <FileSignal className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Hadera Blockchain"
          description="Hedera Consensus Service guaranteeing that everyone sees the same transaction order, exactly as it happened"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <LifeBuoy className="w-10 h-10 text-purple-500 dark:text-[#2bee79]" />
          }
          title="Technical Support"
          description="Contact us to suggest a feature and maybe we'll build it and will be in production in no-time"
        />
      </div>
    </Section>
  );
};

export default Features;
