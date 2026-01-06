import React from "react";
import { Wrench, Calendar, Users, Zap, ArrowRight, Car } from "lucide-react";
import Image from "next/image";

export const MechanicsTaregtedHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      {/* Dark dramatic background overlay */}
      <div className="absolute inset-0 bg-linear-to-br from-neutral-950 via-black to-neutral-900" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625042470250-3e4247f8f6b0?ixlib=rb-4.0.3&auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-red-500">
              <Wrench className="w-8 h-8 animate-spin-slow" />
              <span className="text-sm font-medium tracking-wider uppercase">
                Built for Auto Repair Shops
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Run Your Mechanic Shop
              <br />
              <span className="text-red-500">Like a Pro</span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-2xl">
              Chat with AI: &quot;Add oil change service, $59.99, 45
              minutes&quot; or &quot;Book appointment for John Doe, brake
              replacement tomorrow 10am&quot; → Instantly update your services
              catalog, generate online booking, invoicing, customer portal, and
              full shop dashboard.
            </p>

            <div className="flex flex-wrap gap-6 text-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-red-500" />
                <span>AI Service & Parts Catalog</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-red-500" />
                <span>Online Booking & Scheduling</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-red-500" />
                <span>Customer History & Invoicing</span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8">
              <a
                href="/signup"
                className="group inline-flex items-center gap-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xl px-10 py-6 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Car className="w-8 h-8" />
                Start Your Free 14-Day Trial
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </a>
              <p className="mt-4 text-gray-400">
                No credit card required • Unlimited bookings during trial
              </p>
            </div>
          </div>

          {/* Right - Dramatic Mechanic Image */}
          <div className="relative">
            <div className="absolute -inset-4 bg-red-600/20 blur-3xl animate-pulse" />
            <Image
              width={900}
              height={600}
              src="https://thumbs.dreamstime.com/b/mechanic-repairing-sports-car-engine-garage-night-working-dimly-lit-surrounded-tools-equipment-creating-358881424.jpg"
              alt="Mechanic working under hood in dramatic garage lighting"
              className="relative rounded-2xl shadow-2xl object-cover w-full h-[600px] grayscale hover:grayscale-0 contrast-125 brightness-90 transition-all duration-700"
            />
            <div className="absolute bottom-6 left-6 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full border border-red-500/50">
              <p className="text-red-400 font-medium">
                Precision. Power. Profit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom subtle tool wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-red-600/10 to-transparent" />
    </section>
  );
};
