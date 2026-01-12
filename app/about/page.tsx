import { AboutSection } from "@/components/about-section";
import { Footer } from "@/components/homepage/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-[40vh] px-4 py-20 overflow-hidden border-b">
        <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/50 mask-[linear-gradient(to_bottom,white,transparent)]" />

        <div className="container relative z-10 mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">
            About OnTarget ERP
          </h1>
          <p className="text-lg dark:text-gray-200 max-w-2xl mx-auto">
            Learn more about our mission to help businesses grow with powerful
            ERP solutions
          </p>
        </div>
      </section>
      {/* About Section */}
      <AboutSection />
      {/* Footer */}
      <Footer />
    </div>
  );
}
