import { ArrowRight, BarChart3, Users, Shield, Globe2, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";






import { Button } from "@/components/ui/button";
import { VisitorTracker } from "@/components/visitor-tracker";
import { ContactSection } from "@/components/contact-section";
import { db } from "@/lib/db";
import { TestimonialForm } from "@/components/storefront/testimonial-form";
import Image from "next/image";

// Lazy load heavy components
const GlobeMarkers = dynamic(
  () =>
    import("@/components/globe/globe-markers").then((mod) => ({
      default: mod.GlobeMarkers,
    })),
  {
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading globe...
        </div>
      </div>
    ),
  }
);

const Marquee = dynamic(() =>
  import("@/components/ui/marquee").then((mod) => ({ default: mod.Marquee }))
);

const HomepagePricing = dynamic(() =>
  import("@/components/homepage-pricing").then((mod) => ({
    default: mod.HomepagePricing,
  }))
);

const AiStorefrontRenderer = dynamic(() =>
  import("@/components/storefront/ai-storefront-renderer").then((mod) => ({
    default: mod.AiStorefrontRenderer,
  }))
);

export const revalidate = 60; // Cache for 1 minute instead of disabling completely

export default async function HomePage() {
  const rootCompany = await db.company.findFirst({
    where: { isRoot: true },
    select: {
      id: true,
      name: true,
      slug: true,
      aiStorefrontEnabled: true,
      aiStorefrontSpec: true,
    },
  });

  const aiEnabled =
    rootCompany?.aiStorefrontEnabled && rootCompany.aiStorefrontSpec;

  // Fetch pricing from database
  const pricingData = await db.planPricing.findMany({
    orderBy: { monthlyPrice: "asc" },
  });

  // Create a map for easy access
  const pricingMap = pricingData.reduce((acc, p) => {
    acc[p.plan] = p;
    return acc;
  }, {} as Record<string, (typeof pricingData)[0]>);

  // Fetch approved testimonials for the root company (OnTarget ERP homepage)
  const approvedTestimonials = rootCompany
    ? await db.testimonial.findMany({
        where: { companyId: rootCompany.id, status: "APPROVED" },
        orderBy: [
          { isFeatured: "desc" },
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
        // fetch enough testimonials to fill 8 stacks * 3 visible cards each = 24
        take: 24,
        select: {
          id: true,
          customerName: true,
          testimonial: true,
          customerPhoto: true,
        },
      })
    : [];

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
        <VisitorTracker />
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
      <VisitorTracker />
      {/* Hero Section */}
      <section
        id="home"
        className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-20 overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/50 mask-[linear-gradient(to_bottom,white,transparent)]" />

        <div className="container relative z-10 mx-auto text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="mr-2 h-6 w-6 text-purple-500" />
            <span className="font-semibold text-lg">
              Introducing OnTarget Ai Driven Business ERP
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            Help Your Business
            <br />
            <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Evolve With AI
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-4 sm:text-xl">
            Streamline operations, boost business, and drive growth with our
            comprehensive Ai driven enterprise resource planning platform
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-2">
            <Link href="/register?plan=ESSENTIAL">
              <Button size="lg" className="group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>

          {/* Globe (magic UI) */}
          <div className=" flex justify-center relative">
            <div className="w-full max-w-4xl">
              <GlobeMarkers />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                10K+
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                99.9%
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                50+
              </div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                24/7
              </div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="px-3 md:lg:xl:px-40 border-t border-b py-20 bg-opacity-10"
        style={{
          backgroundImage:
            "url('https://www.toptal.com/designers/subtlepatterns/uploads/dot-grid.png')",
        }}
      >
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Powerful Features for Your Business
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage and grow your enterprise efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:lg:xl:grid-cols-3 group bg-white shadow-xl shadow-neutral-100 border">
            {/* Storefront Builder */}
            <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-r md:lg:xl:border-b hover:bg-slate-50 cursor-pointer transition-colors">
              <span className="p-5 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-200">
                <Globe2 className="h-10 w-10" />
              </span>
              <p className="text-xl font-medium text-slate-700 mt-3">
                Professional Storefront Builder
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Create stunning online stores with 8+ seasonal themes. Sell
                products & services with integrated payment processing.
              </p>
            </div>

            {/* Workforce Management */}
            <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-r md:lg:xl:border-b hover:bg-slate-50 cursor-pointer transition-colors">
              <span className="p-5 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-200">
                <Users className="h-10 w-10" />
              </span>
              <p className="text-xl font-medium text-slate-700 mt-3">
                Complete Workforce Management
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Manage staff, contractors, field techs with role-based access.
                Track hiring, performance, and team collaboration.
              </p>
            </div>

            {/* Customer Portal */}
            <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-b hover:bg-slate-50 cursor-pointer transition-colors">
              <span className="p-5 rounded-full bg-green-500 text-white shadow-lg shadow-green-200">
                <Shield className="h-10 w-10" />
              </span>
              <p className="text-xl font-medium text-slate-700 mt-3">
                Secure Customer Portal
              </p>
              <p className="mt-2 text-sm text-slate-500">
                OAuth authentication, customer accounts, order tracking, and
                personalized experiences with encryption.
              </p>
            </div>

            {/* Project Management */}
            <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-r hover:bg-slate-50 cursor-pointer transition-colors">
              <span className="p-5 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-200">
                <BarChart3 className="h-10 w-10" />
              </span>
              <p className="text-xl font-medium text-slate-700 mt-3">
                Project & Task Management
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Kanban boards, task assignments, deadlines, and progress
                tracking for complete project oversight.
              </p>
            </div>

            {/* Payment Processing */}
            <div className="p-10 flex flex-col items-center text-center group md:lg:xl:border-r hover:bg-slate-50 cursor-pointer transition-colors">
              <span className="p-5 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </span>
              <p className="text-xl font-medium text-slate-700 mt-3">
                Integrated Payment Solutions
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Stripe integration, subscription billing, invoicing, and
                financial ledger with automated tracking.
              </p>
            </div>

            {/* File Management */}
            <div className="p-10 flex flex-col items-center text-center group hover:bg-slate-50 cursor-pointer transition-colors">
              <span className="p-5 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </span>
              <p className="text-xl font-medium text-slate-700 mt-3">
                Secure File Management
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Cloud storage with company folders, automatic backups, and
                secure file sharing across teams.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="w-full bg-indigo-600 shadow-xl shadow-indigo-200 py-10 px-20 flex flex-col md:flex-row justify-between items-center gap-6 mt-8 mb-20 rounded-lg">
            <div className="text-white text-center md:text-left">
              <span className="text-4xl font-medium block mb-2">
                Ready to Get Started?
              </span>
              <span className="text-lg">
                Start your 14-day free trial today – no credit card required!
              </span>
            </div>
            <Link href="/register?plan=ESSENTIAL">
              <Button
                size="lg"
                className="px-8 py-6 font-medium text-slate-700 shadow-xl duration-150 bg-yellow-400 hover:bg-yellow-300 text-lg"
              >
                START FREE TRIAL
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section (global OnTarget homepage) */}
      {approvedTestimonials.length > 0 && (
        <section id="testimonials" className="py-20 skew-3 mt-20">
          <div className="w-screen flex flex-col items-center justify-center">
            <h3 className="text-3xl font-bold text-center text-black mb-14 -skew-3 dark:text-white">
              <span className="italic text-amber-500">What</span> our customers
              say about our platform.
            </h3>
            <div className="flex justify-center items-center">
              {/* full-bleed 8-column vertical marquee — spans viewport with no side padding */}
              <div className="w-screen">
                <div className="w-screen flex items-center justify-center">
                  <div className="w-full relative flex items-center justify-center gap-4 overflow-hidden perspective-near">
                    {(() => {
                      const stacks = 10;
                      type T = {
                        id: string;
                        customerName: string;
                        testimonial: string;
                        customerPhoto?: string | null;
                      };
                      const rows: T[][] = Array.from(
                        { length: stacks },
                        () => []
                      );
                      approvedTestimonials.forEach((t, idx) => {
                        rows[idx % stacks].push(t as T);
                      });

                      // card height used on md+ (md:h-36 -> 144px), gap ~24px -> track height for 3 visible cards
                      const cardHeight = 192; // md:h-48 => 192px
                      const gap = 24;
                      const trackHeight = 4 * cardHeight + 2 * gap; // 3 cards + 2 gaps

                      return (
                        <div
                          key="marquee-group"
                          className="flex flex-row items-center gap-2 mx-auto"
                          style={{
                            transform:
                              "translateX(-50px) translateY(6px) translateZ(-40px) rotateX(2deg) rotateY(2deg) rotateZ(2deg)",
                          }}
                        >
                          {rows.map((col, i) => {
                            // Pattern: alternate per column — 0 -> up (normal), 1 -> down, 2 -> up, 3 -> down, ...
                            // Use a simple parity check so direction alternates each column
                            const shouldRotate = i % 2 === 1;

                            return (
                              <Marquee
                                key={`col-${i}`}
                                pauseOnHover
                                vertical
                                // If shouldRotate, rotate the entire track 180deg to flip direction
                                className={`[--duration:45s] [--gap:1.5rem] flex-none ${
                                  shouldRotate ? "rotate-180" : ""
                                }`}
                                style={{
                                  height: `${trackHeight}px`,
                                  width: `calc(100% / 8)`,
                                }}
                              >
                                {col.map((t) => (
                                  <div
                                    key={t.id}
                                    // When track is rotated, also rotate the content to make it right-side up
                                    className={`w-full h-48 md:h-48 flex flex-col justify-center items-start px-6 py-4 bg-card border rounded-md shadow-md ${
                                      shouldRotate ? "rotate-180" : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 w-full">
                                      {t.customerPhoto ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                                          <Image
                                            src={t.customerPhoto}
                                            alt={t.customerName}
                                            width={48}
                                            height={48}
                                            className="object-cover"
                                            unoptimized
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted-foreground/10 shrink-0">
                                          <Image
                                            src="/images/placeholder-avatar.svg"
                                            alt="placeholder"
                                            width={48}
                                            height={48}
                                            unoptimized
                                          />
                                        </div>
                                      )}

                                      <div className="flex-1 min-w-0">
                                        <p className="italic text-sm text-muted-foreground line-clamp-3">
                                          “{t.testimonial}”
                                        </p>
                                        <p className="mt-2 text-sm font-semibold truncate">
                                          {t.customerName}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </Marquee>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {testimonialFormProps && (
        <section id="submit-testimonial" className="py-12 skew-3 mt-10">
          <div className="w-screen flex flex-col items-center justify-center">
            <div className="pb-4 px-4 -skew-3">
              <div className="container mx-auto text-center">
                <div className="max-w-2xl mx-auto">
                  <TestimonialForm
                    slug={testimonialFormProps.slug}
                    apiPath={testimonialFormProps.apiPath}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section */}
      <HomepagePricing pricingMap={pricingMap} />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/90 to-primary p-12 text-center text-primary-foreground shadow-2xl">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of companies already using OnTarget ERP to
                streamline their operations
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="group">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-primary transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/integrations"
                    className="hover:text-primary transition-colors"
                  >
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#about"
                    className="hover:text-primary transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="#contact"
                    className="hover:text-primary transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-primary transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-primary transition-colors"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/docs"
                    className="hover:text-primary transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-primary transition-colors"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/api"
                    className="hover:text-primary transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-primary transition-colors"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="hover:text-primary transition-colors"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 OnTarget ERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
