"use client";

import Image from "next/image";
import Link from "next/link";
import { Marquee } from "@/components/ui/marquee";
import { TestimonialForm } from "@/components/storefront/testimonial-form";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  AiFrontstoreSpec,
  AiFrontstoreSection,
} from "@/lib/ai/ai-storefront-types";

interface FeaturedImage {
  url: string;
}

interface FeaturedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images?: FeaturedImage[];
}

interface FeaturedService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images?: FeaturedImage[];
}

interface FeaturedTeamMember {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
}

interface StorefrontTestimonial {
  id: string;
  customerName: string;
  testimonial: string;
}

interface AiStorefrontRendererProps {
  spec: AiFrontstoreSpec;
  slug: string;
  companyName: string;
  companyId?: string;
  enableCart?: boolean;
  featuredProducts?: FeaturedProduct[];
  featuredServices?: FeaturedService[];
  testimonials?: StorefrontTestimonial[];
  /** preview posts fetched from server (published posts) */
  posts?: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    heroImage?: string | null;
    publishedAt?: string | Date | null;
  }[];
  /** live total customers count from DB if available */
  customersCount?: number;
  /** live approved testimonials count from DB if available (used to populate the "Testimonials" stat) */
  approvedTestimonialsCount?: number;
  /** Admin-managed support articles that function as FAQs (title/summary/content) */
  supportFaqs?: {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
  }[];
  featuredTeamMembers?: FeaturedTeamMember[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  storeBanner?: string | null;
  heroOverride?: {
    title?: string;
    subtitle?: string;
    description?: string;
    primaryCTA?: string;
    secondaryCTA?: string;
  } | null;
}

function readContentString(
  content: Record<string, unknown>,
  key: string
): string | undefined {
  const value = content[key];
  return typeof value === "string" ? value : undefined;
}

function isHexColorDark(hex?: string | null): boolean {
  if (!hex || typeof hex !== "string") return false;
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return false;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
  // Standard perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

export function AiStorefrontRenderer({
  spec,
  slug,
  companyName,
  companyId,
  enableCart = true,
  featuredProducts,
  featuredServices,
  testimonials,
  posts,
  supportFaqs,
  featuredTeamMembers,
  contactEmail,
  contactPhone,
  storeBanner,
  heroOverride,
  customersCount,
  approvedTestimonialsCount,
}: AiStorefrontRendererProps) {
  const sortedSections = [...spec.sections].sort((a, b) => a.order - b.order);

  const companyIdentifier = companyId ?? slug;

  const cornerStyle = spec.meta.cornerStyle || "soft";
  const buttonRadiusClass =
    cornerStyle === "rounded"
      ? "rounded-full"
      : cornerStyle === "sharp"
      ? "rounded-none"
      : "rounded-md";

  const handleAddProductToCart = async (productId: string) => {
    if (!enableCart || !companyIdentifier) {
      toast.error("Online ordering is not available right now.");
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: companyIdentifier,
          productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to add product to cart");
      }

      toast.success("Product added to cart");
    } catch (error) {
      console.error("Error adding product to cart:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add to cart"
      );
    }
  };

  const handleAddServiceToCart = async (serviceId: string) => {
    if (!enableCart || !companyIdentifier) {
      toast.error("Online ordering is not available right now.");
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: companyIdentifier,
          serviceId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to add service to cart");
      }

      toast.success("Service added to cart");
    } catch (error) {
      console.error("Error adding service to cart:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add to cart"
      );
    }
  };

  const mapAnimationsToClass = (animations?: string[] | unknown) => {
    if (!Array.isArray(animations)) return "";
    const cls: string[] = [];
    for (const a of animations) {
      if (typeof a !== "string") continue;
      const token = a.toLowerCase();
      if (token.includes("fade") || token.includes("fade-up"))
        cls.push("animate-fade-in");
      else if (
        token.includes("slide-right") ||
        token.includes("slide-in-right")
      )
        cls.push("animate-slide-in-right");
      else if (token.includes("slide") || token.includes("slide-in"))
        cls.push("animate-slide-in-left");
      else if (token.includes("scale")) cls.push("animate-scale-in");
      else if (token.includes("parallax")) cls.push("bg-fixed");
    }
    return cls.join(" ");
  };

  const renderSection = (section: AiFrontstoreSection) => {
    const { type, content } = section;
    const contentRecord = content as Record<string, unknown>;

    switch (type) {
      case "hero": {
        const title =
          heroOverride?.title ??
          readContentString(contentRecord, "title") ??
          companyName;
        const subtitle =
          heroOverride?.subtitle ??
          readContentString(contentRecord, "subtitle") ??
          "";
        const description =
          heroOverride?.description ??
          readContentString(contentRecord, "description") ??
          "";
        const primaryCTA =
          heroOverride?.primaryCTA ??
          readContentString(contentRecord, "primaryCTA") ??
          "Shop now";
        const secondaryCTA =
          heroOverride?.secondaryCTA ??
          readContentString(contentRecord, "secondaryCTA") ??
          "";

        const heroLayoutStyle = spec.meta.layoutStyle;
        const isCentered =
          heroLayoutStyle === "magazine" || heroLayoutStyle === "one-page";
        const isRightAligned = heroLayoutStyle === "hero-split";

        const primaryColor = spec.meta.primaryColor;
        const backgroundColor = spec.meta.backgroundColor;
        const textColor = spec.meta.textColor;
        const accentColor = spec.meta.accentColor;

        const primaryButtonTextColor = isHexColorDark(primaryColor)
          ? "#ffffff"
          : "#111827";
        const secondaryButtonTextColor = isHexColorDark(
          accentColor || primaryColor
        )
          ? "#ffffff"
          : "#111827";

        const heroSize = spec.meta.heroSize || "compact";
        const heroSectionClasses =
          heroSize === "full"
            ? "relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-background py-16 min-h-[80vh] flex items-center"
            : "relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-background py-16";

        const sectionStyling = section.styling as
          | {
              backgroundImage?: { url?: string; alt?: string } | null;
              overlayColor?: string | null;
              overlayOpacity?: number | null;
              animations?: unknown;
            }
          | undefined;
        const heroBgUrl =
          sectionStyling?.backgroundImage?.url ||
          spec.meta.backgroundImage?.url ||
          storeBanner;
        const heroBgAlt =
          sectionStyling?.backgroundImage?.alt ||
          spec.meta.backgroundImage?.alt ||
          `${companyName} hero background`;
        const heroOverlayColor =
          sectionStyling?.overlayColor ?? spec.meta.overlayColor;
        const heroOverlayOpacity =
          typeof sectionStyling?.overlayOpacity === "number"
            ? sectionStyling.overlayOpacity
            : spec.meta.overlayOpacity;
        const heroAnimationClass = mapAnimationsToClass(
          sectionStyling?.animations ?? spec.meta.animations
        );

        return (
          <section
            key={section.id}
            className={heroSectionClasses}
            style={{
              backgroundColor: backgroundColor || undefined,
            }}
          >
            {heroBgUrl && (
              <div
                className={`absolute inset-0 -z-10 ${
                  heroAnimationClass ? heroAnimationClass + " " : ""
                }`}
              >
                <Image
                  src={heroBgUrl}
                  alt={heroBgAlt}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            )}
            {heroOverlayColor && typeof heroOverlayOpacity === "number" && (
              <div
                aria-hidden
                className="absolute inset-0 -z-5"
                style={{
                  background: heroOverlayColor,
                  opacity: heroOverlayOpacity,
                }}
              />
            )}
            <div className="relative container mx-auto px-4">
              <div
                className={
                  (isCentered
                    ? "max-w-3xl mx-auto text-center space-y-4"
                    : "grid gap-8 md:grid-cols-2 items-center") +
                  (heroAnimationClass ? ` ${heroAnimationClass}` : "")
                }
              >
                <div
                  className={
                    isCentered
                      ? ""
                      : isRightAligned
                      ? "space-y-4 md:col-start-2 md:text-right"
                      : "space-y-4"
                  }
                >
                  <h1
                    className="text-4xl md:text-5xl font-extrabold"
                    style={{ color: textColor || undefined }}
                  >
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-lg font-semibold text-muted-foreground">
                      {subtitle}
                    </p>
                  )}
                  {description && (
                    <p
                      className="text-base text-muted-foreground"
                      style={{ color: textColor || undefined }}
                    >
                      {description}
                    </p>
                  )}
                  <div
                    className={
                      "mt-4 flex flex-wrap gap-3" +
                      (isCentered ? " justify-center" : "")
                    }
                  >
                    <a
                      href={
                        readContentString(contentRecord, "primaryHref") ??
                        `#products`
                      }
                      className={`inline-flex items-center ${buttonRadiusClass} bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90`}
                      style={{
                        backgroundColor: primaryColor || undefined,
                        color: primaryButtonTextColor,
                      }}
                    >
                      {primaryCTA}
                    </a>
                    {secondaryCTA && (
                      <a
                        href={
                          readContentString(contentRecord, "secondaryHref") ??
                          `#contact`
                        }
                        className={`inline-flex items-center ${buttonRadiusClass} border border-input px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent`}
                        style={{
                          borderColor: primaryColor || undefined,
                          color: secondaryButtonTextColor,
                          backgroundColor: accentColor || undefined,
                        }}
                      >
                        {secondaryCTA}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "stats": {
        const heading =
          readContentString(contentRecord, "heading") ??
          readContentString(contentRecord, "title") ??
          "By the numbers";
        const subheading =
          readContentString(contentRecord, "subheading") ??
          readContentString(contentRecord, "description") ??
          "";

        const rawItems = (contentRecord["items"] ??
          contentRecord["stats"]) as unknown;

        let items =
          Array.isArray(rawItems) && rawItems.length > 0
            ? (rawItems
                .map((item) => {
                  if (!item || typeof item !== "object") return null;
                  const record = item as Record<string, unknown>;
                  const label =
                    typeof record.label === "string" ? record.label : "";
                  const valueRaw = record.value;
                  const value =
                    typeof valueRaw === "number"
                      ? valueRaw.toString()
                      : typeof valueRaw === "string"
                      ? valueRaw
                      : "";
                  const icon =
                    typeof record.icon === "string" ? record.icon : undefined;
                  if (!label && !value) return null;
                  return { label, value, icon };
                })
                .filter(Boolean) as {
                label: string;
                value: string;
                icon?: string;
              }[])
            : null;

        // If DB counts are provided we prefer using them for authoritative values
        // Update or insert Customers/Testimonials accordingly
        const ensureItem = (labelName: string, value?: string | number) => {
          if (!value && value !== 0) return;
          const strVal = typeof value === "number" ? String(value) : value;
          const idx = items?.findIndex((it) =>
            it.label.toLowerCase().includes(labelName.toLowerCase())
          );
          if (idx !== undefined && idx !== null && items && idx >= 0) {
            items[idx] = { ...items[idx], value: strVal };
          } else if (items) {
            items.push({ label: labelName, value: strVal });
          }
        };

        // Ensure items is an array so we can append/override values from DB
        items = items || [];

        // If the AI didn't supply any items but we have at least some counts
        // derived from the page props (featuredProducts/services/testimonials) or DB,
        // populate a sensible default set so the section still renders.
        if (items.length === 0) {
          // Use preview arrays length as a hint (may be limited) and let DB counts
          // override below where provided.
          if (Array.isArray(featuredProducts) && featuredProducts.length > 0) {
            items.push({
              label: "Products",
              value: String(featuredProducts.length),
            });
          }
          if (Array.isArray(featuredServices) && featuredServices.length > 0) {
            items.push({
              label: "Services",
              value: String(featuredServices.length),
            });
          }
          if (Array.isArray(testimonials) && testimonials.length > 0) {
            items.push({
              label: "Testimonials",
              value: String(testimonials.length),
            });
          }
        }

        if (items && items.length >= 0) {
          if (typeof customersCount === "number" && customersCount >= 0) {
            ensureItem("Customers", customersCount.toLocaleString());
          }
          if (
            typeof approvedTestimonialsCount === "number" &&
            approvedTestimonialsCount >= 0
          ) {
            // If there are 0 approved testimonials, treat the starting state as 5
            // for the storefront 'By the numbers' display so new stores look populated.
            const displayValue =
              approvedTestimonialsCount === 0 ? 5 : approvedTestimonialsCount;
            ensureItem("Testimonials", displayValue.toLocaleString());
            // Ensure Customers item exists (even when customersCount isn't provided)
            const hasCustomers = items.some((it) => /customer/i.test(it.label));
            if (!hasCustomers) {
              // Use DB count when available, otherwise default to 0
              const val =
                typeof customersCount === "number" ? customersCount : 0;
              items.push({ label: "Customers", value: String(val) });
            }
          }

          // Ensure Testimonials exists — show default 5 when none
          const hasTestimonialItem = items.some((it) =>
            /testimonial/i.test(it.label)
          );
          if (!hasTestimonialItem) {
            const val =
              typeof approvedTestimonialsCount === "number"
                ? approvedTestimonialsCount === 0
                  ? 5
                  : approvedTestimonialsCount
                : 5;
            items.push({ label: "Testimonials", value: String(val) });
          }
        }

        if (!items || items.length === 0) {
          // If there are no stats items, don't render the section
          return null;
        }

        const primaryColor = spec.meta.primaryColor;
        const accentColor = spec.meta.accentColor || spec.meta.secondaryColor;

        return (
          <section key={section.id} className="py-12 border-t bg-background">
            <div className="container mx-auto px-4">
              {(heading || subheading) && (
                <div className="mb-8 text-center">
                  {heading && <h2 className="text-3xl font-bold">{heading}</h2>}
                  {subheading && (
                    <p className="mt-2 text-muted-foreground">{subheading}</p>
                  )}
                </div>
              )}
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 max-w-4xl mx-auto">
                {items.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="rounded-lg border bg-card px-4 py-5 text-center shadow-sm"
                    style={{
                      borderColor: accentColor || primaryColor || undefined,
                    }}
                  >
                    <div
                      className="text-3xl font-extrabold"
                      style={{ color: primaryColor || undefined }}
                    >
                      {/^\d+$/.test(item.value)
                        ? Number(item.value).toLocaleString()
                        : item.value}
                    </div>
                    <div className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "product-grid":
        return (
          <section
            key={section.id}
            id="products"
            className="py-12 border-t bg-background"
          >
            <div className="container mx-auto px-4">
              {readContentString(contentRecord, "heading") && (
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold">
                    {readContentString(contentRecord, "heading")}
                  </h2>
                  {readContentString(contentRecord, "subheading") && (
                    <p className="mt-2 text-muted-foreground">
                      {readContentString(contentRecord, "subheading")}
                    </p>
                  )}
                </div>
              )}
              {featuredProducts && featuredProducts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {featuredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-lg border bg-card overflow-hidden flex flex-col"
                    >
                      {product.images && product.images[0]?.url && (
                        <div className="relative h-40 w-full">
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="p-4 space-y-1 flex-1 flex flex-col">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {product.description}
                          </p>
                        )}
                        <div className="mt-2 text-sm font-medium">
                          {product.price > 0
                            ? `$${product.price.toFixed(2)}`
                            : "Contact for pricing"}
                        </div>
                        {enableCart && companyIdentifier && (
                          <div className="mt-4">
                            <Button
                              className={`w-full ${buttonRadiusClass}`}
                              size="sm"
                              onClick={() => handleAddProductToCart(product.id)}
                              style={{
                                backgroundColor: spec.meta.primaryColor,
                                color: isHexColorDark(spec.meta.primaryColor)
                                  ? "#ffffff"
                                  : "#111827",
                              }}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  No featured products yet. Add products to your catalog and
                  mark them as featured to showcase them here.
                </p>
              )}
            </div>
          </section>
        );

      case "service-grid":
        return (
          <section
            key={section.id}
            id="services"
            className="py-12 border-t bg-background"
          >
            <div className="container mx-auto px-4">
              {readContentString(contentRecord, "heading") && (
                <div className="mb-6 text-center">
                  <h2 className="text-3xl font-bold">
                    {readContentString(contentRecord, "heading")}
                  </h2>
                  {readContentString(contentRecord, "subheading") && (
                    <p className="mt-2 text-muted-foreground">
                      {readContentString(contentRecord, "subheading")}
                    </p>
                  )}
                </div>
              )}
              {featuredServices && featuredServices.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {featuredServices.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-lg border bg-card overflow-hidden flex flex-col"
                    >
                      {service.images && service.images[0]?.url && (
                        <div className="relative h-40 w-full">
                          <Image
                            src={service.images[0].url}
                            alt={service.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="p-4 space-y-1 flex-1 flex flex-col">
                        <h3 className="font-semibold">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {service.description}
                          </p>
                        )}
                        <div className="mt-2 text-sm font-medium">
                          {service.price > 0
                            ? `$${service.price.toFixed(2)}`
                            : "Contact for pricing"}
                        </div>
                        {enableCart && companyIdentifier && (
                          <div className="mt-4">
                            <Button
                              className={`w-full ${buttonRadiusClass}`}
                              size="sm"
                              onClick={() => handleAddServiceToCart(service.id)}
                              style={{
                                backgroundColor: spec.meta.primaryColor,
                                color: isHexColorDark(spec.meta.primaryColor)
                                  ? "#ffffff"
                                  : "#111827",
                              }}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Book / Add to Cart
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  No featured services yet. Add services to your catalog and
                  mark them as featured to showcase them here.
                </p>
              )}
            </div>
          </section>
        );

      case "posts":
        // If the server provided posts for this company, render a preview grid
        // so the homepage actually shows published articles. Otherwise fall
        // back to a simple CTA that links to the posts page.
        if (Array.isArray(posts) && posts.length > 0) {
          return (
            <section
              key={section.id}
              id="posts"
              className="py-12 border-t bg-background"
            >
              <div className="container mx-auto px-4">
                {(readContentString(contentRecord, "heading") ||
                  readContentString(contentRecord, "title")) && (
                  <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold">
                      {readContentString(contentRecord, "heading") ||
                        readContentString(contentRecord, "title")}
                    </h2>
                    {readContentString(contentRecord, "subheading") && (
                      <p className="mt-2 text-muted-foreground">
                        {readContentString(contentRecord, "subheading")}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid gap-6 md:grid-cols-3">
                  {posts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/store/${slug}/posts/${p.slug}`}
                      className="block rounded-lg border bg-card hover:bg-accent transition-colors overflow-hidden"
                    >
                      {p.heroImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.heroImage}
                          alt={p.title}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-4 space-y-2">
                        <h3 className="text-lg font-semibold">{p.title}</h3>
                        {p.excerpt && (
                          <p className="text-sm text-muted-foreground">
                            {p.excerpt}
                          </p>
                        )}
                        {p.publishedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.publishedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <a
                    href={slug ? `/store/${slug}/posts` : "/posts"}
                    className={`inline-flex items-center ${buttonRadiusClass} border px-4 py-2 text-sm font-semibold`}
                    style={{
                      borderColor:
                        spec.meta.accentColor || spec.meta.primaryColor,
                      backgroundColor: spec.meta.primaryColor,
                      color: isHexColorDark(spec.meta.primaryColor)
                        ? "#ffffff"
                        : "#111827",
                    }}
                  >
                    {readContentString(contentRecord, "ctaLabel") ||
                      "Visit blog"}
                  </a>
                </div>
              </div>
            </section>
          );
        }
        return (
          <section
            key={section.id}
            id="posts"
            className="py-12 border-t bg-background"
          >
            <div className="container mx-auto px-4 text-center space-y-3">
              {readContentString(contentRecord, "heading") && (
                <h2 className="text-3xl font-bold">
                  {readContentString(contentRecord, "heading")}
                </h2>
              )}
              {readContentString(contentRecord, "subheading") && (
                <p className="text-muted-foreground">
                  {readContentString(contentRecord, "subheading")}
                </p>
              )}
              <div className="mt-4">
                <a
                  href={
                    readContentString(contentRecord, "href") ??
                    (slug ? `/store/${slug}/posts` : "/posts")
                  }
                  className={`inline-flex items-center ${buttonRadiusClass} border px-4 py-2 text-sm font-semibold`}
                  style={{
                    borderColor:
                      spec.meta.accentColor || spec.meta.primaryColor,
                    backgroundColor: spec.meta.primaryColor,
                    color: isHexColorDark(spec.meta.primaryColor)
                      ? "#ffffff"
                      : "#111827",
                  }}
                >
                  {readContentString(contentRecord, "ctaLabel") ||
                    "Read our latest posts"}
                </a>
              </div>
            </div>
          </section>
        );

      case "testimonials": {
        const heading =
          readContentString(contentRecord, "heading") ||
          "What our customers say";
        const subheading =
          readContentString(contentRecord, "subheading") ||
          "Trusted by our community";

        const layoutVariantRaw =
          section.layout &&
          typeof (section.layout as Record<string, unknown>).variant ===
            "string"
            ? ((section.layout as Record<string, unknown>).variant as string)
            : undefined;

        const layoutVariant =
          layoutVariantRaw ||
          (spec.meta.tone === "playful" ? "marquee" : "grid");

        const hasTestimonials = !!testimonials && testimonials.length > 0;

        return (
          <section key={section.id} className="py-12 border-t bg-muted/40">
            <div className="container mx-auto px-4">
              <div className="mb-6 text-center">
                <h2 className="text-3xl font-bold">{heading}</h2>
                {subheading && (
                  <p className="mt-2 text-muted-foreground">{subheading}</p>
                )}
              </div>
              {hasTestimonials ? (
                layoutVariant === "grid" ? (
                  <div className="mt-4 grid gap-6 md:grid-cols-3">
                    {testimonials!.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-lg border bg-card px-4 py-3 text-left shadow-sm flex flex-col justify-between"
                      >
                        <p className="text-sm text-muted-foreground italic">
                          “{t.testimonial}”
                        </p>
                        <p className="mt-3 text-sm font-semibold">
                          {t.customerName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4">
                    <Marquee
                      pauseOnHover
                      className="border rounded-md bg-background"
                    >
                      {testimonials!.map((t) => (
                        <div
                          key={t.id}
                          className="mx-4 my-2 rounded-lg border bg-card px-4 py-3 text-left shadow-sm min-w-[220px]"
                        >
                          <p className="text-xs text-muted-foreground italic line-clamp-3">
                            “{t.testimonial}”
                          </p>
                          <p className="mt-2 text-xs font-semibold">
                            {t.customerName}
                          </p>
                        </div>
                      ))}
                    </Marquee>
                  </div>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  No testimonials yet. Testimonials will be highlighted here.
                </p>
              )}
              {/* CTA / Submit Button (from AI spec if present) */}
              {(() => {
                const ctaLabel =
                  readContentString(contentRecord, "ctaLabel") ||
                  (readContentString(contentRecord, "ctaText") as string) ||
                  "Share your experience";
                const ctaHref =
                  readContentString(contentRecord, "ctaHref") ||
                  (readContentString(contentRecord, "ctaLink") as string) ||
                  "#submit-testimonial";

                // Avoid rendering a duplicate CTA if it simply anchors to the
                // testimonial submission area — the TestimonialForm below already
                // renders a prominent submission trigger. Only render the AI-provided
                // CTA when it does not point at the testimonial anchor.
                const ctaHrefLower = (ctaHref || "").toLowerCase();
                const isTestimonialAnchor =
                  ctaHrefLower.includes("testimonial");
                if (isTestimonialAnchor) return null;

                return (
                  <div className="mt-6 text-center">
                    <a
                      href={ctaHref}
                      className={`inline-flex items-center ${buttonRadiusClass} border px-5 py-2 text-sm font-semibold`}
                      style={{
                        borderColor:
                          spec.meta.accentColor || spec.meta.primaryColor,
                        backgroundColor: spec.meta.primaryColor,
                        color: isHexColorDark(spec.meta.primaryColor)
                          ? "#fff"
                          : "#111827",
                      }}
                    >
                      {ctaLabel}
                    </a>
                  </div>
                );
              })()}
              {/* Allow visitors to submit a testimonial */}
              <div id="submit-testimonial" className="mt-8 flex justify-center">
                <TestimonialForm slug={slug} />
              </div>
            </div>
          </section>
        );
      }

      case "faq": {
        const heading =
          readContentString(contentRecord, "heading") ??
          "Frequently asked questions";
        const subheading = readContentString(contentRecord, "subheading") ?? "";
        const rawItems = contentRecord["items"];
        const items =
          Array.isArray(rawItems) && rawItems.length > 0
            ? (rawItems
                .map((item) => {
                  if (!item || typeof item !== "object") return null;
                  const record = item as Record<string, unknown>;
                  const question =
                    typeof record.question === "string"
                      ? record.question
                      : undefined;
                  const answer =
                    typeof record.answer === "string"
                      ? record.answer
                      : undefined;
                  if (!question || !answer) return null;
                  return { question, answer };
                })
                .filter(Boolean) as { question: string; answer: string }[])
            : [];

        // Merge admin-supplied FAQs (support articles) with AI-generated
        // FAQ items. Admin FAQs appear first (featured by admins/managers),
        // then fall back to AI generated items. Deduplicate by question.
        const adminFaqs: { question: string; answer: string }[] =
          Array.isArray(supportFaqs) && supportFaqs.length > 0
            ? (supportFaqs
                .map((s) => {
                  const question = s.title;
                  // prefer summary short text for answer, otherwise fall back to content
                  const raw = s.summary ?? s.content ?? "";
                  // strip any HTML tags if content contains HTML
                  const answer =
                    typeof raw === "string"
                      ? raw.replace(/<[^>]*>/g, "").trim()
                      : "";
                  if (!question || !answer) return null;
                  return { question, answer } as {
                    question: string;
                    answer: string;
                  };
                })
                .filter(Boolean) as { question: string; answer: string }[])
            : [];

        // Ensure AI items are used when provided
        const aiItems = items;

        // Combine, admin-first, and dedupe by normalized question
        const seen = new Set<string>();
        const combined = [] as { question: string; answer: string }[];

        const pushIfNew = (
          it: { question: string; answer: string } | undefined
        ) => {
          if (!it) return;
          const key = it.question.trim().toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          combined.push(it);
        };

        for (const a of adminFaqs) pushIfNew(a);
        for (const a of aiItems) pushIfNew(a);

        return (
          <section
            key={section.id}
            className="py-12 border-t bg-background"
            id="faq"
          >
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">{heading}</h2>
                {subheading && (
                  <p className="mt-2 text-muted-foreground">{subheading}</p>
                )}
              </div>
              {combined.length > 0 ? (
                <div className="space-y-4">
                  {combined.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border bg-card px-4 py-3 text-left"
                    >
                      <p className="font-semibold">{item.question}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Have questions? Reach out via the contact section below and
                  we&apos;ll be happy to help.
                </p>
              )}
            </div>
          </section>
        );
      }

      case "cta-band": {
        const heading =
          readContentString(contentRecord, "heading") ??
          "Ready to take the next step?";
        const subheading =
          readContentString(contentRecord, "subheading") ??
          "Get in touch with us today.";
        const buttonLabel =
          readContentString(contentRecord, "buttonLabel") ?? "Get in touch";
        const buttonHref =
          readContentString(contentRecord, "buttonHref") ?? "#contact";

        const primaryColor = spec.meta.primaryColor;
        const accentColor = spec.meta.accentColor || spec.meta.secondaryColor;
        const bandColor = accentColor || primaryColor;
        const darkBand = isHexColorDark(bandColor);

        return (
          <section key={section.id} className="py-10 border-t">
            <div
              className="container mx-auto px-4 rounded-lg shadow flex flex-col md:flex-row items-center justify-between gap-4"
              style={{
                backgroundColor: bandColor || undefined,
                color: darkBand ? "#ffffff" : "#111827",
              }}
            >
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">{heading}</h2>
                {subheading && (
                  <p className="text-sm opacity-90">{subheading}</p>
                )}
              </div>
              <div className="flex justify-center md:justify-end">
                <a
                  href={buttonHref}
                  className={`inline-flex items-center ${buttonRadiusClass} border px-5 py-2.5 text-sm font-semibold`}
                  style={{
                    backgroundColor: darkBand ? "#ffffff" : "#111827",
                    color: darkBand ? "#111827" : "#ffffff",
                    borderColor: darkBand ? "#ffffff" : "#111827",
                  }}
                >
                  {buttonLabel}
                </a>
              </div>
            </div>
          </section>
        );
      }

      case "contact":
        return (
          <section
            key={section.id}
            id="contact"
            className="py-12 border-t bg-background"
          >
            <div className="container mx-auto px-4 max-w-2xl text-center space-y-4">
              {readContentString(contentRecord, "heading") && (
                <h2 className="text-3xl font-bold">
                  {readContentString(contentRecord, "heading")}
                </h2>
              )}
              {readContentString(contentRecord, "description") && (
                <p className="text-muted-foreground">
                  {readContentString(contentRecord, "description")}
                </p>
              )}
              {(contactEmail || contactPhone) && (
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {contactEmail && (
                    <p>
                      Email:{" "}
                      <a href={`mailto:${contactEmail}`} className="underline">
                        {contactEmail}
                      </a>
                    </p>
                  )}
                  {contactPhone && <p>Phone: {contactPhone}</p>}
                </div>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Render all sections except contact first */}
      {sortedSections
        .filter((section) => section.type !== "contact")
        .map(renderSection)}

      {/* Meet the Team should appear above the contact section */}
      {featuredTeamMembers && featuredTeamMembers.length > 0 && (
        <section className="py-12 border-t bg-background">
          <div className="container mx-auto px-4">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold">Meet the Team</h2>
              <p className="mt-2 text-muted-foreground">
                The people behind {companyName}
              </p>
            </div>
            <div className="flex flex-row flex-wrap gap-4 items-stretch justify-center">
              {featuredTeamMembers.map((member) => (
                <div
                  key={member.id}
                  className="w-full md:w-1/3 px-6 py-6 rounded-lg border bg-card flex flex-col items-center text-center overflow-hidden"
                >
                  {member.image ? (
                    <div className="relative h-24 w-24 mb-4 rounded-full overflow-hidden border">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  ) : (
                    <Image
                      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1abgZFHSN1dft87SClXpEhanK9ijEKqoZAw&s"
                      alt={member.name}
                      width={96}
                      height={96}
                      className="mb-4 rounded-full border"
                    />
                  )}
                  <h3 className="font-semibold">{member.name}</h3>
                  {member.jobTitle && (
                    <p className="w-full text-xs text-muted-foreground wrap-break-word">
                      {member.jobTitle}
                    </p>
                  )}
                  {member.bio && (
                    <p className="w-full mt-2 text-xs text-muted-foreground wrap-break-word max-h-24">
                      {member.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact section ("Get in touch") should always be just above the footer */}
      {sortedSections
        .filter((section) => section.type === "contact")
        .map(renderSection)}

      {/* Simple footer unified with AI meta */}
      {/* <footer
        className="border-t mt-8 py-6"
        style={{
          backgroundColor: spec.meta.backgroundColor || undefined,
          color: spec.meta.textColor || undefined,
          borderColor: spec.meta.accentColor || spec.meta.secondaryColor,
        }}
      >
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs md:text-sm">
          <span>
            © {new Date().getFullYear()} {companyName} - All rights reserved.
          </span>
          <span className="text-xs text-muted-foreground">
            Powered by your OnTarget Brands Inc.
          </span>
        </div>
      </footer> */}
    </>
  );
}
