import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Users,
  Zap,
  Shield,
  Globe2,
  Sparkles,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisitorTracker } from "@/components/visitor-tracker";

export default function Home() {
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
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Introducing OnTarget ERP v5</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            Transform Your Business
            <br />
            <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              With Smart ERP Solutions
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8 sm:text-xl">
            Streamline operations, boost productivity, and drive growth with our
            comprehensive enterprise resource planning platform designed for
            modern businesses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
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
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Powerful Features for Your Business
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage and grow your enterprise efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10" />}
              title="Advanced Analytics"
              description="Get real-time insights with powerful analytics and customizable dashboards"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Team Collaboration"
              description="Enable seamless collaboration across departments and teams"
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10" />}
              title="Lightning Fast"
              description="Built with performance in mind for instant data access and processing"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10" />}
              title="Enterprise Security"
              description="Bank-level security with end-to-end encryption and compliance"
            />
            <FeatureCard
              icon={<Globe2 className="h-10 w-10" />}
              title="Global Reach"
              description="Multi-currency, multi-language support for global operations"
            />
            <FeatureCard
              icon={<Sparkles className="h-10 w-10" />}
              title="AI-Powered"
              description="Leverage AI for predictive analytics and intelligent automation"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select the perfect plan for your business needs. All plans include
              our core features.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Essential Plan */}
            <div className="relative flex flex-col rounded-2xl border bg-background p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Essential</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl text-destructive line-through font-semibold">
                    $39.99
                  </span>
                  <span className="text-4xl font-bold">$24.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-primary font-medium mt-2">
                  First year discount! Regular price $39.99/month
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or $19.99/month billed annually
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">1 company</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 5 admin accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 5 manager accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 5 staff accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 5 contractor accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 5 supplier accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 100 customers</span>
                </li>
              </ul>

              <div className="border-t pt-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  3.9% + $0.99 per CC transaction
                </p>
                <p className="text-xs text-muted-foreground">
                  Plus any other Stripe fees
                </p>
              </div>

              <Link href="/register?plan=ESSENTIAL" className="block mt-6">
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Growth Plan */}
            <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-background p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Growth</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$199.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  or $190.99/month billed annually
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">
                    Up to 3 companies
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 20 admin accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 20 manager accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 20 staff accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 20 contractor accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 20 supplier accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Up to 300 customers</span>
                </li>
              </ul>

              <div className="border-t pt-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  3.2% + $0.49 per CC transaction
                </p>
                <p className="text-xs text-muted-foreground">
                  Plus any other Stripe fees
                </p>
              </div>

              <Link href="/register?plan=GROWTH" className="block mt-6">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="relative flex flex-col rounded-2xl border bg-background p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$499.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  or $492.99/month billed annually
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">
                    Unlimited companies
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited admin accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited manager accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited staff accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited contractor accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited supplier accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited customers</span>
                </li>
              </ul>

              <div className="border-t pt-6 space-y-2">
                <p className="text-sm text-muted-foreground">
                  2.9% + $0.20 per CC transaction
                </p>
                <p className="text-xs text-muted-foreground">
                  Plus any other Stripe fees
                </p>
              </div>

              <Link href="/register?plan=ENTERPRISE" className="block mt-6">
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
                    href="/about"
                    className="hover:text-primary transition-colors"
                  >
                    About
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-background p-8 transition-all hover:shadow-lg hover:border-primary/50">
      <div className="mb-4 text-primary transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
