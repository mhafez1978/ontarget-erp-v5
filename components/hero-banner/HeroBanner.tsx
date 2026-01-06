import React from "react";
import Link from "next/link";

export const HeroBanner: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-purple-900 via-indigo-900 to-purple-800 min-h-screen flex items-center justify-center">
      {/* Spacey background effects */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-linear-to-t from-purple-600/30 to-transparent" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-40 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-400 rounded-full filter blur-2xl opacity-30 animate-ping" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
          Tired of Scattered Data,
          <br />
          Manual Onboarding, and No Online Store?
        </h1>

        <p className="text-xl md:text-2xl mb-12 opacity-90 leading-relaxed max-w-3xl mx-auto">
          OnTarget Brands ERP is your AI-driven all-in-one solution. Organize
          your catalog, HR, customer contacts — then let AI build a powerful
          storefront with payments, analytics, shopping cart, payouts,
          geo-fencing, project management, invoicing, employee clock-in,
          payroll, and seamless onboarding (including tax docs).
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            href="/register?trial=true" // Replace with your actual signup URL
            className="px-10 py-5 bg-white text-purple-900 font-semibold text-xl rounded-full shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
          >
            Sign Up for a Free Trial
          </Link>

          <Link
            href="/demo" // Optional secondary link
            className="px-8 py-5 border-2 border-white text-white font-medium text-xl rounded-full hover:bg-white hover:text-purple-900 transition-all duration-300"
          >
            Watch Demo
          </Link>
        </div>

        <p className="mt-12 text-lg opacity-80">
          No credit card required • Instant setup • Powered by AI
        </p>
      </div>

      {/* Bottom wave for modern feel */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="w-full h-32 md:h-48"
        >
          <path
            fill="#fff"
            fillOpacity="0.1"
            d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,122.7C672,107,768,117,864,138.7C960,160,1056,192,1152,197.3C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>
    </section>
  );
};
