"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModernHero() {
  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Animated background linear */}
      <div className="absolute inset-0 bg-linear-to-br from-violet-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-8">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-semibold">
                AI-Powered Business Suite
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Business,
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-yellow-300 via-pink-300 to-purple-300">
                Supercharged
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed">
              One platform to manage teams, track time, handle payroll, showcase
              products, and let AI build your storefront — automatically.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: Zap, text: "14-day free trial" },
                { icon: TrendingUp, text: "Setup in minutes" },
                { icon: Sparkles, text: "AI-powered" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                >
                  <item.icon className="h-4 w-4 text-yellow-300" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-2xl hover:shadow-purple-500/50 text-lg px-8 py-6 rounded-xl group"
              >
                <Link href="/register?trial=true">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-2xl hover:shadow-purple-500/50 text-lg px-8 py-6 rounded-xl group"
              >
                <Link href="#features">Explore Features</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <p className="mt-8 text-sm text-white/70">
              🔒 No credit card required • 🚀 Instant setup • 💎 Cancel anytime
            </p>
          </div>

          {/* Right column - Animated visual */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square">
              {/* Floating cards animation */}
              <div className="absolute inset-0 grid grid-cols-2 gap-4 animate-float">
                {[
                  {
                    title: "Time Tracking",
                    value: "8h 24m",
                    color: "from-green-400 to-emerald-500",
                  },
                  {
                    title: "Team Online",
                    value: "24/32",
                    color: "from-blue-400 to-cyan-500",
                  },
                  {
                    title: "Revenue",
                    value: "$45.2K",
                    color: "from-purple-400 to-pink-500",
                  },
                  {
                    title: "AI Tasks",
                    value: "128",
                    color: "from-orange-400 to-red-500",
                  },
                ].map((card, i) => (
                  <div
                    key={i}
                    className={`bg-linear-to-br ${card.color} p-6 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <p className="text-white/80 text-sm font-medium mb-2">
                      {card.title}
                    </p>
                    <p className="text-white text-3xl font-bold">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 text-white">
        <svg viewBox="0 0 1440 120" className="w-full h-24">
          <path
            fill="currentColor"
            d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
          />
        </svg>
      </div>
    </section>
  );
}
