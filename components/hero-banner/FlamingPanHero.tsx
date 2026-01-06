import React from "react";
import Image from "next/image";

export const FlamingPanHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-gray-900 via-black to-gray-800 py-24 px-6">
      {/* Background Image - High-energy chef with flaming pan (dramatic B&W vibe) */}
      <div className="absolute inset-0">
        <Image
          width={900}
          height={600}
          src="https://thumbs.dreamstime.com/b/chef-cooking-flaming-pan-restaurant-kitchen-dramatic-culinary-action-shot-fire-highlights-skill-passion-400192710.jpg" // High-contrast B&W flaming action shot
          alt="Professional chef in action with flaming wok"
          className="w-full h-full object-cover opacity-40 grayscale"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/80" />
      </div>

      {/* Optional secondary subtle overlay image (cloud kitchen interior) */}
      <div className="absolute bottom-0 right-0 opacity-20">
        <Image
          width={900}
          height={600}
          src="https://images.prismic.io/cloudkitchens-main/39135a6f-d59f-4db3-bcc0-c7393247a3c1_Kitchen_11+Large.jpeg?auto=compress%2Cformat"
          alt="Modern cloud kitchen interior"
          className="w-96 h-96 object-cover grayscale"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center text-white">
        <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
          Power Your Cloud Kitchen with AI
        </h2>

        <p className="text-xl md:text-2xl mb-12 opacity-90 leading-relaxed max-w-4xl mx-auto">
          OnTarget Brands ERP is the smart, all-in-one solution for cloud
          kitchens. Simply chat with our AI in natural language — describe your
          menu items, ingredients, prices, and photos — and watch it instantly
          generate a beautiful, fully-functional online ordering storefront
          complete with payments, analytics, and delivery integration.
        </p>

        <div className="mb-10">
          <p className="text-lg md:text-xl opacity-80 mb-6">
            No coding. No developers. Just tell the AI what you want.
          </p>
          <p className="text-md opacity-70">
            Manage inventory, track orders, handle payouts, and scale multiple
            virtual brands — all from one dashboard.
          </p>
        </div>

        {/* Strong CTA */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <a
            href="/signup"
            className="px-12 py-6 bg-purple-600 text-white font-bold text-2xl rounded-full shadow-2xl hover:shadow-purple-500/60 hover:bg-purple-700 transform hover:scale-105 transition-all duration-300"
          >
            Start Your Free 14-Day Trial
          </a>

          <a
            href="/demo"
            className="px-10 py-6 border-4 border-white text-white font-semibold text-xl rounded-full hover:bg-white hover:text-black transition-all duration-300"
          >
            See AI Store Builder in Action
          </a>
        </div>

        <p className="mt-10 text-lg opacity-80">
          No credit card required • Instant access • Built for delivery-only
          brands
        </p>
      </div>

      {/* Bottom accent flame-like wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
          className="w-full h-32"
        >
          <path
            fill="rgba(139, 92, 246, 0.2)" // Purple accent
            d="M0,100 C360,200 1080,0 1440,100 L1440,200 L0,200 Z"
          />
        </svg>
      </div>
    </section>
  );
};
