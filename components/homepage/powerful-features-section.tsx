import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe2, Users, Shield, BarChart3 } from "lucide-react";

export function PowerfulFeaturesSection() {
  return (
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
              Kanban boards, task assignments, deadlines, and progress tracking
              for complete project oversight.
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
              Stripe integration, subscription billing, invoicing, and financial
              ledger with automated tracking.
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
              Cloud storage with company folders, automatic backups, and secure
              file sharing across teams.
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
  );
}
