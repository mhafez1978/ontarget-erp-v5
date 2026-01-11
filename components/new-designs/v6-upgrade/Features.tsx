import React from "react";
import {
  Building2,
  Box,
  Calendar,
  Users,
  CreditCard,
  ShoppingCart,
  BarChart,
  Plug,
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
    <div className={`${base} ${useGlass ? "glass" : ""} ${className ?? ""}`}>
      <div className="size-20 rounded-xl flex items-center justify-center mb-6 bg-slate-300 group-hover:bg-slate-400 group-hover:scale-110 dark:dark:bg-gray-800 dark:group-hover:scale-110 dark:group-hover:bg-gray-600 transition-all">
        {icon}
      </div>
      <h3 className="text-2xl md:text-3xl font-display font-bold mb-3 dark:text-gray-700">
        {title}
      </h3>
      <p className="text-text-muted text-base leading-relaxed font-body max-w-[90%]">
        {description}
      </p>
    </div>
  );
};

const Features: React.FC = () => {
  return (
    <Section
      id="features"
      className="section-bg-linear-2 bg-background dark:bg-zinc-900/30 backdrop-blur-md rounded-2xl"
    >
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-purple-500 dark:text-primary text-xs font-bold mb-8">
          CHAPTER II: FOUNDATIONAL CAPABILITIES
        </div>
        <h2 className="max-w-4xl mx-auto text-5xl md:text-6xl font-display font-black tracking-tight mb-6 text-black dark:text-gray-200">
          <span className="text-purple-500 dark:text-primary">
            {" "}
            Worry-less{" "}
          </span>{" "}
          business orchestration
        </h2>
        <p className="w-full px-4 mx-auto text-lg md:text-2xl text-black dark:text-gray-50 mb-12 leading-relaxed font-body md:max-w-4xl ">
          Core features that reduce operational overhead across companies,
          people, and finance — designed to keep your business running smoothly.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-24 gap-y-6">
        <FeatureCard
          className="bg-slate-200"
          icon={
            <Building2 className="w-10 h-10 text-purple-500 dark:text-primary" />
          }
          title="Company Catalog"
          description="Manage your companies products and services in one unified catalog."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={<Box className="w-10 h-10 text-purple-500 dark:text-primary" />}
          title="Workforce Mgmt"
          description="Onboard new hires with AI agents, manage roles, and track performance."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <Calendar className="w-10 h-10 text-purple-500 dark:text-primary" />
          }
          title="Project Mgmt"
          description="Create customer and internal projects, assign tasks, and track progress and manage time"
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <Users className="w-10 h-10 text-purple-500 dark:text-primary" />
          }
          title="Customers Mgmt"
          description="Manage customers, orders, invoices and analyze customer data."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <CreditCard className="w-10 h-10 text-purple-500 dark:text-primary" />
          }
          title="Testimonials"
          description="Manage customer reviews and testimonials to build trust and credibility."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <ShoppingCart className="w-10 h-10 text-purple-500 dark:text-primary" />
          }
          title="Shopping Cart"
          description="AI-Powered storefront to showcase your company products and services with built-in AI-Chatbot support."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <BarChart className="w-10 h-10 text-purple-500 dark:text-primary" />
          }
          title="xLedger"
          description="Immutable transaction records stored on a decentralized blockchain for public review."
        />
        <FeatureCard
          className="bg-slate-200"
          icon={
            <Plug className="w-10 h-10 text-purple-500 dark:text-primary" />
          }
          title="Integrations"
          description="GeoTracking, Cloud Storage, Email Service, Payment Provider or use our global Payment Gateway."
        />
      </div>
    </Section>
  );
};

export default Features;
