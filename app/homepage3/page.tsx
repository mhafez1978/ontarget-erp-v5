import React from "react";
import Image from "next/image";
import { cache } from "react";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";

const ApprovedTestimonials = dynamic(() =>
  import("@/components/homepage/ApprovedTestimonials").then((m) => ({
    default: m.ApprovedTestimonials,
  }))
);
interface TestimonialProps {
  name: string;
  title: string;
  company: string;
  image: string;
  logo: string;
  quote: string;
}
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
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
}) => (
  <div className="group p-8 rounded-3xl glass border border-white/5 hover:border-primary/40 transition-all duration-500">
    <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
      <span className="material-symbols-outlined text-primary text-4xl">
        {icon}
      </span>
    </div>
    <h3 className="text-2xl font-display font-bold mb-4 text-gray-200">
      {title}
    </h3>
    <p className="text-text-muted text-base leading-relaxed font-body">
      {description}
    </p>
  </div>
);

const Testimonial: React.FC<TestimonialProps> = ({
  name,
  title,
  company,
  image,
  logo,
  quote,
}) => (
  <div className="group p-8 rounded-3xl glass border border-white/5 hover:border-primary/40 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent"></div>
    <Image
      width={900}
      height={600}
      alt={`${name}, ${title} of ${company}`}
      className="size-24 rounded-full object-cover mb-6 border-2 border-primary/50 shadow-lg group-hover:scale-105 transition-transform duration-300"
      src={image}
    />
    <h3 className="text-xl font-display font-bold text-gray-200 mb-2">
      {name}
    </h3>
    <p className="text-sm font-body text-text-muted mb-4">
      {title}, {company}
    </p>
    <Image
      width={900}
      height={600}
      alt={`${company} Logo`}
      className="h-8 object-contain mb-6 opacity-70 group-hover:opacity-100 transition-opacity duration-300"
      src={logo}
    />
    <p className="text-lg italic text-primary leading-relaxed mb-6">
      <span className="material-symbols-outlined text-4xl leading-none -mt-4 mr-2 align-middle text-primary/70">
        format_quote
      </span>
      {quote}
    </p>
    <div className="w-full h-px bg-white/10 mt-auto"></div>
  </div>
);

const Homepage3: React.FC = () => {
  return (
    <div className="bg-background-dark text-gray-200 font-body">
      <main className="relative">
        {/* Hero Section */}
        <Section
          id="hero"
          className="section-bg-linear-1"
          backgroundImage="https://lh3.googleusercontent.com/aida-public/AB6AXuAnxPZO1Z71-RjeZPP8W9uqBJIm7HBUOXGRd9Pf1TXzuuEqp7WOhi9OqgUeW3PKz2SPVrYh712izDQGq70QA8_Uz20qs3hA_3KL4gDBWkoEeL5dsAQpCsubLmwKVG4rOU8YhvIx3Ar1t9xXCxW8AuSf4BjT6yVkMZ-FEJ9aV_qbXEEBCEbcDQkSSvBLUa1z36X1vnW49D-OZpkFc4bz-9bob9ZxHvQ2wMs9-qADTWasa4d6YH5hFbGyMvAXh4RJYt3wj-70bxkGKJuT"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              CHAPTER I: THE VISION
            </div>
            <h1 className="text-6xl md:text-9xl font-display font-black tracking-tighter mb-8 leading-tight text-gray-200">
              OnTarget ERP: <br /> People Driven,{" "}
              <span className="text-primary italic">AI-Powered.</span>
            </h1>
            <p className="max-w-4xl mx-auto text-xl md:text-2xl text-text-muted mb-12 leading-relaxed font-body">
              Embark on a journey into the future of business management.
              OnTarget ERP v5.0 is built for unparalleled efficiency, styled for
              modern intelligence, and driven by deep insights.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a
                className="px-10 py-5 bg-primary text-background-dark font-bold rounded-xl text-xl flex items-center gap-3 hover:shadow-[0_0_40px_rgba(43,238,121,0.4)] transition-all"
                href="#features"
              >
                Begin Your Journey
                <span className="material-symbols-outlined">arrow_forward</span>
              </a>
              <button className="px-10 py-5 bg-white/5 border border-white/10 font-bold rounded-xl text-xl flex items-center gap-3 hover:bg-white/10 transition-all text-gray-200">
                Discover the Experience
                <span className="material-symbols-outlined">play_circle</span>
              </button>
            </div>
          </div>
        </Section>

        {/* Features Section */}
        <Section
          id="features"
          className="section-bg-linear-2"
          backgroundImage="https://lh3.googleusercontent.com/aida-public/AB6AXuChrJOR8k-faGUnwNZ8-5W7tMQAbLOc1DieztWgSoQRppKE7IUc_P3ffU2A-PULwEUNQ-SrNT-8Xjydj0Vxfgl9hjaqqEgGoY24vFI6pCTH8dHtsiAjZnnyMrVZPmepx1m88O-R_Pbetxo6Y2mrisZi0K4phSvlMFGITGQGWkjDiElH1mzbiEO20aUKma8_l3sSkqgbwvr-mTI3QfwU5jZVc0zluBlcWdg1P0xZxZnranUuAx7k0SrU0p8N9KJ9JdUknc1bS5f68TUq"
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8">
              <span className="material-symbols-outlined text-sm">
                auto_awesome
              </span>
              CHAPTER II: FOUNDATIONAL CAPABILITIES
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-6 text-gray-200">
              Orchestrate Your Enterprise
            </h2>
            <p className="max-w-4xl mx-auto text-xl text-text-muted leading-relaxed font-body">
              Explore the fundamental pillars that empower your business. From
              multi-entity governance to intelligent workforce solutions,
              OnTarget ERP provides a unified platform for comprehensive
              control.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon="corporate_fare"
              title="Multi-Company Management"
              description="Seamlessly govern diverse entities, currencies, and tax jurisdictions under one intelligent ecosystem."
            />
            <FeatureCard
              icon="groups"
              title="Predictive CRM"
              description="Anticipate customer needs with AI-powered insights, transforming interactions into lasting relationships."
            />
            <FeatureCard
              icon="badge"
              title="Optimized Workforce"
              description="Streamline staff deployment and talent development using advanced AI workforce modeling and analytics."
            />
            <FeatureCard
              icon="pace"
              title="Precision Timing & Analytics"
              description="Gain granular control over project time, resource allocation, and billable hours with high-fidelity tracking."
            />
          </div>
        </Section>

        {/* AI Integration Section */}
        <Section
          id="ai-integration"
          className="section-bg-linear-3"
          backgroundImage="https://lh3.googleusercontent.com/aida-public/AB6AXuDY9mIo8DLoDKoWS1onoY885itfG4a5SA6Rv0-nF870Qm4F_hX2qD0AjaxUHj1QyFxJo62_5XpW54HWQnHz2d8MNebzHLOim2PUl3ZAu3QiJhFrsAAsgA0ja86vdVKg6Xpqw2k6x4UpfVlUbT01A1IIf80mrl8wa5YNtLzQ0i_ZSynQlKRWxlIXz58ntbfK0dGB-_hcDkNvE1soypIYYxZNEaZbjL8wVGFIE82X8Z7t3UPORGlvUemLJR_gPDwZc62Q7VBINR3T8QM8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4 mx-auto lg:mx-0">
                <span className="material-symbols-outlined text-sm">
                  psychology
                </span>
                CHAPTER III: AI INTEGRATION
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tight text-gray-200">
                Unleash Hyper-Growth with AI
              </h2>
              <p className="text-text-muted text-xl leading-relaxed font-body max-w-2xl lg:max-w-none mx-auto">
                Experience the true power of AI. From intelligent storefront
                generation to automated business analytics, OnTarget ERP&apos;s
                LLM-integrated core processes data at unprecedented speeds.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
                  <span className="material-symbols-outlined text-accent-violet text-4xl mb-2">
                    smart_toy
                  </span>
                  <div>
                    <p className="font-display font-bold text-lg text-gray-200">
                      AI Storefront Generation
                    </p>
                    <p className="text-sm text-text-muted font-body">
                      Instantly craft captivating digital shops tailored to your
                      brand.
                    </p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
                  <span className="material-symbols-outlined text-accent-cyan text-4xl mb-2">
                    analytics
                  </span>
                  <div>
                    <p className="font-display font-bold text-lg text-gray-200">
                      Automated Deep Analytics
                    </p>
                    <p className="text-sm text-text-muted font-body">
                      Gain profound insights from your data with smart,
                      real-time reporting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative grid grid-cols-1 gap-4">
                <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl glass">
                  <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex gap-2">
                    <div className="size-3 rounded-full bg-red-500/50"></div>
                    <div className="size-3 rounded-full bg-yellow-500/50"></div>
                    <div className="size-3 rounded-full bg-green-500/50"></div>
                  </div>
                  <div
                    className="aspect-video bg-center bg-cover"
                    style={{
                      backgroundImage:
                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBrpnKmwtpQXovN7gR8YqH6E91jYRIrMNyKgl9xAoifcYvVAX7INfHrgVHP1Je1gD84-TzN03Kvx065COmbs-IMfqO8_GLSAI3kXVrzXIF9b6WA3-ab1cdrh1F6WQtXOy-0pZq4pq1yYtAxsOmGh4hUCt7chn5UOr3yPxFelMwsHaboeN_bKv-e_X2lKROGtsWcoveRByd6FCO7ifU-qsV_d5ayPWOtneDCpBGxnDbIySAFXL96VAf2Zfgqqu4oRsKq8LOEorVfS0-r")',
                    }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl glass">
                    <Image
                      width={900}
                      height={600}
                      alt="Team Work"
                      className="w-full h-full object-cover opacity-80"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu-MQTYWi6iPfqm7MNusM2DbNIGdOwYIn3kQb7Dzc7C_YQSePLdJHT5r_MrzC7b6SVYK4YEq-EePUQmWV_Y8QkSublLeK2UKOYi2NzZ3fJjM2SGDhJE7P5q17PSoSa6Pr9oZLskB-qpyLdQ86QGdiHNS5ow6JD5dRI56mvWXo3_-RvC2CV87UPnJZiA4hdeTNN8ysUqWzin-4zw7bebiDHbu-ciQ3CxQ21cQpmRgXj8f7mgZYVuqxMfg_7oxTrzkjWDgNihHZx7puz"
                    />
                  </div>
                  <div className="aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl glass">
                    <Image
                      width={900}
                      height={600}
                      alt="Cloud Data"
                      className="w-full h-full object-cover opacity-80"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBOXAsurTltuk7Vm0tUmFp3TyMxcvfz2AYKO3lUiA-ElpQ5pRSNy4uuwLO_b5low563XwhM8C4cFGPHe910gVNJt_jMtsh5FKkSxQmMMrtL4BsREZa6Etbgmpi53evwSZIrpgER8V5xgpumVVpnZRZfzj9Aql2VPRKsHzJd9DULf-3z681K54pCFP3sOD8uxishR1W5w-XNcrGAhrl0CR6J9kNQFLT3FHgZRt09nyS2fdjnE9Ss7QfLq_FjLUVg5pv-YbwmJrGONHI"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Security Section */}
        <Section
          id="security"
          className="section-bg-linear-4"
          backgroundImage="https://lh3.googleusercontent.com/aida-public/AB6AXuCtqtcTuubHr-Mvzn2WXo0d9toJyalpk0gDGdHlg7ByXCevOb9B3mlEAlK34cf170T-JafuoWN67b_jyYt_jUV6NJan88bFNhg8b3_jI2KcY1nN_mH2Dw21gnS91l666eiaPZP_denSm9_2yGo56YSJ_1axG_G7cnhl5i5B0gkYiZN-q7m0k_rZVwH8wLS1RI82YmWTrNF67yjONNpqsZXSb99v1UtJg7Q2XG7hZyVv2tFhKKdoqPY_qYwcjlewCXdUAFXV98SRrEJq"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs mb-8">
              <span className="material-symbols-outlined text-sm">
                verified_user
              </span>
              CHAPTER IV: FOUNDATION OF TRUST
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8 text-gray-200">
              Unwavering Reliability & Security
            </h2>
            <p className="max-w-4xl mx-auto text-xl text-text-muted leading-relaxed font-body mb-16">
              Trust your data with a system engineered for mainframe reliability
              and seamless integration. OnTarget ERP secures your operations
              with advanced protocols and broad provider compatibility.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-10 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl text-gray-200">
                  google
                </span>
                <span className="text-[10px] font-bold tracking-widest text-text-muted">
                  GOOGLE
                </span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl text-gray-200">
                  terminal
                </span>
                <span className="text-[10px] font-bold tracking-widest text-text-muted">
                  GITHUB
                </span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl text-gray-200">
                  cloud
                </span>
                <span className="text-[10px] font-bold tracking-widest text-text-muted">
                  MICROSOFT
                </span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl text-gray-200">
                  database
                </span>
                <span className="text-[10px] font-bold tracking-widest text-text-muted">
                  ORACLE
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* Blockchain Section */}
        <section
          id="blockchain"
          className="section-background section-bg-linear-5 floating-cubes"
        >
          <div className="linear-overlay opacity-90"></div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/10 blur-[120px] rounded-full"></div>
          </div>
          <div className="section-content">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col gap-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4 w-fit">
                  <span className="material-symbols-outlined text-sm">
                    link
                  </span>
                  CHAPTER V: FUTURE-PROOF INTEGRITY
                </div>
                <h2 className="text-6xl md:text-8xl font-display font-black tracking-tight text-gray-200">
                  Immutable <br />
                  <span className="text-primary italic">Company Records.</span>
                </h2>
                <p className="text-text-muted text-xl md:text-2xl leading-relaxed font-body max-w-2xl">
                  The definitive evolution of corporate transparency. Every
                  critical transaction is hashed and tracked on a decentralized
                  ledger, creating an unbreakable chain of trust.
                </p>
                <div className="flex flex-col gap-6 mt-4">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary">
                        public
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold font-display text-gray-200">
                        Public Verification Protocol
                      </h4>
                      <p className="text-text-muted text-sm font-body">
                        Transactions are recorded publicly and can be verified
                        by stakeholders through our specialized DAPP explorer.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary">
                        lock_reset
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold font-display text-gray-200">
                        Zero-Knowledge Auditing
                      </h4>
                      <p className="text-text-muted text-sm font-body">
                        Prove compliance and financial health without exposing
                        sensitive proprietary data.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-4">
                  <span className="px-4 py-1.5 bg-primary text-background-dark text-xs font-black uppercase tracking-widest rounded-full">
                    Coming Soon
                  </span>
                  <p className="text-primary text-sm font-bold font-display italic">
                    Arriving in v5.2 Q4 2024
                  </p>
                </div>
              </div>
              <div className="lg:col-span-5 relative">
                <div className="relative z-20 group">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-50 transition-opacity group-hover:opacity-80"></div>
                  <div className="glass relative rounded-[2.5rem] p-8 border border-primary/20 flex flex-col items-center text-center overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent"></div>
                    <div className="size-32 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center mb-8 relative">
                      <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                        <span className="material-symbols-outlined text-primary text-6xl">
                          verified
                        </span>
                      </div>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 size-4 bg-primary rounded-sm shadow-[0_0_15px_#2bee79]"></div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 size-4 bg-primary rounded-sm shadow-[0_0_15px_#2bee79]"></div>
                    </div>
                    <h3 className="text-2xl font-display font-black mb-2 text-gray-200 uppercase tracking-tighter">
                      OnTarget Verified
                    </h3>
                    <p className="text-primary font-bold text-xs tracking-widest uppercase mb-6">
                      BLOCKCHAIN AUTHENTICATED
                    </p>
                    <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 text-left">
                      <p className="text-[10px] text-text-muted font-mono uppercase mb-1">
                        TX Hash Signature
                      </p>
                      <p className="text-[11px] text-primary font-mono truncate">
                        0x71C91301431611d6F717441659223c6
                      </p>
                    </div>
                    <div className="mt-8 flex gap-2">
                      <div className="size-2 rounded-full bg-primary"></div>
                      <div className="size-2 rounded-full bg-primary/40"></div>
                      <div className="size-2 rounded-full bg-primary/20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <Section id="testimonials" className="section-bg-linear-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8">
              <span className="material-symbols-outlined text-sm">stars</span>
              CHAPTER VI: THE ONTARGET ADVANTAGE
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-8 text-gray-200">
              Executive{" "}
              <span className="text-primary italic">Testimonials.</span>
            </h2>
            <p className="max-w-4xl mx-auto text-xl text-text-muted leading-relaxed font-body mb-16">
              Hear directly from industry leaders who have transformed their
              operations and achieved remarkable growth with OnTarget ERP.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <Testimonial
                name="Sarah Chen"
                title="CEO"
                company="Innovate Corp"
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuBKZtsIOFQpcZPffPsitVg4rrfdh1jiYvTartv6MmCNiWLMDm6QLBY9_sfWOIIdSd6bwwCkRJGogn7bevk8K67ujWL2I_SsqEfhaye275wjZPVgHtqlXVYcBDeygUtfSbX7cOSlLdB_u-oUhIb9ytBEoSZdAUeIT68_ekcQeYaQZ2Jn1tj83BzsEQ2oN9fuqVDJ2ZtMHcdr0iP0BlZnCl1tDRMvwVG6LgRBBhCCAOEpj3H_X88IlknPUOA_ZVFU7DuBBqCdzf88dwKn"
                logo="https://lh3.googleusercontent.com/aida-public/AB6AXuBVsyfo9iUz8yBOuQ--PEWsh9DbdqnPEKGSusrAyLBU4xV5oxfVW10RTqje_IcfMkFIAE5ONIrRYvUiK17wdwe6qXyLjiUeykorKb-ZE2KSo0-vMd08vrx-Zcm0Grje9MrFfsL2kiyeURfdWNhktIxXqkgAcNxROpWpDyYxKlTqqxpAmYQyaSAmuCMEkhZqAQtOixCAM7Dt66BFoSKgF7n57AzZ5jlH58QjwEt1fANJVdYW_PKsKOPCVamlS0DOrWoYcA1AuksnQ16T"
                quote="OnTarget ERP streamlined our multi-national operations, reducing overhead by 30% and boosting our market response time significantly. It's a game-changer for global enterprises."
              />
              <Testimonial
                name="David Lee"
                title="CTO"
                company="Quantum Systems"
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuDdnT2ymcPQqvfrQqXpmQ4FRQL7NEvu0Yu5SYtH74R08U2BnQNAhreyb9ldvFj361KTGGBA-PbTNXrmgyhT9yDbzh5_6jlmWFRhS5WNpR6muFVo7Wa_BsNRq-BzLjB_eu4StSrg_csYtglIKzYe43X5N47ShdkLBY51H8NPLYYpO4J_G4JoA_Qf31RxdsYxHbctPQdhiBLraurJMwz8zeJ1lL31dJC6RjPzm1GYD6SVNArLIxQdRQBeWr3JCWg6Nr0kUzsf5VjiXDPR"
                logo="https://lh3.googleusercontent.com/aida-public/AB6AXuA9pcTZGJJhohVm5-_0oET8l1fWS0K9NlvlN15ZnU0ML9BdhPnp_fkdoK8eT4GgdjAtIJ5k6aD8KrjmdvLihiyx4_GpxWxfvrAfUBoyazZEkHlgnarlNHzmr4qNpYugsC7_HLwvXjEIypg9LUkqxkk3lG1b2qXVWFAlpNBXil010w96W0RWhLtnHSVFKyS95STneN5bQ6lJHen8OhnFafBRIyOsWLo8jTb7hwsJVUp_127MmTk6oe-Dhdu4E1forQDz1pdLCxrZHGPU"
                quote="The AI integration in OnTarget ERP has revolutionized our data analytics. We now predict market trends with 90% accuracy, directly impacting our strategic investments."
              />
              <Testimonial
                name="Maria Garcia"
                title="CFO"
                company="Global Connect"
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuDefSddhcAOZ4LYNksT1BOrNrcx3yCErMKXPbE-3FXZ0cj5AglSqsrL75SxIOUalpT1Lk2N_wZ1tLZPUV6aOb-hwlzG3p4uJtPvetX4H9M0J7G-8yDfuNeFYXpjLR6d0QDTdnhAQI1bI8x-9vXj2yHh17GVE4kwAicEJSLwGzss6RMAJtsyn5T7lvnyEqKowG4dYYaxCYqhoTXpoYl8WPxhh0AJT-9L---9BjVEENC4Nm8LMvHE5PkI3WQcV0k67YfaP_T43Cc48h_A"
                logo="https://lh3.googleusercontent.com/aida-public/AB6AXuBvy2EYmxH6e_j74e55pJfIEpG25fVBCPJcl-mD6Ul5_iX4kStwazYB59HWgj0V1JvIehsXmR_cXSO23ltTPBTV-g60ccl1WK7PEbHYlCjxlStlOfcQxprQnCHkAeoaeN0n5LmeydHwZqsvopMt4zfoYZIfM4dgMcNHPWIhLZOBqLVjs0HsXLLVVjlBp-NkMbfl0TkvqiGUqOnI7JzzIf_kECacVcp7wTUel4MIWaehTUnTjBDvGXz8osq4a8BFvAZLOoVGBLI95gwq"
                quote="Our financial audits are now instantaneous and immutable thanks to OnTarget's blockchain verification. It provides unparalleled transparency and builds immense trust with investors."
              />
              <Testimonial
                name="Alex Turner"
                title="COO"
                company="Visionary Solutions"
                image="https://lh3.googleusercontent.com/aida-public/AB6AXuDDakcFxOX_C_fi4yMFXg_YoxZEOlzEObkqCYRYog7vnPUNlPv1EUUEkLokvjA7w0v8iLWZgKYcryyUcm0IgN8TVoC_gOCP2VYtkxo8i60nN96sy5vo0Aqhb8AJtPLrye_6JTie6IUXXNkwViwFfbGsAHltxhTycRil9-chebD8nh_IHJbE5TxiG4GM-y0lWugrehmr3dHLryQcFBaFCPEgvCmy0fFB0A55JQWACozqYni7BSqEMgX_IsBeCNoSi6HSBaaq82oCet0c"
                logo="https://lh3.googleusercontent.com/aida-public/AB6AXuCyeNwA4kodFBTikzB9dEVGWjO0J9f_ymu1IfLA00BPzLPmXt-zrcXuRcBxeLhn9qlsODHd_CiiLJWfkix3dUBnmlZfaBKZA-WHOTy06kdTKT6-3AH_S6VzrpwRQ6bWOQ--9uq-3ZPqlTN_7TVpLX6X3aVfBu0cHvElNd2aNZOx_Y0c-TUdhe5beS2CocRFzc9SwGTa10XPaDjsY3mxMU98HpO4no4sUOubp3CvqmLN9z2fRPeCHhn0L17z0X-e3Gjgsgmc1X-SXWac"
                quote="Implementing OnTarget ERP led to a 25% increase in operational efficiency across our supply chain. Its predictive capabilities have eliminated bottlenecks before they even emerge."
              />
            </div>
          </div>
        </Section>

        {/* Footer */}
        {/* <footer className="pt-24 pb-12 px-6 border-t border-white/5 bg-background-dark/50 font-body">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-primary flex items-center justify-center rounded-lg text-background-dark">
                    <span className="material-symbols-outlined text-sm font-bold">
                      target
                    </span>
                  </div>
                  <span className="text-lg font-bold font-display">
                    OnTarget ERP
                  </span>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">
                  Redefining the standard for modern business management with
                  AI-first architecture and Blockchain security.
                </p>
                <div className="flex gap-4">
                  <a
                    className="size-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-text-muted"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-lg">
                      share
                    </span>
                  </a>
                  <a
                    className="size-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-text-muted"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-lg">
                      mail
                    </span>
                  </a>
                  <a
                    className="size-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all text-text-muted"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-lg">
                      alternate_email
                    </span>
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-display font-bold mb-6 text-gray-200">
                  Product
                </h4>
                <ul className="flex flex-col gap-4 text-sm text-text-muted">
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      AI Storefronts
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Blockchain Verification
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Enterprise Security
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Roadmap
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold mb-6 text-gray-200">
                  Resources
                </h4>
                <ul className="flex flex-col gap-4 text-sm text-text-muted">
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      DAPP Explorer
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Security Audit
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Status Page
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-bold mb-6 text-gray-200">
                  Legal
                </h4>
                <ul className="flex flex-col gap-4 text-sm text-text-muted">
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      Compliance
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-primary transition-colors"
                      href="#"
                    >
                      GDPR
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-6">
              <p className="text-text-muted text-sm">
                © 2024 OnTarget ERP Systems. All rights reserved.
              </p>
              <div className="flex items-center gap-2 group">
                <span className="text-text-muted text-sm">Created by</span>
                <span className="text-primary font-bold tracking-tight px-3 py-1 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-all cursor-default">
                  Mohamed Hafez
                </span>
              </div>
            </div>
          </div>
        </footer> */}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        * {
          scroll-behavior: smooth;
        }

        body {
          background: #0a1912;
          font-family: 'Outfit', sans-serif;
        }

        .font-display {
          font-family: 'Montserrat', sans-serif;
        }

        .font-body {
          font-family: 'Outfit', sans-serif;
        }

        .glass {
          background: rgba(25, 51, 36, 0.3);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(43, 238, 121, 0.1);
        }

        .section-background {
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          position: relative;
          padding: 4rem 1.5rem;
        }

        .linear-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(10, 25, 18, 0.7) 0%, rgba(10, 25, 18, 0.95) 100%);
        }

        .section-content {
          z-index: 10;
          position: relative;
          max-width: 80rem;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }

        .section-bg-linear-1 {
          background-image: linear-gradient(180deg, #0a1912 0%, #102217 100%);
        }

        .section-bg-linear-2 {
          background-image: linear-gradient(180deg, #102217 0%, #0a1912 100%);
        }

        .section-bg-linear-3 {
          background-image: linear-gradient(180deg, #0a1912 0%, #102217 100%);
        }

        .section-bg-linear-4 {
          background-image: linear-gradient(180deg, #102217 0%, #08120d 100%);
        }

        .section-bg-linear-5 {
          background-image: linear-gradient(180deg, #08120d 0%, #0a1912 100%);
        }

        .section-bg-linear-6 {
          background-image: linear-gradient(180deg, #0a1912 0%, #102217 100%);
        }

        .floating-cubes {
          background-image: radial-gradient(circle at 2px 2px, rgba(43, 238, 121, 0.05) 1px, transparent 0);
          background-size: 40px 40px;
        }

        .text-primary {
          color: #2bee79;
        }

        .bg-primary {
          background-color: #2bee79;
        }

        .border-primary {
          border-color: #2bee79;
        }

        .text-background-dark {
          color: #0a1912;
        }

        .bg-background-dark {
          background-color: #0a1912;
        }

        .text-gray-200 {
          color: #e2e8f0;
        }

        .text-text-muted {
          color: #94a3b8;
        }

        .text-accent-violet {
          color: #8b5cf6;
        }

        .text-accent-cyan {
          color: #06b6d4;
        }
      `}</style>
    </div>
  );
};

export default Homepage3;
