"use client";

import Image from "next/image";
import Link from "next/link";

interface AiMeta {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  heroSize?: string;
}

interface StorefrontHeroProps {
  slug: string;
  companyName: string;
  title?: string;
  subtitle?: string;
  publishedAt?: string | Date | null;
  storeBanner?: string | null;
  aiMeta?: AiMeta | null;
  fallbackClass?: string | null;
  ctaHref?: string;
  ctaLabel?: string;
}

export function StorefrontHero({
  slug,
  companyName,
  title,
  subtitle,
  publishedAt,
  storeBanner,
  aiMeta,
  fallbackClass,
  ctaHref,
  ctaLabel,
}: StorefrontHeroProps) {
  const aiEnabled = !!aiMeta;

  if (aiEnabled) {
    const primaryColor = aiMeta?.primaryColor;
    const textColor = aiMeta?.textColor;
    const accentColor = aiMeta?.accentColor || aiMeta?.secondaryColor;
    const heroSize = aiMeta?.heroSize || "compact";

    const heroSectionClasses =
      heroSize === "full"
        ? "relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-background py-16 min-h-[60vh] flex items-center"
        : "relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-background py-12";

    return (
      <section
        className={heroSectionClasses}
        style={{ backgroundColor: aiMeta?.backgroundColor || undefined }}
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
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {companyName}
            </p>
            {title && (
              <h1
                className="text-4xl md:text-5xl font-extrabold"
                style={{ color: textColor || undefined }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-lg font-semibold text-muted-foreground">
                {subtitle}
              </p>
            )}
            {publishedAt && (
              <p className="text-sm text-muted-foreground">
                {new Date(publishedAt).toLocaleDateString()}
              </p>
            )}
            {(ctaHref || ctaLabel) && (
              <div className="mt-4">
                <Link
                  href={ctaHref ?? `/store/${slug}/posts`}
                  className={`inline-flex items-center rounded-md border px-4 py-2 text-sm font-semibold`}
                  style={{
                    borderColor: accentColor || primaryColor,
                    backgroundColor: primaryColor,
                    color:
                      primaryColor && /^#/.test(primaryColor)
                        ? (parseInt(
                            (primaryColor || "#ffffff").replace("#", ""),
                            16
                          ) &
                            0xffffff) >
                          0xffffff / 2
                          ? "#111827"
                          : "#fff"
                        : undefined,
                  }}
                >
                  {ctaLabel || "Visit blog"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // fallback simple hero
  return (
    <header className={`${fallbackClass ?? "border-b bg-background/95"}`}>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-2 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {companyName}
          </p>
          {title && <h1 className="text-3xl font-bold">{title}</h1>}
          {publishedAt && (
            <p className="text-xs text-muted-foreground">
              {new Date(publishedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

export default StorefrontHero;
