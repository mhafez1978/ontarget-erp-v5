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
  Wrench,
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
} from "lucide-react";
import { ThemeSection } from "@/lib/storefront-themes";
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

interface ThemeRendererProps {
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

export function ThemeRenderer({
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

      case "hero":
        const heroLayout = (content.layout as string) || "centered";
        const animationStyle = (content.animationStyle as string) || "default";
        const isVeteransDay = themeId === "veterans-day-patriotic";

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
            {/* Banner Image (if available) */}
            {storeBanner && (
              <div className="absolute inset-0 z-0">
                <img
                  src={storeBanner}
                  alt="Store banner"
                  className="w-full h-full object-cover"
                />
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/40" />
              </div>
            )}

            {/* Meteors for Veterans Day theme - show on top of banner, hidden on mobile */}
            {isVeteransDay && (
              <div className="hidden md:block">
                <Meteors number={30} />
              </div>
            )}

            {/* Pattern overlay based on theme */}
            {styling?.pattern && !storeBanner && (
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                {styling.pattern === "diagonal-stripes" && (
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,currentColor_10px,currentColor_20px)]" />
                )}
                {styling.pattern === "grid-lines" && (
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
                )}
              </div>
            )}
            {/* Animated background elements (only show if no banner, hidden on mobile) */}
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
                className={
                  heroLayout === "split" || heroLayout === "offset"
                    ? "space-y-6"
                    : "space-y-8"
                }
              >
                {/* Title - support both 'heading' and 'title' */}
                {(content.heading || content.title) && (
                  <h1
                    className={`font-bold leading-tight text-white ${
                      heroLayout === "minimal"
                        ? "text-4xl md:text-6xl"
                        : heroLayout === "split"
                        ? "text-5xl md:text-6xl"
                        : "text-5xl md:text-7xl"
                    } ${
                      animationStyle === "tech" ? "font-mono" : ""
                    } animate-fade-in`}
                  >
                    {String(content.heading || content.title)}
                  </h1>
                )}
                {/* Subtitle - support both 'subheading' and 'subtitle' */}
                {(content.subheading || content.subtitle) && (
                  <h2
                    className={`font-medium opacity-90 text-white ${
                      heroLayout === "minimal"
                        ? "text-xl md:text-2xl"
                        : "text-2xl md:text-4xl"
                    } animate-fade-in-delay-1`}
                  >
                    {String(content.subheading || content.subtitle)}
                  </h2>
                )}
                {content.description && (
                  <p
                    className={`opacity-80 leading-relaxed text-white ${
                      heroLayout === "minimal"
                        ? "text-base md:text-lg max-w-2xl"
                        : heroLayout === "split"
                        ? "text-lg"
                        : "text-lg md:text-xl max-w-3xl mx-auto"
                    } animate-fade-in-delay-2`}
                  >
                    {String(content.description)}
                  </p>
                )}
                {/* Badges for promotions */}
                {content.badges && Array.isArray(content.badges) && (
                  <div
                    className={`flex flex-wrap gap-3 mt-6 ${
                      heroLayout === "centered" || heroLayout === "minimal"
                        ? "justify-center"
                        : ""
                    }`}
                  >
                    {(
                      content.badges as Array<{ text: string; color?: string }>
                    ).map((badge, index) => (
                      <Badge
                        key={index}
                        className={`text-base px-4 py-2 ${
                          animationStyle === "spooky"
                            ? "animate-pulse"
                            : animationStyle === "bouncy"
                            ? "animate-bounce"
                            : "animate-bounce"
                        }`}
                        variant="secondary"
                      >
                        {badge.text}
                      </Badge>
                    ))}
                  </div>
                )}
                {(content.primaryCTA || content.secondaryCTA) && (
                  <div
                    className={`flex flex-col sm:flex-row gap-4 mt-10 animate-fade-in-delay-3 ${
                      heroLayout === "centered" || heroLayout === "minimal"
                        ? "justify-center"
                        : ""
                    }`}
                  >
                    {content.primaryCTA && (
                      <Button
                        size="lg"
                        className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto sm:min-w-[200px]"
                        asChild
                      >
                        <Link href={`/store/${slug}/products`}>
                          <Package className="h-12 w-12 mr-2" />
                          {String(content.primaryCTA)}
                        </Link>
                      </Button>
                    )}
                    {content.secondaryCTA && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-lg px-10 py-5.5 backdrop-blur-sm border-2 hover:bg-white/10 transition-all hover:scale-105 w-full sm:w-auto sm:min-w-[200px]"
                        asChild
                      >
                        <Link href={`/store/${slug}/services`}>
                          <Wrench className="h-12 w-12 mr-2" />
                          {String(content.secondaryCTA)}
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Visual element for split layout */}
              {heroLayout === "split" && !storeBanner && (
                <div className="hidden md:block relative">
                  <div className="aspect-square rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-8 rotate-3 hover:rotate-0 transition-transform">
                    <div className="w-full h-full bg-linear-to-br from-white/20 to-transparent rounded-xl" />
                  </div>
                </div>
              )}

              {/* Scroll indicator */}
              {content.showScrollIndicator && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                  <div className="w-6 h-10 border-2 border-current rounded-full p-1">
                    <div className="w-1.5 h-3 bg-current rounded-full mx-auto animate-scroll-indicator" />
                  </div>
                </div>
              )}
            </div>
          </section>
        );

      case "stats":
        return (
          <section
            key={section.id}
            className={`py-16 ${bgClass} ${textClass} border-y`}
          >
            <div className="container mx-auto px-4">
              {content.title && (
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold animate-fade-in">
                    {renderContent(content.title)}
                  </h2>
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

      case "social-proof":
        const isBlackFridayTheme = themeId === "black-friday-mega-sale";

        // Black Friday: Use Marquee style
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
              <div className="container mx-auto px-4 mb-12">
                <div className="text-center">
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
              </div>

              <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
                <Marquee pauseOnHover className="[--duration:20s]">
                  {firstRow.map((testimonial) => (
                    <figure
                      key={testimonial.id}
                      className={cn(
                        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
                        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
                      )}
                    >
                      <div className="flex flex-row items-center gap-2">
                        {testimonial.customerPhoto ? (
                          <img
                            className="rounded-full"
                            width="32"
                            height="32"
                            alt=""
                            src={testimonial.customerPhoto}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {testimonial.customerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <figcaption className="text-sm font-medium dark:text-white">
                            {testimonial.customerName}
                          </figcaption>
                          {testimonial.customerTitle && (
                            <p className="text-xs font-medium dark:text-white/40">
                              {testimonial.customerTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <blockquote className="mt-2 text-sm">
                        {testimonial.testimonial}
                      </blockquote>
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < testimonial.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </figure>
                  ))}
                </Marquee>
                <Marquee reverse pauseOnHover className="[--duration:20s]">
                  {secondRow.map((testimonial) => (
                    <figure
                      key={testimonial.id}
                      className={cn(
                        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
                        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
                      )}
                    >
                      <div className="flex flex-row items-center gap-2">
                        {testimonial.customerPhoto ? (
                          <img
                            className="rounded-full"
                            width="32"
                            height="32"
                            alt=""
                            src={testimonial.customerPhoto}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm">
                            {testimonial.customerName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <figcaption className="text-sm font-medium dark:text-white">
                            {testimonial.customerName}
                          </figcaption>
                          {testimonial.customerTitle && (
                            <p className="text-xs font-medium dark:text-white/40">
                              {testimonial.customerTitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <blockquote className="mt-2 text-sm">
                        {testimonial.testimonial}
                      </blockquote>
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < testimonial.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </figure>
                  ))}
                </Marquee>
                <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r"></div>
                <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l"></div>
              </div>

              <div className="mt-12 text-center">
                <TestimonialForm slug={slug} />
              </div>
            </section>
          );
        }

        // Default testimonials display for other themes
        return (
          <section key={section.id} className={`py-20 ${bgClass} ${textClass}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                {content.heading && (
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                    {renderContent(content.heading)}
                  </h2>
                )}
                {content.description && (
                  <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto animate-fade-in-delay-1">
                    {renderContent(content.description)}
                  </p>
                )}
              </div>

              {/* Testimonials - Display real testimonials from database */}
              {testimonials && testimonials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {testimonials.map((testimonial, index) => (
                    <Card
                      key={testimonial.id}
                      className="card-hover border-2 animate-fade-in"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <CardHeader>
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1 mb-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < testimonial.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>

                        {/* Testimonial Quote */}
                        <CardDescription className="text-base leading-relaxed mb-4">
                          <span className="text-4xl text-primary/30 leading-none">
                            &ldquo;
                          </span>
                          <span className="text-foreground/90">
                            {testimonial.testimonial}
                          </span>
                          <span className="text-4xl text-primary/30 leading-none">
                            &rdquo;
                          </span>
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center gap-3">
                          {testimonial.customerPhoto ? (
                            <img
                              src={testimonial.customerPhoto}
                              alt={testimonial.customerName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                              {testimonial.customerName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-base">
                              {testimonial.customerName}
                            </div>
                            {testimonial.customerTitle && (
                              <div className="text-sm opacity-70">
                                {testimonial.customerTitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Fallback to theme static testimonials if no real ones
                Array.isArray(content.testimonials) &&
                content.testimonials.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(
                      content.testimonials as Array<Record<string, unknown>>
                    ).map((testimonial, index) => {
                      const name =
                        typeof testimonial.name === "string"
                          ? testimonial.name
                          : "";
                      const role =
                        typeof testimonial.role === "string"
                          ? testimonial.role
                          : "";
                      const company =
                        typeof testimonial.company === "string"
                          ? testimonial.company
                          : "";
                      const comment =
                        typeof testimonial.comment === "string"
                          ? testimonial.comment
                          : "";
                      const rating =
                        typeof testimonial.rating === "number"
                          ? testimonial.rating
                          : 5;

                      return (
                        <Card
                          key={index}
                          className="card-hover border-2 animate-fade-in"
                          style={{ animationDelay: `${index * 0.2}s` }}
                        >
                          <CardHeader>
                            {/* Rating Stars */}
                            <div className="flex items-center gap-1 mb-4">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Testimonial Quote */}
                            <CardDescription className="text-base leading-relaxed mb-4">
                              <span className="text-4xl text-primary/30 leading-none">
                                &ldquo;
                              </span>
                              <span className="text-foreground/90">
                                {comment}
                              </span>
                              <span className="text-4xl text-primary/30 leading-none">
                                &rdquo;
                              </span>
                            </CardDescription>
                          </CardHeader>

                          <CardContent>
                            <div className="flex items-center gap-3">
                              {name && (
                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                                  {name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                {name && (
                                  <div className="font-semibold text-base">
                                    {name}
                                  </div>
                                )}
                                {role && (
                                  <div className="text-sm opacity-70">
                                    {role}
                                  </div>
                                )}
                                {company && (
                                  <div className="text-xs opacity-60 mt-0.5">
                                    {company}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )
              )}

              {/* Leave Testimonial CTA - Prominent placement */}
              <div className="mt-16 text-center">
                <div className="inline-block relative">
                  {/* Decorative elements */}
                  <div className="absolute -inset-4 bg-linear-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-primary/20 shadow-xl">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-2">
                        Love What You See?
                      </h3>
                      <p className="text-muted-foreground">
                        Share your experience and help others discover us
                      </p>
                    </div>
                    <TestimonialForm slug={slug} />
                    <p className="text-xs text-muted-foreground mt-3">
                      Your testimonial will be reviewed before publishing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "featured-products":
        if (featuredProducts.length === 0) return null;
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
                          <img
                            src={
                              getProxiedImageUrl(member.image) || member.image
                            }
                            alt={member.name}
                            className="w-full h-auto aspect-square rounded-2xl drop-shadow-md hover:drop-shadow-xl transition-all duration-200 delay-100 object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded-2xl drop-shadow-md hover:drop-shadow-xl transition-all duration-200 delay-100 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
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

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return <>{sortedSections.map((section) => renderSection(section))}</>;
}
