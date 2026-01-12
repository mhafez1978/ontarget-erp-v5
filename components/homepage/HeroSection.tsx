import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// import dynamic from "next/dynamic";

// Lazy load heavy components with proper loading states
// const GlobeMarkers = dynamic(
//   () =>
//     import("@/components/globe/globe-markers").then((mod) => ({
//       default: mod.GlobeMarkers,
//     })),
//   {
//     loading: () => (
//       <div className="w-full h-[600px] flex items-center justify-center bg-muted/20 rounded-lg">
//         <div className="animate-pulse dark:text-gray-200">
//           Loading globe...
//         </div>
//       </div>
//     ),
//   }
// );

export function HeroSection() {
  return (
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

        <p className="mx-auto max-w-2xl text-lg dark:text-gray-200 mb-4 sm:text-xl">
          Streamline operations, boost business, and drive growth with our
          comprehensive Ai driven enterprise resource planning platform
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-2">
          <Link href="/register">
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
          <div className="w-full max-w-4xl">{/* <GlobeMarkers /> */}</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              10K+
            </div>
            <div className="text-sm dark:text-gray-200">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              99.9%
            </div>
            <div className="text-sm dark:text-gray-200">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              50+
            </div>
            <div className="text-sm dark:text-gray-200">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              24/7
            </div>
            <div className="text-sm dark:text-gray-200">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}
