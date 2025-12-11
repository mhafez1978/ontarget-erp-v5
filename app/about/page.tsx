import { AboutSection } from "@/components/about-section";
import { VisitorTracker } from "@/components/visitor-tracker";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <VisitorTracker />
      
      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-[40vh] px-4 py-20 overflow-hidden border-b">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/50 mask-[linear-gradient(to_bottom,white,transparent)]" />
        
        <div className="container relative z-10 mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">
            About OnTarget ERP
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn more about our mission to help businesses grow with powerful ERP solutions
          </p>
        </div>
      </section>

      {/* About Section */}
      <AboutSection />

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/30 mt-auto">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/#features"
                    className="hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
                    className="hover:text-primary transition-colors"
                  >
                    Pricing
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
                    href="/#contact"
                    className="hover:text-primary transition-colors"
                  >
                    Contact
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
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="https://twitter.com"
                    className="hover:text-primary transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    className="hover:text-primary transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>
              © {new Date().getFullYear()} OnTarget ERP. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
