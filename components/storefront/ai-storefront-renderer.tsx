"use client";

import Image from "next/image";
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
  featuredTeamMembers?: FeaturedTeamMember[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  storeBanner?: string | null;
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
  featuredTeamMembers,
  contactEmail,
  contactPhone,
  storeBanner,
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

  const renderSection = (section: AiFrontstoreSection) => {
    const { type, content } = section;
    const contentRecord = content as Record<string, unknown>;

    switch (type) {
      case "hero": {
        const title = readContentString(contentRecord, "title") ?? companyName;
        const subtitle = readContentString(contentRecord, "subtitle") ?? "";
        const description =
          readContentString(contentRecord, "description") ?? "";
        const primaryCTA =
          readContentString(contentRecord, "primaryCTA") ?? "Shop now";
        const secondaryCTA =
          readContentString(contentRecord, "secondaryCTA") ?? "";

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
            ? "relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-16 min-h-[80vh] flex items-center"
            : "relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-16";

        return (
          <section
            key={section.id}
            className={heroSectionClasses}
            style={{
              backgroundColor: backgroundColor || undefined,
            }}
          >
            {storeBanner && (
              <div className="absolute inset-0 -z-10 opacity-50">
                <Image
                  src={storeBanner}
                  alt={`${companyName} hero background`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              </div>
            )}
            <div className="relative container mx-auto px-4">
              <div
                className={
                  isCentered
                    ? "max-w-3xl mx-auto text-center space-y-4"
                    : "grid gap-8 md:grid-cols-2 items-center"
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

      case "testimonials":
        return (
          <section key={section.id} className="py-12 border-t bg-muted/40">
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
              {testimonials && testimonials.length > 0 ? (
                <div className="mt-4">
                  <Marquee
                    pauseOnHover
                    className="border rounded-md bg-background"
                  >
                    {testimonials.map((t) => (
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
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  No testimonials yet. Approved testimonials will be highlighted
                  here.
                </p>
              )}
              {/* Allow visitors to submit a testimonial */}
              <div className="mt-8 flex justify-center">
                <TestimonialForm slug={slug} />
              </div>
            </div>
          </section>
        );

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
                    <p className="w-full text-xs text-muted-foreground break-words">
                      {member.jobTitle}
                    </p>
                  )}
                  {member.bio && (
                    <p className="w-full mt-2 text-xs text-muted-foreground break-words max-h-24">
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
      <footer
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
      </footer>
    </>
  );
}
