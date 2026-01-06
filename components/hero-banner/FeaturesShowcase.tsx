import React from "react";
import { Shield, Zap, Building, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const FeaturesShowcase: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-slate-950 via-purple-950 to-slate-900 text-white py-32">
      {/* Space Nebula Background */}
      <div className="absolute inset-0 opacity-50">
        <Image
          width={900}
          height={600}
          src="https://thumbs.dreamstime.com/b/abstract-purple-blue-nebula-cloud-formation-stunning-image-depicting-vibrant-shades-perfect-use-as-high-resolution-396813744.jpg"
          alt="Space nebula background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-slate-950/70" />
      </div>

      {/* Floating Holographic Elements */}
      <div className="absolute top-20 left-10 opacity-30 animate-pulse">
        <Image
          width={900}
          height={600}
          src="https://thumbs.dreamstime.com/b/futuristic-space-navigation-dashboard-digital-interface-detailed-featuring-circular-star-map-intricate-data-displays-369261671.jpg"
          alt="Futuristic dashboard"
          className="rounded-2xl shadow-2xl w-96"
        />
      </div>
      <div className="absolute bottom-40 right-20 opacity-30 animate-pulse delay-500">
        <Image
          width={900}
          height={600}
          src="https://t3.ftcdn.net/jpg/07/11/26/38/360_F_711263876_cPJeOJTF9FSLkBb9OP1iJZOC9dHUqEoM.jpg"
          alt="Spaceship dashboard"
          className="rounded-2xl shadow-2xl w-80"
        />
      </div>
      <div className="absolute top-1/3 right-1/4 opacity-20 animate-ping">
        <Image
          width={900}
          height={600}
          src="https://thumbs.dreamstime.com/b/technology-particle-digital-hologram-color-glow-sci-fi-futuristic-concept-data-ai-global-network-technology-particle-142823114.jpg"
          alt="AI hologram"
          className="rounded-2xl w-72"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 z-10">
        {/* Epic Heading */}
        <div className="text-center mb-24">
          <h2 className="text-6xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Unleash the Power
            <br />
            <span className="bg-linear-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Infinite Ai Driven Business Growth
            </span>
          </h2>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto">
            A complete All in one business ERP platform. Secure, intelligent,
            and built to help startup business grow.
          </p>
        </div>

        {/* Dramatic Feature Orbs - Floating Cards */}
        <div className="grid lg:grid-cols-3 gap-12 mb-32">
          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-purple-500/30 shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-purple-600/10 to-transparent rounded-3xl" />
            <div className="flex items-center gap-6 mb-10">
              <div className="p-6 bg-purple-600/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Building className="w-16 h-16 text-purple-400" />
              </div>
              <h3 className="text-4xl font-bold">Core Galaxy</h3>
            </div>
            <ul className="space-y-5 text-xl">
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-cyan-400" /> Company & Profile
                Management
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-cyan-400" /> Catalog (Products
                & Services)
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-cyan-400" /> Invoices, Orders,
                Payments
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-cyan-400" /> Projects &
                Timesheets
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-cyan-400" /> KB Articles &
                Blog-Ready Frontstore
              </li>
            </ul>
          </div>

          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/30 shadow-2xl hover:shadow-cyan-500/50 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-600/10 to-transparent rounded-3xl" />
            <div className="flex items-center gap-6 mb-10">
              <div className="p-6 bg-cyan-600/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Zap className="w-16 h-16 text-cyan-400" />
              </div>
              <h3 className="text-4xl font-bold">AI Nebula</h3>
            </div>
            <ul className="space-y-5 text-xl">
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-purple-400" /> Workforce & AI
                Onboarding
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-purple-400" /> Payroll
                Processing
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-purple-400" /> AI-Generated
                Frontstore + Cart
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-purple-400" /> Multiple AI
                Providers
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-purple-400" /> Email Templates
                & Providers
              </li>
            </ul>
          </div>

          <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-indigo-500/30 shadow-2xl hover:shadow-indigo-500/50 hover:-translate-y-4 transition-all duration-700">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-600/10 to-transparent rounded-3xl" />
            <div className="flex items-center gap-6 mb-10">
              <div className="p-6 bg-indigo-600/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Shield className="w-16 h-16 text-indigo-400" />
              </div>
              <h3 className="text-4xl font-bold">Fortress Shield</h3>
            </div>
            <ul className="space-y-5 text-xl">
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-indigo-400" /> Audit Logs &
                Data Isolation
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-indigo-400" /> Multi Geo
                Tracking & Payment Gateways
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-indigo-400" /> Secure Files +
                Cold Storage (S3, Azure, etc.)
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-indigo-400" /> OAuth, Captcha,
                Whitelabel Branding
              </li>
              <li className="flex items-center gap-4">
                <Sparkles className="w-6 h-6 text-indigo-400" /> Cancel Anytime
                – Full Data Export/Import
              </li>
            </ul>
          </div>
        </div>

        {/* Coming Soon - Blockchain Spotlight */}
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="bg-linear-to-r from-purple-800/50 to-indigo-800/50 backdrop-blur-2xl rounded-3xl p-16 border border-purple-500/50 shadow-2xl">
            <Image
              width={900}
              height={600}
              src="https://techvidvan.com/tutorials/wp-content/uploads/2022/06/blockchain-distributed-ledger-technology.webp"
              alt="Blockchain immutable records"
              className="mx-auto rounded-2xl shadow-2xl mb-10 w-full max-w-2xl opacity-80"
            />
            <h3 className="text-5xl font-bold mb-6 bg-linear-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Coming Soon: Immutable Blockchain Records
            </h3>
            <p className="text-2xl text-gray-300">
              Eternal, tamper-proof transaction ledgers across the cosmos of
              your data.
            </p>
          </div>
          <div className="absolute -inset-4 bg-purple-600/20 blur-3xl animate-pulse" />
        </div>

        {/* Final Epic CTA */}
        <div className="text-center mt-32">
          <Link
            href="/register?trial=true"
            className="group inline-flex items-center gap-6 bg-linear-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-3xl px-16 py-8 rounded-full shadow-2xl transform hover:scale-110 transition-all duration-500"
          >
            Launch Your Free 14-Day Trial
            <ArrowRight className="w-10 h-10 group-hover:translate-x-4 transition-transform" />
          </Link>
          <p className="mt-8 text-2xl text-gray-400">
            No credit card • Instant access to the entire universe
          </p>
        </div>
      </div>
    </section>
  );
};
