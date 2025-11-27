"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Package,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Star,
  TrendingUp,
  Users,
  Award,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { ThemeSection } from "@/lib/storefront-themes";
import { themeComponents } from "@/components/storefront/themes";
import { TestimonialForm } from "@/components/storefront/testimonial-form";
import { ThemeProductLayout } from "@/components/storefront/theme-product-layouts";
import { BorderBeam } from "@/components/ui/border-beam";
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";
import { Meteors } from "@/components/ui/meteors";
import { getProxiedImageUrl } from "@/lib/image-proxy";

interface ProductImage {
  id: string;
  url: string;
  isFeatured: boolean;
  order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: ProductImage[];
  category: string | null;
  quantity?: number;
  isFeatured: boolean;
  isPublished: boolean;
}

interface ServiceImage {
  id: string;
  url: string;
  isFeatured: boolean;
  order: number;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  duration: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  images: ServiceImage[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  role: string;
  jobTitle: string | null;
  bio: string | null;
  displayOrder: number;
}

interface Testimonial {
  id: string;
  customerName: string;
  customerEmail: string;
  customerTitle: string | null;
  customerPhoto: string | null;
  rating: number;
  testimonial: string;
  isFeatured: boolean;
  createdAt: Date;
}

export interface ThemeRendererProps {
  sections: ThemeSection[];
  slug: string;
  companyName: string;
  featuredProducts: Product[];
  featuredServices: Service[];
  featuredTeamMembers: TeamMember[];
  testimonials: Testimonial[];
  themeId: string;
  storeBanner?: string | null;
  storeMetadata?: {
    socialLinks?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
  } | null;
}

export function BaseThemeRenderer({
  sections,
  slug,
  companyName,
  featuredProducts,
  featuredServices,
  featuredTeamMembers,
  testimonials,
  themeId,
  storeBanner,
  storeMetadata,
}: ThemeRendererProps) {
  // Helper to safely render content fields as strings
  const renderContent = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    return "";
  };

  // Normalize Image sources that may be provided as CSS url(...) or relative paths
  const normalizeImageSrc = (src?: string | null): string | null => {
    if (!src) return null;
    let value = src.trim();

    // Strip url(...) wrapper if present
    if (value.startsWith("url(")) {
      value = value
        .slice(4, -1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
    }

    // Protocol-relative
    if (value.startsWith("//")) {
      value = `https:${value}`;
    }

    // Absolute or root-relative
    if (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/")
    ) {
      return value;
    }

    // Fallback: ensure leading slash for relative assets
    return `/${value.replace(/^\/+/, "")}`;
  };

  /*
  // Full override: Boutique Fitness (retro/vintage) layout
  if (themeId === "fitness-boutique") {
    const heroSection = sections.find((s) => s.type === "hero");
    const heroContent = (heroSection?.content as Record<string, unknown>) || {};

    const classesToShow =
      featuredServices.length > 0
        ? featuredServices.slice(0, 3)
        : [
            {
              id: "cls1",
              name: "Retro Strength",
              description: "Classic lifts with funky energy.",
            },
            {
              id: "cls2",
              name: "80’s Burnout",
              description: "Cardio meets neon nostalgia.",
            },
            {
              id: "cls3",
              name: "Vintage HIIT",
              description: "High energy. Low boredom.",
            },
          ];

    const programsToShow =
      featuredProducts.length > 0
        ? featuredProducts.slice(0, 3)
        : [
            {
              id: "prg1",
              name: "Flex & Flow",
              description: "Mobility + rhythm in perfect harmony.",
            },
            {
              id: "prg2",
              name: "RetroCore 6-Week",
              description: "Vintage aesthetics. Modern core training.",
            },
            {
              id: "prg3",
              name: "Strength Revival",
              description: "Build muscle with timeless techniques.",
            },
          ];

    const testimonialsToShow =
      testimonials && testimonials.length > 0
        ? testimonials.slice(0, 3)
        : [
            {
              id: "t1",
              customerName: "Member",
              testimonial: "The best vibe ever!",
            },
            {
              id: "t2",
              customerName: "Member",
              testimonial: "Feels like the 80s but better.",
            },
            {
              id: "t3",
              customerName: "Member",
              testimonial: "A fitness studio with soul.",
            },
          ];

    return (
      <div className="bg-[#f3e7d8] text-[#3a2c20] font-sans min-h-screen">
        <div className="text-center bg-[#d36c3b] text-[#fff7e8] py-2 font-bold tracking-wide">
          ✦ MOVE RETRO. FEEL MODERN. LOVE THE ENERGY.✦
        </div>

        <header className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full -skew-y-3 bg-linear-to-br from-[#f5c07a]/40 to-[#d36c3b]/20"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-20 items-center">
            <div className="mt-10">
              <h2 className="text-5xl md:text-6xl font-extrabold leading-none tracking-tight text-[#3a2c20]">
                {renderContent(heroContent.title) || "Boutique Fitness"}
                <span className="block text-[#d36c3b] mt-2">
                  {renderContent(heroContent.subtitle) || "With Retro Soul"}
                </span>
              </h2>

              <p className="mt-6 text-lg max-w-md text-[#4b392a] leading-relaxed">
                {renderContent(heroContent.description) ||
                  "Step into a space built for energy, community, and style. RetroFit blends 80s attitude with modern fitness flow."}
              </p>

              <button className="mt-10 px-10 py-3 bg-[#d36c3b] text-[#fff7e8] rounded-md font-bold text-lg tracking-wide shadow-lg hover:bg-[#c55f33] transition">
                {renderContent(heroContent.primaryCTA) || "Start Your Journey"}
              </button>
            </div>

            <div className="relative transform rotate-1">
              <div className="bg-[#fff7e8] p-4 border-4 border-[#d36c3b] rounded-xl shadow-xl">
                <Image
                  src="https://illustrations.popsy.co/white/fitness-girl.svg"
                  alt="Retro Fitness Illustration"
                  width={400}
                  height={400}
                  className="rounded-lg drop-shadow-lg"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>
            </div>
          </div>
        </header>

        <section className="bg-[#fff7e8] border-y-4 border-[#d36c3b] py-6 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap font-bold text-[#6a5848] text-lg tracking-widest">
            <span className="mx-10 inline-block">RETROFIT</span>
            <span className="mx-10 inline-block">PULSE80</span>
            <span className="mx-10 inline-block">OLD SCHOOL GYM</span>
            <span className="mx-10 inline-block">WAVE STUDIO</span>
            <span className="mx-10 inline-block">BODYFLOW</span>
          </div>
        </section>

        <section className="py-24 bg-[#f3e7d8]">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-4xl font-extrabold text-[#3a2c20] text-center mb-16">
              Signature <span className="text-[#d36c3b]">Classes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {classesToShow.map((cls, i) => (
                <div
                  key={cls.id || i}
                  className={`p-10 bg-[#fff7e8] rounded-xl shadow-xl transform transition ${
                    i === 1
                      ? "rotate-2 border-4 border-[#3a2c20]"
                      : "border-4 border-[#d36c3b]"
                  } hover:rotate-0`}
                >
                  {
                    [
                      <Dumbbell
                        key="d"
                        className="h-12 w-12 text-[#d36c3b] mx-auto mb-4"
                      />,
                      <Flame
                        key="f"
                        className="h-12 w-12 text-[#d36c3b] mx-auto mb-4"
                      />,
                      <Timer
                        key="t"
                        className="h-12 w-12 text-[#d36c3b] mx-auto mb-4"
                      />,
                    ][i % 3]
                  }
                  <h4 className="text-2xl font-bold">{cls.name}</h4>
                  <p className="text-[#6a5848] mt-2">
                    {cls.description ||
                      "Energy-filled class with vintage vibes."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#fff7e8] border-y-4 border-[#d36c3b]">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-4xl font-extrabold text-center text-[#3a2c20] mb-16">
              Boutique <span className="text-[#d36c3b]">Programs</span>
            </h3>

            <div className="space-y-14">
              {programsToShow.map((p, i) => (
                <div
                  key={p.id || i}
                  className="grid md:grid-cols-3 gap-6 items-center p-8 bg-[#f3e7d8] border-4 border-[#3a2c20] rounded-xl shadow-md hover:-translate-y-1 transition"
                >
                  <p className="text-6xl font-extrabold text-[#d36c3b] text-center md:text-left">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <div className="md:col-span-2">
                    <h4 className="text-2xl font-bold text-[#3a2c20]">
                      {p.name}
                    </h4>
                    <p className="text-[#6a5848] mt-2">
                      {p.description ||
                        "Tailored programming to fit your journey."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#f3e7d8]">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-4xl font-extrabold text-center mb-16">
              Member <span className="text-[#d36c3b]">Stories</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {testimonialsToShow.map((quote, i) => (
                <div
                  key={quote.id || i}
                  className="p-10 bg-[#fff7e8] border-4 border-[#d36c3b] rounded-xl shadow-lg"
                >
                  <Star className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
                  <p className="text-xl italic text-[#3a2c20]">
                    &ldquo;{quote.testimonial || "Amazing experience!"}&rdquo;
                  </p>
                  <p className="mt-4 text-[#6a5848] text-sm">
                    — {quote.customerName || "Member"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#fff7e8]">
          <div className="max-w-4xl mx-auto px-6">
            <div className="border-4 border-[#3a2c20] bg-[#f3e7d8] rounded-xl p-10 shadow-2xl">
              <h3 className="text-4xl font-extrabold text-center text-[#3a2c20] mb-10">
                Contact <span className="text-[#d36c3b]">Us</span>
              </h3>

              <form className="grid gap-6">
                <input
                  placeholder="Your Name"
                  className="p-3 bg-[#fff7e8] border-2 border-[#d36c3b] rounded-md"
                />
                <input
                  placeholder="Your Email"
                  className="p-3 bg-[#fff7e8] border-2 border-[#d36c3b] rounded-md"
                />
                <textarea
                  placeholder="Your Message"
                  className="p-3 bg-[#fff7e8] border-2 border-[#d36c3b] rounded-md h-32"
                />
                <button className="bg-[#d36c3b] text-white font-bold py-3 rounded-md hover:bg-[#c55f33]">
                  Send Message
                </button>
              </form>

              <div className="mt-10 text-center font-bold space-y-2">
                <p className="flex items-center justify-center gap-2">
                  <Phone className="h-5" /> (555) 789-4561
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Mail className="h-5" /> hello@retrofitstudio.com
                </p>
                <p className="flex items-center justify-center gap-2">
                  <MapPin className="h-5" /> 45 Vintage Blvd, Miami FL
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-10 bg-[#3a2c20] text-center text-[#f3e7d8] font-bold tracking-wide border-t-4 border-[#d36c3b]">
          © {new Date().getFullYear()} {companyName || "RetroFit Studio"} — STAY
          VINTAGE. STAY STRONG.
        </footer>
      </div>
    );
  }

  // Full override: Digital Campus layout
  if (themeId === "education-digital-campus") {
    const heroSection = sections.find((s) => s.type === "hero");
    const heroContent = (heroSection?.content as Record<string, unknown>) || {};

    const courses = featuredServices.length
      ? featuredServices.slice(0, 3)
      : [
          {
            id: "course1",
            name: "Creative Writing",
            description: "Build stories, worlds, and imagination.",
          },
          {
            id: "course2",
            name: "Innovation Lab",
            description: "Hands-on learning for curious minds.",
          },
          {
            id: "course3",
            name: "Problem Solving",
            description: "Learn through puzzles, games, and exploration.",
          },
        ];

    const programs = featuredProducts.length
      ? featuredProducts.slice(0, 3)
      : [
          {
            id: "prg1",
            name: "STEM Discovery",
            description: "Explore science, tech, math & the world around you.",
          },
          {
            id: "prg2",
            name: "Digital Creators Bootcamp",
            description: "A playful start in design, content & creation.",
          },
          {
            id: "prg3",
            name: "Future Leaders",
            description: "Character, teamwork & confidence building.",
          },
        ];

    const testimonialsToShow =
      testimonials && testimonials.length
        ? testimonials.slice(0, 3)
        : [
            {
              id: "t1",
              customerName: "Student",
              testimonial: "DigitalCampus makes learning FUN!",
            },
            {
              id: "t2",
              customerName: "Parent",
              testimonial: "My child LOVES the activities!",
            },
            {
              id: "t3",
              customerName: "Student",
              testimonial: "The cohorts feel like a friendly classroom.",
            },
          ];

    return (
      <div className="bg-[#f7f9ff] text-[#1d1d1d] font-sans min-h-screen">
        <div className="text-center bg-[#ffdd33] text-[#1d1d1d] py-2 font-bold tracking-wide border-b-2 border-[#1d75ff]">
          🎓 LEARN. PLAY. GROW. — New cohorts start every Monday!
        </div>

        <header className="relative overflow-hidden bg-white">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ffdd33] rounded-full opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#1d75ff] rounded-full opacity-30"></div>

          <div className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-extrabold leading-tight text-[#1d75ff]">
                {renderContent(heroContent.title) || "A Digital Campus"}
                <span className="block text-[#ffdd33]">
                  {renderContent(heroContent.subtitle) ||
                    "Built for Curious Minds"}
                </span>
              </h2>
              <p className="mt-6 text-lg max-w-md text-[#3f3f3f] leading-relaxed">
                {renderContent(heroContent.description) ||
                  "Playful learning meets modern online education. Join structured, fun, interactive cohort-based programs designed to help you grow with joy."}
              </p>
              <button className="mt-10 px-10 py-3 bg-[#1d75ff] text-white rounded-lg font-bold text-lg shadow-lg hover:bg-[#155ad1] transition">
                {renderContent(heroContent.primaryCTA) || "Explore Courses"}
              </button>
            </div>

            <div>
              <div className="bg-[#ffdd33] p-4 border-4 border-[#1d75ff] rounded-xl shadow-xl">
                <Image
                  src="https://illustrations.popsy.co/blue/sitting-at-desk.svg"
                  alt="Digital Learning Illustration"
                  width={400}
                  height={400}
                  className="rounded-lg"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>
            </div>
          </div>
        </header>

        <section className="bg-[#ffdd33] border-y-4 border-[#1d75ff] py-6 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap font-bold text-[#1d75ff] text-lg tracking-widest">
            <span className="mx-10 inline-block">LEARNLAB</span>
            <span className="mx-10 inline-block">BRAINBOOST</span>
            <span className="mx-10 inline-block">EDUCOVE</span>
            <span className="mx-10 inline-block">KIDGENIUS</span>
            <span className="mx-10 inline-block">COHORT.CO</span>
          </div>
        </section>

        <section className="py-24 bg-[#f7f9ff]">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-4xl font-extrabold text-[#1d75ff] text-center mb-16">
              Featured <span className="text-[#ffdd33]">Courses</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {courses.map((course, i) => {
                const icon = [
                  <BookOpen
                    key="b"
                    className="h-12 w-12 text-[#1d75ff] mx-auto mb-4"
                  />,
                  <Lightbulb
                    key="l"
                    className="h-12 w-12 text-[#ffdd33] mx-auto mb-4"
                  />,
                  <Puzzle
                    key="p"
                    className="h-12 w-12 text-[#1d75ff] mx-auto mb-4"
                  />,
                ][i % 3];
                const border =
                  i === 1
                    ? "border-4 border-[#ffdd33]"
                    : "border-4 border-[#1d75ff]";
                const textColor = i === 1 ? "text-[#ffdd33]" : "text-[#1d75ff]";
                return (
                  <div
                    key={course.id || i}
                    className={`p-10 bg-white ${border} rounded-xl shadow-xl`}
                  >
                    {icon}
                    <h4 className={`text-2xl font-bold ${textColor}`}>
                      {course.name}
                    </h4>
                    <p className="text-[#3f3f3f] mt-2">
                      {course.description ||
                        "Learn through projects, mentorship, and community."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-24 bg-white border-y-4 border-[#1d75ff]">
          <div className="max-w-6xl mx-auto px-6">
            <h3 className="text-4xl font-extrabold text-center text-[#1d75ff] mb-16">
              Cohort <span className="text-[#ffdd33]">Programs</span>
            </h3>
            <div className="space-y-14">
              {programs.map((p, i) => (
                <div
                  key={p.id || i}
                  className="grid md:grid-cols-3 gap-6 items-center p-8 bg-[#f7f9ff] border-4 border-[#1d75ff] rounded-xl shadow-md hover:-translate-y-1 transition"
                >
                  <p className="text-6xl font-extrabold text-[#ffdd33] text-center md:text-left">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <div className="md:col-span-2">
                    <h4 className="text-2xl font-bold text-[#1d75ff]">
                      {p.name}
                    </h4>
                    <p className="text-[#3f3f3f] mt-2">
                      {p.description ||
                        "Structured cohorts with mentors and peers to keep you accountable."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#f7f9ff]">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-4xl font-extrabold text-center mb-16 text-[#1d75ff]">
              What <span className="text-[#ffdd33]">Students Say</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {testimonialsToShow.map((quote, i) => (
                <div
                  key={quote.id || i}
                  className="p-10 bg-white border-4 border-[#ffdd33] rounded-xl shadow-lg"
                >
                  <Star className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
                  <p className="text-xl italic text-[#1d1d1d]">
                    &ldquo;{quote.testimonial || "Great experience!"}&rdquo;
                  </p>
                  <p className="mt-4 text-[#3f3f3f] text-sm">
                    — {quote.customerName || "Student"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="border-4 border-[#1d75ff] bg-[#f7f9ff] rounded-xl p-10 shadow-2xl">
              <h3 className="text-4xl font-extrabold text-center text-[#1d75ff] mb-10">
                Contact <span className="text-[#ffdd33]">Us</span>
              </h3>
              <form className="grid gap-6">
                <input
                  placeholder="Your Name"
                  className="p-3 bg-white border-2 border-[#1d75ff] rounded-md"
                />
                <input
                  placeholder="Your Email"
                  className="p-3 bg-white border-2 border-[#1d75ff] rounded-md"
                />
                <textarea
                  placeholder="Your Message"
                  className="p-3 bg-white border-2 border-[#1d75ff] rounded-md h-32"
                />
                <button className="bg-[#1d75ff] text-white font-bold py-3 rounded-md hover:bg-[#155ad1]">
                  Send Message
                </button>
              </form>
              <div className="mt-10 text-center font-bold space-y-2 text-[#1d75ff]">
                <p className="flex items-center justify-center gap-2">
                  <Phone className="h-5" /> (555) 900-2211
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Mail className="h-5" /> hello@digitalcampus.com
                </p>
                <p className="flex items-center justify-center gap-2">
                  <MapPin className="h-5" /> 200 Learning Ave, Online Campus
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-10 bg-[#1d75ff] text-center text-white font-bold tracking-wide border-t-4 border-[#ffdd33]">
          © {new Date().getFullYear()} {companyName || "DigitalCampus"} — LEARN.
          PLAY. GROW.
        </footer>
      </div>
    );
  }

  // Full override: Construction / Craft & Build (orange/black)
  if (themeId === "construction-buildcraft") {
    const projects: Product[] =
      featuredProducts.length > 0
        ? featuredProducts.slice(0, 3)
        : [
            {
              id: "proj1",
              name: "Kitchen Renovation",
              description: null,
              price: 0,
              category: null,
              quantity: 0,
              isFeatured: false,
              isPublished: true,
              images: [
                {
                  id: "proj1-img",
                  url: "https://images.unsplash.com/photo-1581091215367-59ab6bba336a?auto=format&fit=crop&w=900&q=80",
                  isFeatured: true,
                  order: 0,
                },
              ],
            },
            {
              id: "proj2",
              name: "Custom Deck Build",
              description: null,
              price: 0,
              category: null,
              quantity: 0,
              isFeatured: false,
              isPublished: true,
              images: [
                {
                  id: "proj2-img",
                  url: "https://images.unsplash.com/photo-1598214886806-c87b84b7078b?auto=format&fit=crop&w=900&q=80",
                  isFeatured: true,
                  order: 0,
                },
              ],
            },
            {
              id: "proj3",
              name: "Workshop Construction",
              description: null,
              price: 0,
              category: null,
              quantity: 0,
              isFeatured: false,
              isPublished: true,
              images: [
                {
                  id: "proj3-img",
                  url: "https://images.unsplash.com/photo-1615874959474-d609969a6f01?auto=format&fit=crop&w=900&q=80",
                  isFeatured: true,
                  order: 0,
                },
              ],
            },
          ];

    const servicesList =
      featuredServices.length > 0
        ? featuredServices.slice(0, 6)
        : [
            {
              id: "svc1",
              name: "Home Renovations",
              description: "Walls, floors, kitchens, bathrooms & more.",
            },
            {
              id: "svc2",
              name: "Custom Carpentry",
              description: "Shelving, furniture, woodwork, framing.",
            },
            {
              id: "svc3",
              name: "Commercial Builds",
              description: "Office spaces, retail shops, warehouses.",
            },
            {
              id: "svc4",
              name: "Safety Inspections",
              description: "Professional safety assessments & fixes.",
            },
            {
              id: "svc5",
              name: "Emergency Repairs",
              description: "Same-day service for urgent issues.",
            },
            {
              id: "svc6",
              name: "Outdoor Projects",
              description: "Decks, fences, sheds & patio builds.",
            },
          ];

    const testimonialsToShow =
      testimonials && testimonials.length
        ? testimonials.slice(0, 3)
        : [
            {
              id: "t1",
              customerName: "Client",
              testimonial:
                "Super reliable and professional — fixed our ceiling in a few hours.",
            },
            {
              id: "t2",
              customerName: "Client",
              testimonial:
                "Best deck builders in the area. Strong, clean, and beautiful.",
            },
            {
              id: "t3",
              customerName: "Client",
              testimonial:
                "Quick response, fair pricing, and quality craftsmanship!",
            },
          ];

    return (
      <div className="font-sans bg-[#0f0f0f] text-[#f5f5f5]">
        <div className="bg-black text-[#ff6b00] text-center py-2 font-semibold border-b border-[#ff6b00]">
          ⚠️ Need it done fast? Same-day repairs available!
        </div>

        <section className="relative py-32 bg-[#0f0f0f] text-center overflow-hidden">
          <div className="absolute inset-0 opacity-[0.18] bg-[url('https://images.unsplash.com/photo-1520975936071-d2f3f1c3d6b8')] bg-cover bg-center"></div>
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 bg-[#ff6b00] blur-[180px] opacity-20 w-[600px] h-[600px] rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-10 bg-[linear-gradient(45deg,#ff6b00_25%,black_25%,black_50%,#ff6b00_50%,#ff6b00_75%,black_75%)] bg-size[45px_45px] opacity-25"></div>

          <div className="relative max-w-3xl mx-auto px-6">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-10 rotate-[-20deg]">
              <svg
                width="140"
                height="140"
                fill="none"
                stroke="#ff6b00"
                strokeWidth="6"
              >
                <path d="M20 70 L120 70 M70 20 L70 120" />
              </svg>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-white drop-shadow-xl">
              Built Tough.
              <span className="block text-[#ff6b00]">Made to Last.</span>
              <span className="block text-white">Crafted by Experts.</span>
            </h1>

            <p className="mt-8 text-lg md:text-xl max-w-2xl mx-auto text-gray-300 leading-relaxed">
              Premium renovations, repairs, and custom craftsmanship for homes
              and businesses. Reliable. Precise. Built with pride.
            </p>

            <a
              href="#contact"
              className="inline-block mt-12 bg-[#ff6b00] text-black font-extrabold px-12 py-4 rounded-md text-lg shadow-[0_0_25px_rgba(255,107,0,0.5)] hover:bg-[#e55f00] transition border-4 border-black"
            >
              Request a Free Quote →
            </a>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-10 bg-[linear-gradient(45deg,#ff6b00_25%,black_25%,black_50%,#ff6b00_50%,#ff6b00_75%,black_75%)] bg-[length:45px_45px] opacity-25"></div>
        </section>

        <section className="py-14 bg-[#0f0f0f] border-y-4 border-[#ff6b00]">
          <div className="max-w-7xl mx-auto px-6 flex gap-10 items-center justify-center flex-wrap opacity-70">
            {["DEWALT", "RIDGID", "STIHL", "MILWAUKEE", "HUSQVARNA"].map(
              (b) => (
                <span
                  key={b}
                  className="text-xl md:text-2xl font-extrabold tracking-widest text-[#ff6b00]"
                >
                  {b}
                </span>
              )
            )}
          </div>
        </section>

        <section id="projects" className="py-24 bg-[#151515]">
          <h3 className="text-4xl font-extrabold text-center text-[#ff6b00] mb-14">
            Recent Projects
          </h3>
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10">
            {projects.map((p, i) => (
              <div
                key={p.id || i}
                className="bg-black rounded-xl shadow-xl overflow-hidden border-4 border-[#ff6b00]"
              >
                <div className="relative h-64 w-full">
                  <Image
                    src={p.images?.[0]?.url || ""}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-extrabold text-[#ff6b00]">
                    {p.name}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="services"
          className="py-24 bg-black border-y-4 border-[#ff6b00]"
        >
          <h3 className="text-4xl font-extrabold text-center text-[#ff6b00] mb-12">
            Our Expertise
          </h3>
          <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {servicesList.map((s, i) => {
              const icon = [
                <Hammer key="h1" className="h-12 w-12 text-[#ff6b00]" />,
                <Wrench key="w1" className="h-12 w-12 text-[#ff6b00]" />,
                <Drill key="d1" className="h-12 w-12 text-[#ff6b00]" />,
                <HardHat key="hh" className="h-12 w-12 text-[#ff6b00]" />,
              ][i % 4];
              return (
                <div
                  key={s.id || i}
                  className="bg-[#151515] p-8 rounded-xl shadow-xl text-center border-4 border-[#ff6b00]"
                >
                  <div className="flex justify-center mb-4">{icon}</div>
                  <h4 className="text-xl font-bold text-[#ff6b00] mb-2">
                    {s.name}
                  </h4>
                  <p className="text-gray-300">
                    {s.description || "Quality, reliable craftsmanship."}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="py-24 bg-[#151515]">
          <h3 className="text-4xl font-extrabold text-center text-[#ff6b00] mb-12">
            What Clients Say
          </h3>
          <div className="flex gap-6 overflow-x-auto px-6 pb-2">
            {testimonialsToShow.map((t, i) => (
              <div
                key={t.id || i}
                className="bg-black min-w-[320px] p-8 rounded-xl border-l-8 border-[#ff6b00] shadow-xl"
              >
                <p className="italic text-gray-200">
                  &ldquo;{t.testimonial}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </section>

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

        <footer className="py-10 bg-[#0e0e0e] text-center text-[#ff6b00] font-semibold border-t-2 border-[#261400]">
          © {new Date().getFullYear()} {companyName || "Craft & Build Co."} —
          Built Strong.
        </footer>
      </div>
    );
  }
  */

  const renderSection = (section: ThemeSection) => {
    if (!section.enabled) return null;

    const { type, content, styling } = section;
    const bgClass = styling?.backgroundColor || "bg-background";
    const textClass = styling?.textColor || "text-foreground";

    switch (type) {
      case "promo-banner":
        return (
          <div
            key={section.id}
            className={`py-3 px-4 text-center ${bgClass} ${textClass} sticky top-0 z-50 shadow-md`}
            style={{
              background: styling?.gradient || undefined,
            }}
          >
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <span className="text-sm sm:text-base font-semibold">
                {String(content.text || "")}
              </span>
              {content.countdown && content.countdownDate && (
                <span className="text-sm sm:text-base font-bold px-3 py-1 bg-black/20 rounded">
                  {/* Countdown timer placeholder - implement with client-side JS */}
                  LIVE NOW
                </span>
              )}
              {content.link && content.linkText && (
                <a
                  href={content.link as string}
                  className="text-sm sm:text-base font-bold underline hover:opacity-80 transition-opacity"
                >
                  {String(content.linkText)}
                </a>
              )}
            </div>
          </div>
        );

      case "hero": {
        const heroLayout = (content.layout as string) || "centered";
        const animationStyle = (content.animationStyle as string) || "default";
        const isVeteransDay = themeId === "veterans-day-patriotic";
        const isHealthcareHero = themeId === "healthcare-precision-care";
        const isSummerParadise = themeId === "summer-paradise";
        const isFintechTrustLab = themeId === "fintech-trust-lab";
        const storeBannerImage = normalizeImageSrc(storeBanner);
        const defaultHeroFallback =
          "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80";

        // Spooky Halloween: custom full-width hero
        if (themeId === "spooky-halloween") {
          const heroBg =
            normalizeImageSrc(content.backgroundImage as string) ||
            normalizeImageSrc(storeBanner) ||
            "/patterns/spiderwebs.svg";

          return (
            <section
              key={section.id}
              className={`relative overflow-hidden w-full ${bgClass} ${textClass}`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: heroBg ? `url(${heroBg})` : undefined,
                }}
              />
              <div className="absolute inset-0 bg-black/70" />

              <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
                <div className="mx-auto flex w-full flex-col items-center gap-6 text-center">
                  {content.badge && (
                    <div className="mx-auto flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full bg-orange-100 px-7 py-2 transition-all hover:bg-orange-200">
                      <span className="text-sm font-semibold text-orange-600">
                        {renderContent(content.badge)}
                      </span>
                    </div>
                  )}

                  {content.title && (
                    <h1 className="mt-2 max-w-4xl bg-linear-to-br from-orange-200 via-orange-400 to-purple-300 bg-clip-text text-4xl font-extrabold text-transparent sm:text-6xl">
                      {renderContent(content.title)}
                    </h1>
                  )}

                  {content.subtitle && (
                    <span className="max-w-2xl text-xl leading-relaxed text-gray-200">
                      {renderContent(content.subtitle)}
                    </span>
                  )}

                  {content.description && (
                    <p className="mt-2 rounded border border-orange-500/60 bg-black/30 px-3 py-1 text-sm text-orange-200 shadow">
                      {renderContent(content.description)}
                    </p>
                  )}

                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                    {content.primaryCTA && (
                      <Link
                        href="#contact"
                        className="flex flex-row items-center justify-center gap-x-2 rounded-lg bg-orange-500 px-10 py-3 text-white shadow-lg hover:bg-orange-600 transition"
                      >
                        {renderContent(content.primaryCTA)}
                      </Link>
                    )}
                    {content.secondaryCTA && (
                      <Link
                        href="#storefront"
                        className="flex flex-row items-center justify-center gap-x-2 rounded-lg border border-orange-400 px-10 py-3 text-orange-200 hover:bg-orange-400/10 transition"
                      >
                        {renderContent(content.secondaryCTA)} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (isVeteransDay) {
          const heroTitle =
            renderContent(content.title) || "Honoring Those Who Served";
          const heroSubtitle =
            renderContent(content.subtitle) || "Veterans Day Sale";
          const heroDescription =
            renderContent(content.description) ||
            "25% off for all veterans and active military. Because your service deserves recognition.";
          const primaryCta =
            renderContent(content.primaryCTA) || "Shop Veterans Sale";
          const secondaryCta =
            renderContent(content.secondaryCTA) || "Learn More";

          return (
            <section
              key={section.id}
              className={`relative overflow-hidden w-full ${bgClass} ${textClass}`}
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-linear-to-b from-[#B22234] via-[#111827] to-[#1D4ED8]" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.4),transparent_60%)]" />
                <div className="absolute bottom-0 left-0 w-full h-10 bg-[linear-gradient(90deg,#B22234_0,#B22234_20%,#FFFFFF_20%,#FFFFFF_40%,#B22234_40%,#B22234_60%,#FFFFFF_60%,#FFFFFF_80%,#B22234_80%,#B22234_100%)] opacity-70" />
              </div>

              <div className="relative z-10 container mx-auto px-4 py-16 sm:py-20 lg:py-24 flex flex-col lg:flex-row items-center justify-center gap-12">
                <div className="max-w-xl text-center space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 border border-white/30 text-xs font-semibold tracking-wide text-white uppercase">
                    <span>Veterans Day</span>
                    <span className="hidden sm:inline">
                      Thank you for your service
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white drop-shadow">
                    {heroTitle}
                  </h1>
                  <p className="text-lg font-semibold text-yellow-300">
                    {heroSubtitle}
                  </p>
                  <p className="text-sm sm:text-base text-gray-100/90 max-w-xl">
                    {heroDescription}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                    <Button
                      asChild
                      size="lg"
                      className="bg-[#B22234] hover:bg-[#991b2f] text-white font-semibold shadow-md"
                    >
                      <Link href="#featured-products">{primaryCta}</Link>
                    </Button>
                    {secondaryCta && (
                      <Button
                        asChild
                        size="lg"
                        variant="outline"
                        className="border-white/70 text-white hover:bg-white/10"
                      >
                        <Link href="#contact">{secondaryCta}</Link>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="relative w-full max-w-md">
                  <div className="aspect-4/3 rounded-3xl border border-white/20 bg-black/30 overflow-hidden shadow-2xl flex items-center justify-center">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.35),transparent_55%)]" />
                    <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
                      <div className="flex items-center gap-3 text-white font-semibold tracking-wide">
                        <span className="text-3xl">⭐</span>
                        <span>Veteran owned. Veteran honored.</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-100/90 max-w-xs">
                        A portion of every purchase supports veteran-focused
                        organizations and community initiatives.
                      </p>
                      <div className="flex gap-2 text-xs text-gray-200/90 flex-wrap justify-center">
                        <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">
                          Military discount
                        </span>
                        <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">
                          Free returns for veterans
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (isHealthcareHero) {
          const heroBg =
            normalizeImageSrc(content.backgroundImage as string) ||
            normalizeImageSrc(storeBanner) ||
            "https://tailwindcss.com/plus-assets/img/component-images/dark-project-app-screenshot.png";

          return (
            <section
              key={section.id}
              className={`relative overflow-hidden w-full ${bgClass} ${textClass}`}
            >
              {/* Full-bleed background */}
              <div className="absolute inset-0">
                <Image
                  src={heroBg}
                  alt="Hero background"
                  fill
                  className="h-full w-full object-cover"
                  sizes="100vw"
                  priority
                />
                <div className="absolute inset-0 bg-gray-900/70" />
              </div>

              <div className="w-full py-12 sm:py-16 px-0">
                <div className="relative isolate overflow-hidden bg-gray-900/80 px-4 sm:px-10 lg:px-16 pt-16 shadow-2xl w-full lg:flex lg:items-center lg:gap-x-16 lg:pt-0">
                  <svg
                    viewBox="0 0 1024 1024"
                    aria-hidden="true"
                    className="absolute top-1/2 left-1/2 -z-10 h-64 w-64 -translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
                  >
                    <circle
                      r={512}
                      cx={512}
                      cy={512}
                      fill="url(#healthcare-hero-gradient)"
                      fillOpacity="0.7"
                    />
                    <defs>
                      <radialGradient id="healthcare-hero-gradient">
                        <stop stopColor="#0EA5E9" />
                        <stop offset={1} stopColor="#6366F1" />
                      </radialGradient>
                    </defs>
                  </svg>
                  <div className="w-full max-w-xl text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left space-y-6">
                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      {renderContent(content.title)}
                    </h1>
                    {content.subtitle && (
                      <p className="text-lg text-gray-200">
                        {renderContent(content.subtitle)}
                      </p>
                    )}
                    {content.description && (
                      <p className="text-lg/8 text-gray-300">
                        {renderContent(content.description)}
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                      {content.primaryCTA && (
                        <Link
                          href="#contact"
                          className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          {renderContent(content.primaryCTA)}
                        </Link>
                      )}
                      {content.secondaryCTA && (
                        <Link
                          href="#"
                          className="text-sm font-semibold text-white hover:text-gray-100 inline-flex items-center gap-1"
                        >
                          {renderContent(content.secondaryCTA)}
                          <span aria-hidden="true">→</span>
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="relative mt-16 h-80 lg:mt-8 flex items-center justify-center lg:w-1/2">
                    <Image
                      alt={renderContent(content.subtitle) || "Clinic hero"}
                      src={heroBg}
                      width={800}
                      height={320}
                      className="w-full max-w-2xl rounded-md bg-white/5 ring-1 ring-white/10 shadow-2xl"
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (isFintechTrustLab) {
          const heroBg =
            normalizeImageSrc(content.backgroundImage as string) ||
            normalizeImageSrc(storeBanner) ||
            null;

          return (
            <section
              key={section.id}
              className={`relative w-full overflow-hidden ${bgClass} ${textClass}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(15,23,42,0.35),transparent_45%)]" />
              {heroBg && (
                <div className="absolute inset-0">
                  <Image
                    src={heroBg}
                    alt="Hero backdrop"
                    fill
                    className="object-cover opacity-20"
                    sizes="100vw"
                    priority
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-b from-background/30 via-background/50 to-background/80" />

              <div className="relative mx-auto flex min-h-[75vh] flex-col justify-center px-4 py-16 sm:px-8 md:px-12 lg:px-16 max-w-6xl">
                <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-6">
                    {content.showBadge && content.badgeText && (
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-200 ring-1 ring-white/10 backdrop-blur">
                        <ShieldCheck className="h-4 w-4" />
                        {renderContent(content.badgeText)}
                      </div>
                    )}

                    {content.title && (
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-slate-50">
                        {renderContent(content.title)}
                      </h1>
                    )}

                    {content.subtitle && (
                      <p className="text-lg sm:text-xl text-slate-200/90">
                        {renderContent(content.subtitle)}
                      </p>
                    )}

                    {content.description && (
                      <p className="text-base sm:text-lg text-slate-300/90 max-w-2xl">
                        {renderContent(content.description)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {content.primaryCTA && (
                        <Button
                          size="lg"
                          asChild
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                        >
                          <Link href="#contact">
                            {renderContent(content.primaryCTA)}
                          </Link>
                        </Button>
                      )}
                      {content.secondaryCTA && (
                        <Button
                          size="lg"
                          variant="outline"
                          asChild
                          className="border-slate-700 text-slate-100 hover:bg-white/10"
                        >
                          <Link href="#storefront">
                            {renderContent(content.secondaryCTA)} →
                          </Link>
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                        <p className="text-sm text-slate-300 flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-cyan-300" />
                          Security SLA
                        </p>
                        <p className="text-2xl font-bold text-slate-50 mt-1">
                          99.99%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                        <p className="text-sm text-slate-300 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-violet-300" />
                          Compliance
                        </p>
                        <p className="text-2xl font-bold text-slate-50 mt-1">
                          SOC2 | ISO
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                        <p className="text-sm text-slate-300 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-300" />
                          Uptime
                        </p>
                        <p className="text-2xl font-bold text-slate-50 mt-1">
                          24/7
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                      <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
                      <div className="absolute -right-10 top-12 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-300">
                              Risk Checks
                            </p>
                            <p className="text-3xl font-semibold text-slate-50">
                              +184%
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-cyan-500/20 text-cyan-100 border-cyan-500/40"
                          >
                            Live
                          </Badge>
                        </div>
                        <div className="h-28 rounded-2xl bg-linear-to-r from-cyan-500/15 via-violet-500/10 to-slate-900 border border-white/10" />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-xs text-slate-300">Latency</p>
                            <p className="text-lg font-semibold text-slate-50">
                              42 ms
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-xs text-slate-300">Coverage</p>
                            <p className="text-lg font-semibold text-slate-50">
                              32 countries
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-xs text-slate-300">Signals</p>
                            <p className="text-lg font-semibold text-slate-50">
                              120+
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-xs text-slate-300">Alerts/day</p>
                            <p className="text-lg font-semibold text-slate-50">
                              8.2k
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        if (isSummerParadise) {
          //const normalizedBanner = normalizeImageSrc(storeBanner);
          // const bannerLooksLikePattern =
          //   normalizedBanner?.includes("/patterns/") ||
          //   normalizedBanner?.endsWith(".svg");
          // const bannerLooksLikeColorOrData =
          //   normalizedBanner?.startsWith("/#") ||
          //   normalizedBanner?.startsWith("#") ||
          //   normalizedBanner?.startsWith("data:") ||
          //   normalizedBanner?.includes("gradient");

          const heroImage1 =
            normalizeImageSrc(
              (content as Record<string, unknown>).heroImage1 as string
            ) ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600";
          const heroImage2 =
            normalizeImageSrc(
              (content as Record<string, unknown>).heroImage2 as string
            ) ||
            "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&q=80&w=1600";

          return (
            <section
              key={section.id}
              className={`w-full ${bgClass} ${textClass}`}
              style={{ background: styling?.gradient || undefined }}
            >
              <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="bg-linear-to-br from-yellow-300 via-orange-300 to-pink-300 p-8 md:p-12 lg:px-16 lg:py-24 rounded-2xl shadow-2xl">
                    <div className="mx-auto max-w-xl text-center space-y-4 sm:space-y-6">
                      {content.title && (
                        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                          {renderContent(content.title)}
                        </h1>
                      )}

                      {content.subtitle && (
                        <p className="text-base sm:text-lg font-semibold text-white/90">
                          {renderContent(content.subtitle)}
                        </p>
                      )}

                      {content.description && (
                        <p className="hidden text-white/90 sm:block">
                          {renderContent(content.description)}
                        </p>
                      )}

                      <div className="flex flex-col items-center justify-center gap-3 md:gap-4">
                        {content.primaryCTA && (
                          <Link
                            href="#storefront"
                            className="inline-block rounded-sm border border-white bg-white px-8 py-3 text-sm font-medium text-orange-600 transition hover:bg-transparent hover:text-white focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:outline-none"
                          >
                            {renderContent(content.primaryCTA)}
                          </Link>
                        )}
                        {content.secondaryCTA && (
                          <Link
                            href="#contact"
                            className="text-sm font-semibold text-white/90 hover:text-white"
                          >
                            {renderContent(content.secondaryCTA)} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-1 lg:grid-cols-2">
                    <div className="relative h-40 w-full overflow-hidden rounded-lg sm:h-56 md:h-full">
                      <Image
                        src={heroImage1}
                        alt={
                          renderContent(content.subtitle) || "Summer getaway"
                        }
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                    <div className="relative h-40 w-full overflow-hidden rounded-lg sm:h-56 md:h-full">
                      <Image
                        src={heroImage2}
                        alt={renderContent(content.title) || "Beach vibes"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        const heroImageSrc =
          normalizeImageSrc(content.backgroundImage as string) ||
          storeBannerImage ||
          normalizeImageSrc(styling?.backgroundImage as string) ||
          defaultHeroFallback;
        const hasBackgroundImage = !!heroImageSrc;

        return (
          <section
            key={section.id}
            className={`relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex items-center justify-center overflow-hidden ${bgClass} ${textClass}`}
            style={{
              background: storeBanner
                ? "transparent"
                : styling?.gradient || undefined,
            }}
          >
            {hasBackgroundImage && (
              <div className="absolute inset-0 z-0">
                <Image
                  src={heroImageSrc!}
                  alt="Store banner"
                  fill
                  className="w-full h-full object-cover"
                  sizes="100vw"
                  priority
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            )}

            {isVeteransDay && (
              <div className="hidden md:block">
                <Meteors number={30} />
              </div>
            )}

            {styling?.pattern && !storeBanner && (
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                {styling.pattern === "diagonal-stripes" && (
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,currentColor_10px,currentColor_20px)]" />
                )}
                {styling.pattern === "grid-lines" && (
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-size-[40px_40px]" />
                )}
              </div>
            )}

            {!storeBanner && animationStyle !== "minimal" && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
                <div
                  className={`absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl ${
                    animationStyle === "bouncy"
                      ? "animate-bounce"
                      : "animate-pulse"
                  }`}
                />
                <div
                  className={`absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl ${
                    animationStyle === "bouncy"
                      ? "animate-bounce delay-1000"
                      : "animate-pulse delay-1000"
                  }`}
                />
              </div>
            )}

            <div
              className={`container mx-auto px-4 py-12 sm:py-16 md:py-20 relative z-10 ${
                heroLayout === "split"
                  ? "grid md:grid-cols-2 gap-12 items-center text-left"
                  : heroLayout === "offset"
                  ? "max-w-6xl text-left pl-8"
                  : heroLayout === "minimal"
                  ? "max-w-4xl"
                  : "text-center"
              } space-y-8`}
            >
              <div
                className={cn(
                  "space-y-6",
                  heroLayout === "split" || heroLayout === "offset"
                    ? "text-left"
                    : "text-center"
                )}
              >
                {content.badge && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20 animate-fade-in">
                    {renderContent(content.badge)}
                  </div>
                )}

                {content.title && (
                  <h1
                    className={cn(
                      "text-4xl md:text-5xl font-bold leading-tight animate-fade-in",
                      heroLayout === "split" ? "md:text-5xl" : "md:text-6xl"
                    )}
                  >
                    {renderContent(content.title)}
                  </h1>
                )}

                {content.subtitle && (
                  <p className="text-lg md:text-xl text-muted-foreground animate-fade-in-delay-1">
                    {renderContent(content.subtitle)}
                  </p>
                )}

                {content.description && (
                  <p className="text-base md:text-lg leading-relaxed text-muted-foreground/90 animate-fade-in-delay-2 max-w-2xl mx-auto md:mx-0">
                    {renderContent(content.description)}
                  </p>
                )}

                <div
                  className={cn(
                    "flex gap-4",
                    heroLayout === "split" || heroLayout === "offset"
                      ? "justify-start"
                      : "justify-center"
                  )}
                >
                  {content.primaryCTA && (
                    <Button size="lg" asChild className="animate-fade-in">
                      <Link href="#contact">
                        {renderContent(content.primaryCTA)}
                      </Link>
                    </Button>
                  )}
                  {content.secondaryCTA && (
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="animate-fade-in-delay-1"
                    >
                      <Link href="#storefront">
                        {renderContent(content.secondaryCTA)}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="relative">
                {hasBackgroundImage ? (
                  <div className="relative aspect-square md:aspect-4/3 overflow-hidden rounded-3xl shadow-2xl border border-white/10">
                    <Image
                      src={heroImageSrc!}
                      alt="Hero Visual"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-40 sm:h-48 md:h-56 rounded-2xl bg-linear-to-br from-primary/30 via-primary/10 to-transparent animate-fade-in" />
                    <div className="h-40 sm:h-48 md:h-56 rounded-2xl bg-linear-to-br from-accent/30 via-accent/10 to-transparent animate-fade-in-delay-1" />
                    <div className="h-40 sm:h-48 md:h-56 rounded-2xl bg-linear-to-br from-secondary/30 via-secondary/10 to-transparent animate-fade-in-delay-2" />
                    <div className="h-40 sm:h-48 md:h-56 rounded-2xl bg-linear-to-br from-muted/60 via-muted/20 to-transparent animate-fade-in-delay-3" />
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }

      case "stats":
        return (
          <section
            key={section.id}
            className={`py-16 ${bgClass} ${textClass} border-y`}
          >
            <div className="container mx-auto px-4">
              {(content.heading || content.title) && (
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold animate-fade-in">
                    {renderContent(content.heading || content.title)}
                  </h2>
                  {content.description && (
                    <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                      {renderContent(content.description)}
                    </p>
                  )}
                </div>
              )}

              {/* Stats - Enhanced with icons and animations */}
              {Array.isArray(content.stats) && content.stats.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {(content.stats as Array<Record<string, unknown>>).map(
                    (stat, index) => (
                      <div
                        key={index}
                        className="text-center p-6 rounded-xl bg-linear-to-br from-background to-muted/30 stat-item hover:shadow-lg transition-all duration-300 hover:scale-105"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                          {stat.icon === "users" && (
                            <Users className="h-7 w-7 text-primary" />
                          )}
                          {stat.icon === "package" && (
                            <Package className="h-7 w-7 text-primary" />
                          )}
                          {stat.icon === "award" && (
                            <Award className="h-7 w-7 text-primary" />
                          )}
                          {stat.icon === "star" && (
                            <Star className="h-7 w-7 text-primary fill-primary" />
                          )}
                          {!stat.icon && (
                            <TrendingUp className="h-7 w-7 text-primary" />
                          )}
                        </div>
                        <div className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
                          {stat.value as string}
                        </div>
                        <div className="text-sm md:text-base opacity-70 font-medium">
                          {stat.label as string}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        );

      case "social-proof": {
        const isBlackFridayTheme = themeId === "black-friday-mega-sale";

        // Healthcare Precision Care: 3D vertical marquee
        if (themeId === "healthcare-precision-care") {
          const list =
            testimonials && testimonials.length > 0
              ? testimonials
              : Array.isArray(content.testimonials) &&
                content.testimonials.length > 0
              ? (content.testimonials as Array<Record<string, unknown>>).map(
                  (t, idx) => ({
                    id: `static-${idx}`,
                    customerName:
                      typeof t.name === "string" ? t.name : "Patient",
                    customerTitle: typeof t.role === "string" ? t.role : "",
                    testimonial:
                      typeof t.comment === "string"
                        ? t.comment
                        : typeof t.testimonial === "string"
                        ? t.testimonial
                        : "",
                    customerPhoto: typeof t.photo === "string" ? t.photo : null,
                    rating: typeof t.rating === "number" ? t.rating : 5,
                  })
                )
              : [];

          const padded =
            list.length >= 4
              ? list
              : [...list, ...list, ...list].slice(0, Math.max(4, list.length));

          const firstRow = padded.slice(0, Math.ceil(padded.length / 2));
          const secondRow = padded.slice(Math.ceil(padded.length / 2));
          const thirdRow = firstRow;
          const fourthRow = secondRow;

          const ReviewCard = ({
            img,
            name,
            title,
            body,
          }: {
            img: string;
            name: string;
            title?: string | null;
            body: string;
          }) => (
            <figure
              className={cn(
                "relative h-full w-fit cursor-pointer overflow-hidden rounded-xl border p-4 sm:w-36",
                "border-gray-950/10 bg-gray-950/1 hover:bg-gray-950/5",
                "dark:border-gray-50/10 dark:bg-gray-50/10 dark:hover:bg-gray-50/15"
              )}
            >
              <div className="flex flex-row items-center gap-2">
                <Image
                  className="rounded-full"
                  width={32}
                  height={32}
                  alt={name}
                  src={
                    img ||
                    `https://avatar.vercel.sh/${encodeURIComponent(
                      name || "patient"
                    )}`
                  }
                  style={{ objectFit: "cover" }}
                  sizes="32px"
                />
                <div className="flex flex-col">
                  <figcaption className="text-sm font-medium dark:text-white">
                    {name}
                  </figcaption>
                  {title && (
                    <p className="text-xs font-medium dark:text-white/40">
                      {title}
                    </p>
                  )}
                </div>
              </div>
              <blockquote className="mt-2 text-sm">{body}</blockquote>
            </figure>
          );

          const renderRow = (row: typeof padded) =>
            row.map((review, idx) => (
              <ReviewCard
                key={review.id ?? idx}
                img={
                  review.customerPhoto ||
                  `https://avatar.vercel.sh/${encodeURIComponent(
                    review.customerName || "patient"
                  )}`
                }
                name={review.customerName || "Patient"}
                title={review.customerTitle}
                body={review.testimonial}
              />
            ));

          return (
            <section
              key={section.id}
              className={`py-20 ${bgClass} ${textClass}`}
            >
              <div className="container mx-auto px-4 mb-10 text-center">
                {content.heading && (
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    {renderContent(content.heading)}
                  </h2>
                )}
                {content.description && (
                  <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto">
                    {renderContent(content.description)}
                  </p>
                )}
              </div>

              <div className="relative flex h-96 w-full flex-row items-center justify-center gap-4 overflow-hidden perspective-near">
                <div
                  className="flex flex-row items-center gap-4"
                  style={{
                    transform:
                      "translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)",
                  }}
                >
                  <Marquee pauseOnHover vertical className="[--duration:20s]">
                    {renderRow(firstRow)}
                  </Marquee>
                  <Marquee
                    reverse
                    pauseOnHover
                    vertical
                    className="[--duration:20s]"
                  >
                    {renderRow(secondRow)}
                  </Marquee>
                  <Marquee
                    reverse
                    pauseOnHover
                    vertical
                    className="[--duration:20s]"
                  >
                    {renderRow(thirdRow)}
                  </Marquee>
                  <Marquee pauseOnHover vertical className="[--duration:20s]">
                    {renderRow(fourthRow)}
                  </Marquee>
                </div>

                <div className="from-background pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-linear-to-b" />
                <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t" />
                <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r" />
                <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l" />
              </div>

              <div className="mt-12 text-center">
                <TestimonialForm slug={slug} />
              </div>
            </section>
          );
        }

        // Black Friday marquee
        if (isBlackFridayTheme && testimonials && testimonials.length > 0) {
          const firstRow = testimonials.slice(
            0,
            Math.ceil(testimonials.length / 2)
          );
          const secondRow = testimonials.slice(
            Math.ceil(testimonials.length / 2)
          );

          return (
            <section
              key={section.id}
              className={`py-20 ${bgClass} ${textClass}`}
            >
              <div className="container mx-auto px-4 mb-12 text-center">
                {content.heading && (
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    {renderContent(content.heading)}
                  </h2>
                )}
                {content.description && (
                  <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto">
                    {renderContent(content.description)}
                  </p>
                )}
              </div>
              <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
                <Marquee pauseOnHover className="[--duration:22s]">
                  {firstRow.map((testimonial, idx) => (
                    <figure
                      key={testimonial.id ?? idx}
                      className={cn(
                        "relative h-full w-72 min-w-[18rem] mx-2 cursor-pointer overflow-hidden rounded-xl border p-4",
                        "border-gray-950/8 bg-card hover:bg-accent/40",
                        "dark:border-white/10"
                      )}
                    >
                      <div className="flex flex-row items-center gap-3">
                        <Image
                          className="rounded-full"
                          alt={testimonial.customerName}
                          src={
                            testimonial.customerPhoto ||
                            `https://avatar.vercel.sh/${encodeURIComponent(
                              testimonial.customerName || "customer"
                            )}`
                          }
                          width={40}
                          height={40}
                          style={{ objectFit: "cover" }}
                          sizes="40px"
                        />
                        <div className="flex flex-col">
                          <figcaption className="text-sm font-semibold">
                            {testimonial.customerName}
                          </figcaption>
                          {testimonial.customerTitle && (
                            <p className="text-xs opacity-70">
                              {testimonial.customerTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <blockquote className="mt-3 text-sm leading-relaxed">
                        {testimonial.testimonial}
                      </blockquote>
                      <div className="flex items-center gap-1 mt-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (testimonial.rating ?? 5)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </figure>
                  ))}
                </Marquee>
                <Marquee reverse pauseOnHover className="[--duration:22s]">
                  {secondRow.map((testimonial, idx) => (
                    <figure
                      key={testimonial.id ?? idx}
                      className={cn(
                        "relative h-full w-72 min-w-[18rem] mx-2 cursor-pointer overflow-hidden rounded-xl border p-4",
                        "border-gray-950/8 bg-card hover:bg-accent/40",
                        "dark:border-white/10"
                      )}
                    >
                      <div className="flex flex-row items-center gap-3">
                        <Image
                          className="rounded-full h-10 w-10 object-cover"
                          alt={testimonial.customerName}
                          src={
                            testimonial.customerPhoto ||
                            `https://avatar.vercel.sh/${encodeURIComponent(
                              testimonial.customerName || "customer"
                            )}`
                          }
                          width={40}
                          height={40}
                          style={{ objectFit: "cover" }}
                          sizes="40px"
                        />
                        <div className="flex flex-col">
                          <figcaption className="text-sm font-semibold">
                            {testimonial.customerName}
                          </figcaption>
                          {testimonial.customerTitle && (
                            <p className="text-xs opacity-70">
                              {testimonial.customerTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <blockquote className="mt-3 text-sm leading-relaxed">
                        {testimonial.testimonial}
                      </blockquote>
                      <div className="flex items-center gap-1 mt-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < (testimonial.rating ?? 5)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </figure>
                  ))}
                </Marquee>
                <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r" />
                <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l" />
              </div>
              <div className="mt-12 text-center">
                <TestimonialForm slug={slug} />
              </div>
            </section>
          );
        }

        // Default marquee / fallback
        return (
          <section key={section.id} className={`py-20 ${bgClass} ${textClass}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                {content.heading && (
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    {renderContent(content.heading)}
                  </h2>
                )}
                {content.description && (
                  <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto">
                    {renderContent(content.description)}
                  </p>
                )}
              </div>

              {/* Real testimonials */}
              {testimonials && testimonials.length > 0
                ? (() => {
                    const midpoint = Math.ceil(testimonials.length / 2);
                    const firstRow = testimonials.slice(0, midpoint);
                    const secondRow = testimonials.slice(midpoint);

                    const renderCard = (
                      item: (typeof testimonials)[number],
                      idx: number
                    ) => {
                      const rating = item.rating ?? 5;
                      return (
                        <figure
                          key={item.id ?? idx}
                          className={cn(
                            "relative h-full w-72 min-w-[18rem] mx-2 cursor-pointer overflow-hidden rounded-xl border p-4",
                            "border-gray-950/8 bg-card hover:bg-accent/40",
                            "dark:border-white/10"
                          )}
                        >
                          <div className="flex flex-row items-center gap-3">
                            <Image
                              className="rounded-full h-10 w-10 object-cover"
                              alt={item.customerName}
                              src={
                                item.customerPhoto ||
                                `https://avatar.vercel.sh/${encodeURIComponent(
                                  item.customerName || "customer"
                                )}`
                              }
                              width={40}
                              height={40}
                              style={{ objectFit: "cover" }}
                              sizes="40px"
                            />
                            <div className="flex flex-col">
                              <figcaption className="text-sm font-semibold">
                                {item.customerName}
                              </figcaption>
                              {item.customerTitle && (
                                <p className="text-xs opacity-70">
                                  {item.customerTitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <blockquote className="mt-3 text-sm leading-relaxed">
                            {item.testimonial}
                          </blockquote>
                          <div className="flex items-center gap-1 mt-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </figure>
                      );
                    };

                    return (
                      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
                        <Marquee
                          pauseOnHover
                          repeat={6}
                          className="[--duration:22s]"
                        >
                          {firstRow.map(renderCard)}
                        </Marquee>
                        {secondRow.length > 0 && (
                          <Marquee
                            reverse
                            pauseOnHover
                            repeat={6}
                            className="[--duration:24s]"
                          >
                            {secondRow.map(renderCard)}
                          </Marquee>
                        )}
                        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r" />
                        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-linear-to-l" />
                      </div>
                    );
                  })()
                : // Fallback to static testimonials
                  Array.isArray(content.testimonials) &&
                  content.testimonials.length > 0 &&
                  (() => {
                    const list = content.testimonials as Array<
                      Record<string, unknown>
                    >;
                    const midpoint = Math.ceil(list.length / 2);
                    const firstRow = list.slice(0, midpoint);
                    const secondRow = list.slice(midpoint);

                    const renderStaticCard = (
                      item: Record<string, unknown>,
                      idx: number
                    ) => {
                      const name =
                        typeof item.name === "string" ? item.name : "Customer";
                      const role =
                        typeof item.role === "string" ? item.role : "";
                      const company =
                        typeof item.company === "string" ? item.company : "";
                      const comment =
                        typeof item.comment === "string"
                          ? item.comment
                          : typeof item.testimonial === "string"
                          ? item.testimonial
                          : "";
                      const rating =
                        typeof item.rating === "number" ? item.rating : 5;

                      return (
                        <figure
                          key={idx}
                          className={cn(
                            "relative h-full w-72 min-w-[18rem] mx-2 cursor-pointer overflow-hidden rounded-xl border p-4",
                            "border-gray-950/8 bg-card hover:bg-accent/40",
                            "dark:border-white/10"
                          )}
                        >
                          <div className="flex flex-row items-center gap-3">
                            <Image
                              className="rounded-full h-10 w-10 object-cover"
                              alt={name}
                              src={`https://avatar.vercel.sh/${encodeURIComponent(
                                name || "customer"
                              )}`}
                              width={40}
                              height={40}
                              style={{ objectFit: "cover" }}
                              sizes="40px"
                            />
                            <div className="flex flex-col">
                              <figcaption className="text-sm font-semibold">
                                {name}
                              </figcaption>
                              {(role || company) && (
                                <p className="text-xs opacity-70">
                                  {[role, company].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <blockquote className="mt-3 text-sm leading-relaxed">
                            {comment}
                          </blockquote>
                          <div className="flex items-center gap-1 mt-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </figure>
                      );
                    };

                    return (
                      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
                        <Marquee
                          pauseOnHover
                          repeat={6}
                          className="[--duration:22s]"
                        >
                          {firstRow.map(renderStaticCard)}
                        </Marquee>
                        {secondRow.length > 0 && (
                          <Marquee
                            reverse
                            pauseOnHover
                            repeat={6}
                            className="[--duration:24s]"
                          >
                            {secondRow.map(renderStaticCard)}
                          </Marquee>
                        )}
                        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-linear-to-r" />
                        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-linear-to-l" />
                      </div>
                    );
                  })()}

              <div className="mt-12 text-center">
                <TestimonialForm slug={slug} />
                <p className="text-xs text-muted-foreground mt-3">
                  Your testimonial will be reviewed before publishing
                </p>
              </div>
            </div>
          </section>
        );
      }

      case "video-section": {
        const videoUrl = renderContent(content.videoUrl);
        if (!videoUrl) return null;

        return (
          <section key={section.id} className={`py-16 ${bgClass} ${textClass}`}>
            <div className="container mx-auto px-4">
              {(content.title || content.heading) && (
                <div className="text-center mb-6">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    {renderContent(content.title || content.heading)}
                  </h2>
                </div>
              )}
              {content.description && (
                <p className="text-base md:text-lg opacity-80 max-w-2xl mx-auto text-center mb-8">
                  {renderContent(content.description)}
                </p>
              )}

              <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-black shadow-lg">
                <iframe
                  src={videoUrl}
                  title={
                    renderContent(content.title || content.heading) ||
                    "Storefront video"
                  }
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        );
      }

      case "gallery": {
        const layout = (content.layout as string) || "grid";

        const productItems =
          featuredProducts?.length > 0
            ? featuredProducts
                .filter((p) => p.images && p.images[0]?.url)
                .map((p) => ({
                  id: p.id,
                  name: p.name,
                  imageUrl: p.images[0]!.url,
                }))
            : [];

        const serviceItems =
          featuredServices?.length > 0
            ? featuredServices
                .filter((s) => s.images && s.images[0]?.url)
                .map((s) => ({
                  id: s.id,
                  name: s.name,
                  imageUrl: s.images[0]!.url,
                }))
            : [];

        const items =
          productItems.length > 0
            ? productItems
            : serviceItems.length > 0
            ? serviceItems
            : [];

        if (items.length === 0) return null;

        const baseGrid =
          "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
        const gridClass = layout === "masonry" ? `${baseGrid}` : `${baseGrid}`;

        return (
          <section key={section.id} className={`py-16 ${bgClass} ${textClass}`}>
            <div className="container mx-auto px-4">
              {(content.title || content.heading) && (
                <div className="text-center mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    {renderContent(content.title || content.heading)}
                  </h2>
                  {content.subtitle && (
                    <p className="mt-3 text-base md:text-lg opacity-80 max-w-2xl mx-auto">
                      {renderContent(content.subtitle)}
                    </p>
                  )}
                </div>
              )}

              <div className={gridClass}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-xl border border-border bg-muted/40"
                  >
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    {content.showCaptions && (
                      <div className="px-4 py-3 text-sm font-medium">
                        {item.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "featured-products":
        if (featuredProducts.length === 0) return null;
        // Provide a friendly fallback heading/subheading if none set in content
        const featuredProductsHeading =
          content.heading && renderContent(content.heading)
            ? renderContent(content.heading)
            : "Featured Products";
        const featuredProductsSubheading =
          content.description && renderContent(content.description)
            ? renderContent(content.description)
            : "Handpicked items curated for your storefront.";

        return (
          <section key={section.id} className={`py-16 ${bgClass} ${textClass}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">
                  {featuredProductsHeading}
                </h2>
                <p className="text-lg opacity-80 max-w-2xl mx-auto">
                  {featuredProductsSubheading}
                </p>
              </div>
              <ThemeProductLayout
                products={featuredProducts}
                themeId={themeId}
              />
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" asChild>
                  <Link href={`/store/${slug}/products`}>
                    View All Products
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        );

      case "featured-services":
        if (featuredServices.length === 0) return null;
        const isBlackFriday = themeId === "black-friday-mega-sale";
        return (
          <section key={section.id} className={`py-16 ${bgClass} ${textClass}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                {content.heading && (
                  <h2 className="text-4xl font-bold mb-4">
                    {renderContent(content.heading)}
                  </h2>
                )}
                {content.description && (
                  <p className="text-lg opacity-80 max-w-2xl mx-auto">
                    {renderContent(content.description)}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredServices.slice(0, 3).map((service) => (
                  <Card
                    key={service.id}
                    className={`overflow-hidden ${
                      isBlackFriday ? "relative border border-red-500" : ""
                    }`}
                  >
                    {isBlackFriday && (
                      <BorderBeam
                        size={250}
                        duration={12}
                        delay={9}
                        colorFrom="#3B82F6"
                        colorTo="#EF4444"
                        borderWidth={1}
                      />
                    )}
                    {service.images && service.images[0]?.url && (
                      <div className="relative aspect-square overflow-hidden bg-muted">
                        <Image
                          src={service.images[0].url}
                          alt={service.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="line-clamp-1">
                          {service.name}
                        </CardTitle>
                        {service.isFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ${Number(service.price).toFixed(2)}
                      </p>
                      {service.duration && (
                        <p className="text-sm opacity-70 mt-2">
                          Duration: {service.duration} mins
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant="outline">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Book Service
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" asChild>
                  <Link href={`/store/${slug}/services`}>
                    View All Services
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        );

      case "team":
        if (featuredTeamMembers.length === 0) return null;
        return (
          <section key={section.id} className={`py-24 ${bgClass}`}>
            <div className="container max-w-7xl mx-auto px-4">
              {/* Section Header */}
              <div className="flex flex-wrap justify-center text-center mb-24">
                <div className="w-full lg:w-6/12 px-4">
                  {content.heading && (
                    <h1 className="text-gray-900 dark:text-gray-100 text-4xl font-bold mb-8">
                      {renderContent(content.heading)}
                    </h1>
                  )}
                  {content.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-lg font-light">
                      {renderContent(content.description)}
                    </p>
                  )}
                </div>
              </div>

              {/* Team Members Grid */}
              <div className="flex flex-wrap justify-center">
                {featuredTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="w-full md:w-6/12 lg:w-3/12 mb-12 px-6 sm:px-6 lg:px-4"
                  >
                    <div className="flex flex-col">
                      {/* Avatar */}
                      <div className="mx-auto w-full max-w-[400px]">
                        {member.image ? (
                          <Image
                            src={
                              getProxiedImageUrl(member.image) || member.image
                            }
                            alt={member.name}
                            width={400}
                            height={400}
                            className="w-full h-auto aspect-square rounded-2xl drop-shadow-md hover:drop-shadow-xl transition-all duration-200 delay-100 object-cover"
                            style={{ objectFit: "cover" }}
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded-2xl drop-shadow-md hover:drop-shadow-xl transition-all duration-200 delay-100 bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                            <Users className="h-24 w-24 text-gray-400 dark:text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="text-center mt-6">
                        {/* Name */}
                        <h1 className="text-gray-900 dark:text-gray-100 text-xl font-bold mb-1">
                          {member.name}
                        </h1>

                        {/* Title & Role */}
                        <div className="text-gray-700 dark:text-gray-300 font-light mb-2">
                          {member.jobTitle
                            ? member.jobTitle.replace(/_/g, " ")
                            : member.role}
                        </div>

                        {/* Bio */}
                        {member.bio && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-4 px-2 line-clamp-3">
                            {member.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "about":
        return (
          <section key={section.id} className={`py-16 ${bgClass} ${textClass}`}>
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                {content.heading && (
                  <h2 className="text-4xl font-bold">
                    {renderContent(content.heading)}
                  </h2>
                )}
                {content.description && (
                  <p className="text-lg leading-relaxed">
                    {renderContent(content.description)}
                  </p>
                )}
              </div>
            </div>
          </section>
        );

      case "contact":
        // Privacy Mode: Only show sales/support emails (not general email)
        // Address is optional based on content.showAddressIfPublished
        const showOnlyPublicEmails =
          content.privacyMode === true || content.showOnlyPublicEmails === true;
        const showAddress =
          content.showAddressIfPublished === true && content.address;

        return (
          <section key={section.id} className={`py-16 ${bgClass} ${textClass}`}>
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center space-y-8">
                {(content.heading || content.title) && (
                  <h2 className="text-4xl font-bold">
                    {renderContent(content.heading || content.title)}
                  </h2>
                )}
                {content.description && (
                  <p className="text-lg opacity-80">
                    {renderContent(content.description)}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {/* Only show general email if privacy mode is OFF */}
                  {!showOnlyPublicEmails && content.email && (
                    <a
                      href={`mailto:${renderContent(content.email)}`}
                      className="flex flex-col items-center gap-2 p-6 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Mail className="h-8 w-8" />
                      <span className="font-medium">General Email</span>
                      <span className="text-sm opacity-80">
                        {renderContent(content.email)}
                      </span>
                    </a>
                  )}
                  {/* Always show sales email */}
                  {content.salesEmail && (
                    <a
                      href={`mailto:${renderContent(content.salesEmail)}`}
                      className="flex flex-col items-center gap-2 p-6 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Mail className="h-8 w-8" />
                      <span className="font-medium">Sales</span>
                      <span className="text-sm opacity-80">
                        {renderContent(content.salesEmail)}
                      </span>
                    </a>
                  )}
                  {/* Always show support email */}
                  {content.supportEmail && (
                    <a
                      href={`mailto:${renderContent(content.supportEmail)}`}
                      className="flex flex-col items-center gap-2 p-6 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Mail className="h-8 w-8" />
                      <span className="font-medium">Support</span>
                      <span className="text-sm opacity-80">
                        {renderContent(content.supportEmail)}
                      </span>
                    </a>
                  )}
                  {content.phone && (
                    <a
                      href={`tel:${renderContent(content.phone)}`}
                      className="flex flex-col items-center gap-2 p-6 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Phone className="h-8 w-8" />
                      <span className="font-medium">Phone</span>
                      <span className="text-sm opacity-80">
                        {renderContent(content.phone)}
                      </span>
                    </a>
                  )}
                  {/* Only show address if showAddressIfPublished is true */}
                  {showAddress && (
                    <div className="flex flex-col items-center gap-2 p-6 rounded-lg">
                      <MapPin className="h-8 w-8" />
                      <span className="font-medium">Address</span>
                      <span className="text-sm opacity-80 text-center">
                        {renderContent(content.address)}
                      </span>
                    </div>
                  )}
                  {/* Show hours if provided */}
                  {content.showHours && content.hours && (
                    <div className="flex flex-col items-center gap-2 p-6 rounded-lg">
                      <Phone className="h-8 w-8" />
                      <span className="font-medium">Hours</span>
                      <span className="text-sm opacity-80 text-center">
                        {renderContent(content.hours)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );

      case "footer":
        return (
          <footer
            key={section.id}
            className={`border-t py-12 ${bgClass} ${textClass}`}
          >
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">
                    {renderContent(content.companyName || companyName)}
                  </h3>
                  {content.description && (
                    <p className="text-sm opacity-80">
                      {renderContent(content.description)}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link
                      href={`/store/${slug}`}
                      className="block text-sm hover:underline"
                    >
                      Home
                    </Link>
                    <Link
                      href={`/store/${slug}/products`}
                      className="block text-sm hover:underline"
                    >
                      Products
                    </Link>
                    <Link
                      href={`/store/${slug}/services`}
                      className="block text-sm hover:underline"
                    >
                      Services
                    </Link>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4">Follow Us</h3>
                  <div className="flex gap-4">
                    {storeMetadata?.socialLinks && (
                      <>
                        {storeMetadata.socialLinks.facebook && (
                          <a
                            href={storeMetadata.socialLinks.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {storeMetadata.socialLinks.twitter && (
                          <a
                            href={storeMetadata.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {storeMetadata.socialLinks.instagram && (
                          <a
                            href={storeMetadata.socialLinks.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {storeMetadata.socialLinks.linkedin && (
                          <a
                            href={storeMetadata.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="border-t mt-8 pt-8 text-center text-sm opacity-70">
                <p>
                  © {new Date().getFullYear()}{" "}
                  {renderContent(content.companyName || companyName)}. All
                  rights reserved.
                </p>
              </div>
            </div>
          </footer>
        );

      default:
        return null;
    }
  };

  // Sort sections by desired priority, then by existing order to keep consistency
  const priority: Record<string, number> = {
    "promo-banner": 1,
    hero: 2,
    stats: 3,
    "featured-products": 4,
    "featured-services": 5,
    team: 6,
    "social-proof": 7,
    contact: 8,
    footer: 9,
  };

  const sortedSections = [...sections].sort((a, b) => {
    const pa = priority[a.type] ?? a.order ?? 50;
    const pb = priority[b.type] ?? b.order ?? 50;
    if (pa !== pb) return pa - pb;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  return <>{sortedSections.map((section) => renderSection(section))}</>;
}

export function ThemeRenderer(props: ThemeRendererProps) {
  const ThemeComponent = themeComponents[props.themeId];
  if (ThemeComponent) {
    return <ThemeComponent {...props} />;
  }
  return <BaseThemeRenderer {...props} />;
}
