"use client";

import {
  Hammer,
  HardHat,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Drill,
} from "lucide-react";
import Image from "next/image";

export default function CraftAndBuildOrangeBlack() {
  return (
    <div className="font-sans bg-[#0f0f0f] text-[#f5f5f5]">
      {/* ------------------------------------------------ */}
      {/* 🟧 TOP NAV — ORANGE BAR */}
      {/* ------------------------------------------------ */}
      <header className="bg-[#ff6b00] shadow-lg sticky top-0 z-50 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* branding */}
          <div className="flex items-center gap-3">
            <HardHat className="h-8 w-8 text-black" />
            <h1 className="text-2xl font-extrabold tracking-wide text-black">
              Craft & Build Co.
            </h1>
          </div>

          {/* nav */}
          <nav className="hidden md:flex gap-8 font-semibold text-black">
            <a href="#about" className="hover:text-white">
              About
            </a>
            <a href="#projects" className="hover:text-white">
              Projects
            </a>
            <a href="#services" className="hover:text-white">
              Services
            </a>
            <a href="#contact" className="hover:text-white">
              Contact
            </a>
          </nav>
        </div>
      </header>

      {/* ------------------------------------------------ */}
      {/* 🏗️ ANNOUNCEMENT BAR */}
      {/* ------------------------------------------------ */}
      <div className="bg-black text-[#ff6b00] text-center py-2 font-semibold border-b border-[#ff6b00]">
        ⚠️ Need it done fast? Same-day repairs available!
      </div>

      {/* ------------------------------------------------ */}
      {/* 🛠 HERO — SINGLE COLUMN, CENTERED, NO IMAGE */}
      {/* ------------------------------------------------ */}
      <section className="relative py-40 max-w-7xl mx-auto bg-[#0f0f0f] text-center overflow-hidden">
        {/* Background steel texture */}
        <div className="absolute inset-0 opacity-[0.18] bg-[url('https://images.unsplash.com/photo-1520975936071-d2f3f1c3d6b8?auto=format&fit=crop&w=1200&q=50')] bg-cover bg-center"></div>

        {/* Central Orange Glow (centered correctly) */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                  bg-[#ff6b00] blur-[200px] opacity-25 
                  w-[700px] h-[700px] rounded-full"
        ></div>

        {/* Hazard tape top */}
        <div
          className="absolute top-0 left-0 w-full h-10 
        bg-[linear-gradient(45deg,#ff6b00_25%,black_25%,black_50%,#ff6b00_50%,#ff6b00_75%,black_75%)]
        bg-size-[45px_45px] opacity-25"
        ></div>

        <div className="relative mx-auto px-6">
          {/* Floating tool silhouette (moved higher so it doesn’t shift hero) */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 opacity-10 rotate-[-20deg]">
            <svg
              width="160"
              height="160"
              fill="none"
              stroke="#ff6b00"
              strokeWidth="6"
            >
              <path d="M25 80 L135 80 M80 25 L80 135" />
            </svg>
          </div>

          {/* HEADLINE */}
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-xl">
            Built Tough.
            <span className="block text-[#ff6b00]">Made to Last.</span>
            <span className="block text-white">Crafted by Experts.</span>
          </h1>

          {/* Subtext */}
          <p className="mt-10 text-xl lg:text-2xl  mx-auto text-gray-300 leading-relaxed">
            Premium renovations, repairs, and custom craftsmanship for homes and
            businesses. Reliable. Precise. Built with pride.
          </p>

          {/* CTA Button */}
          <a
            href="#contact"
            className="inline-block mt-14 bg-[#ff6b00] text-black font-extrabold 
                 px-14 py-4 rounded-md text-lg 
                shadow-[0_0_35px rgba(255,107,0,0.6)] 
                 hover:bg-[#e55f00] transition border-4 border-black"
          >
            Request a Free Quote →
          </a>
        </div>

        {/* Hazard tape bottom */}
        <div
          className="absolute bottom-0 left-0 w-full h-10 
        bg-[linear-gradient(45deg,#ff6b00_25%,black_25%,black_50%,#ff6b00_50%,#ff6b00_75%,black_75%)]
        bg-size-[45px_45px] opacity-25"
        ></div>
      </section>

      {/* ------------------------------------------------ */}
      {/* 🧰 LOGO CLOUD */}
      {/* ------------------------------------------------ */}
      <section className="py-14 bg-[#0f0f0f] border-y-4 border-[#ff6b00]">
        <div className="max-w-7xl mx-auto px-6 flex gap-10 items-center justify-center flex-wrap opacity-70">
          {["DEWALT", "RIDGID", "STIHL", "MILWAUKEE", "HUSQVARNA"].map((b) => (
            <span
              key={b}
              className="text-xl md:text-2xl font-extrabold tracking-widest text-[#ff6b00]"
            >
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* 🧱 FEATURED PROJECTS */}
      {/* ------------------------------------------------ */}
      <section id="projects" className="py-24 bg-[#151515]">
        <h3 className="text-4xl font-extrabold text-center text-[#ff6b00] mb-14">
          Recent Projects
        </h3>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10">
          {[
            {
              img: "https://images.unsplash.com/photo-1581091215367-59ab6bba336a?auto=format&fit=crop&w=900&q=80",
              title: "Kitchen Renovation",
            },
            {
              img: "https://images.unsplash.com/photo-1598214886806-c87b84b7078b?auto=format&fit=crop&w=900&q=80",
              title: "Custom Deck Build",
            },
            {
              img: "https://images.unsplash.com/photo-1615874959474-d609969a6f01?auto=format&fit=crop&w=900&q=80",
              title: "Workshop Construction",
            },
          ].map((p, i) => (
            <div
              key={i}
              className="bg-black rounded-xl shadow-xl overflow-hidden border-4 border-[#ff6b00]"
            >
              <Image
                src={p.img}
                alt={p.title || "project image"}
                width={900}
                height={256}
                className="h-64 w-full object-cover"
              />
              <div className="p-6">
                <h4 className="text-xl font-extrabold text-[#ff6b00]">
                  {p.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* 🛠 SERVICES — ORANGE GRID */}
      {/* ------------------------------------------------ */}
      <section
        id="services"
        className="py-24 bg-black border-y-4 border-[#ff6b00]"
      >
        <h3 className="text-4xl font-extrabold text-center text-[#ff6b00] mb-12">
          Our Expertise
        </h3>

        <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            {
              icon: <Hammer className="h-12 w-12 text-[#ff6b00]" />,
              title: "Home Renovations",
              desc: "Walls, floors, kitchens, bathrooms & more.",
            },
            {
              icon: <Wrench className="h-12 w-12 text-[#ff6b00]" />,
              title: "Custom Carpentry",
              desc: "Shelving, furniture, woodwork, framing.",
            },
            {
              icon: <Drill className="h-12 w-12 text-[#ff6b00]" />,
              title: "Commercial Builds",
              desc: "Office spaces, retail shops, warehouses.",
            },
            {
              icon: <HardHat className="h-12 w-12 text-[#ff6b00]" />,
              title: "Safety Inspections",
              desc: "Professional safety assessments & fixes.",
            },
            {
              icon: <Hammer className="h-12 w-12 text-[#ff6b00]" />,
              title: "Emergency Repairs",
              desc: "Same-day service for urgent issues.",
            },
            {
              icon: <Wrench className="h-12 w-12 text-[#ff6b00]" />,
              title: "Outdoor Projects",
              desc: "Decks, fences, sheds & patio builds.",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-[#151515] p-8 rounded-xl shadow-xl text-center border-4 border-[#ff6b00]"
            >
              <div className="flex justify-center mb-4">{s.icon}</div>
              <h4 className="text-xl font-bold text-[#ff6b00] mb-2">
                {s.title}
              </h4>
              <p className="text-gray-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* 💬 TESTIMONIALS */}
      {/* ------------------------------------------------ */}
      <section className="py-24 bg-[#151515]">
        <h3 className="text-4xl font-extrabold text-center text-[#ff6b00] mb-12">
          What Clients Say
        </h3>

        <div className="flex gap-6 overflow-x-auto px-6 pb-2">
          {[
            "Super reliable and professional — fixed our ceiling in a few hours.",
            "Best deck builders in the area. Strong, clean, and beautiful.",
            "Quick response, fair pricing, and quality craftsmanship!",
          ].map((t, i) => (
            <div
              key={i}
              className="bg-black min-w-[320px] p-8 rounded-xl border-l-8 border-[#ff6b00] shadow-xl"
            >
              <p className="italic text-gray-200">&quot;{t}&quot;</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* 📞 CONTACT */}
      {/* ------------------------------------------------ */}
      <section
        id="contact"
        className="py-24 bg-black text-white border-t-4 border-[#ff6b00]"
      >
        <h3 className="text-4xl font-extrabold text-center text-[#ff6b00] mb-10">
          Contact Us
        </h3>

        <div className="max-w-3xl mx-auto px-6">
          <form className="grid gap-6 bg-[#151515] p-10 rounded-xl border-4 border-[#ff6b00] shadow-xl">
            <input
              className="p-3 rounded bg-[#303030] text-white"
              placeholder="Your Name"
            />
            <input
              className="p-3 rounded bg-[#303030] text-white"
              placeholder="Email"
            />
            <textarea
              className="p-3 rounded bg-[#303030] text-white h-32"
              placeholder="Message"
            />
            <button className="bg-[#ff6b00] text-black py-3 font-extrabold rounded hover:bg-[#e56200] transition">
              Send Message
            </button>
          </form>

          <div className="text-center mt-8 text-lg space-y-2">
            <p className="flex justify-center gap-2">
              <Phone className="h-5 text-[#ff6b00]" /> (555) 987-BUILD
            </p>
            <p className="flex justify-center gap-2">
              <Mail className="h-5 text-[#ff6b00]" /> contact@craftbuild.com
            </p>
            <p className="flex justify-center gap-2">
              <MapPin className="h-5 text-[#ff6b00]" /> 45 Builder Road,
              Springfield
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ */}
      {/* FOOTER */}
      {/* ------------------------------------------------ */}
      <footer className="py-10 bg-[#0e0e0e] text-center text-[#ff6b00] font-semibold border-t-2 border-[#261400]">
        © {new Date().getFullYear()} Craft & Build Co. — Built Strong.
      </footer>
    </div>
  );
}
