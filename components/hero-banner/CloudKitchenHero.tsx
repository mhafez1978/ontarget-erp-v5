import React from "react";
import Image from "next/image";
import { Flame, ChefHat, Clock, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export const CloudKitchenHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      {/* Background subtle grain + dramatic overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-neutral-900 via-black to-neutral-950" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556912167-f556f1f39fdf?ixlib=rb-4.0.3&auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-orange-500">
              <Flame className="w-8 h-8 animate-pulse" />
              <span className="text-sm font-medium tracking-wider uppercase">
                Made for Cloud Kitchens
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Your Cloud Kitchen
              <br />
              <span className="text-orange-500">Deserves a Smart ERP</span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl">
              Just chat with our AI: &quot;Add Butter Chicken, ₹189, spicy,
              30min prep&quot; → Done. Your full online ordering store with live
              menu, payments, and analytics is ready in seconds.
            </p>

            <div className="flex flex-wrap gap-6 text-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-orange-500" />
                <span>AI Menu Upload via Chat</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-orange-500" />
                <span>Live Store in Under 60 Seconds</span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8">
              <Link
                href="/register?trial=true"
                className="group inline-flex items-center gap-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xl px-10 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <ChefHat className="w-8 h-8" />
                Start Your Free 14-Day Trial
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
              <p className="mt-4 text-gray-400">
                No credit card required • Unlimited orders during trial
              </p>
            </div>
          </div>

          {/* Right - Dramatic Chef Image (Black & White with fire pop) */}
          <div className="relative">
            <div className="absolute -inset-4 bg-orange-600/20 blur-3xl animate-pulse" />
            <Image
              width={900}
              height={600}
              src="https://images.unsplash.com/flagged/photo-1561350117-501b4661f8d4?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Chef tossing flaming pan in cloud kitchen"
              className="relative rounded-2xl shadow-2xl grayscale contrast-125 brightness-110 hover:grayscale-0 transition-all duration-700 object-cover w-full h-[600px]"
            />
            <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full border border-orange-500/50">
              <p className="text-orange-400 font-medium">
                The fire is real. So are the results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom flame wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-orange-600/10 to-transparent" />
    </section>
  );
};
