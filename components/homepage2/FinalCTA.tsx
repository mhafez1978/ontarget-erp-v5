"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500 rounded-full filter blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-8">
          <Sparkles className="h-4 w-4 text-yellow-300" />
          <span className="text-sm font-semibold">Limited Time Offer</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Ready to Transform
          <br />
          Your Business?
        </h2>

        <p className="text-xl sm:text-2xl mb-12 opacity-90 leading-relaxed max-w-3xl mx-auto">
          Join thousands of businesses already using OnTarget ERP to streamline
          operations, boost productivity, and grow faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 shadow-2xl text-lg px-10 py-6 rounded-xl group"
          >
            <Link href="/register?trial=true">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-purple-600 text-lg px-10 py-6 rounded-xl"
          >
            <Link href="#contact">Talk to Sales</Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { label: "Setup Time", value: "< 5 minutes" },
            { label: "Trial Period", value: "14 days free" },
            { label: "Support", value: "24/7 available" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm opacity-70">
          🔒 No credit card required • 🚀 Cancel anytime • 💯 Money-back
          guarantee
        </p>
      </div>
    </section>
  );
}
