"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { ShoppingCart, Check, Star, ArrowRight, Play } from "lucide-react";
import { toast } from "sonner";
import type {
  AiFrontstoreSpec,
  AiFrontstoreSection,
  PortfolioProject,
} from "@/lib/ai/ai-storefront-types";

// ============================================================================
// TYPES
// ============================================================================

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

interface StorefrontTestimonial {
  id: string;
  customerName: string;
  testimonial: string;
}

interface AiStorefrontRendererV2Props {
  spec: AiFrontstoreSpec;
  slug: string;
  companyName: string;
  companyId?: string;
  enableCart?: boolean;
  featuredProducts?: FeaturedProduct[];
  featuredServices?: FeaturedService[];
  portfolioProjects?: PortfolioProject[];
  testimonials?: StorefrontTestimonial[];
  posts?: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    heroImage?: string | null;
    publishedAt?: string | Date | null;
  }[];
  customersCount?: number;
  approvedTestimonialsCount?: number;
  supportFaqs?: {
    id: string;
    title: string;
    summary?: string | null;
    content?: string | null;
  }[];
  featuredTeamMembers?: {
    id: string;
    name: string;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    jobTitle?: string | null;
    bio?: string | null;
  }[];
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Typography = ReturnType<typeof getTypographyStyles>;
type Spacing = ReturnType<typeof getSpacingStyles>;
type Effects = ReturnType<typeof getEffectsStyles>;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function readContentString(
  content: Record<string, unknown>,
  key: string
): string | undefined {
  const value = content[key];
  return typeof value === "string" ? value : undefined;
}

function isHexColorDark(hex: string): boolean {
  const rgb = parseInt(hex.replace("#", ""), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
}

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

function getTypographyStyles(spec: AiFrontstoreSpec) {
  const typography = spec.meta.typography;

  if (!typography) {
    return {
      headingFont: "Inter",
      bodyFont: "Inter",
      headingWeight: "font-bold",
      bodyWeight: "font-normal",
      headingSize: {
        h1: "text-5xl md:text-6xl lg:text-7xl",
        h2: "text-4xl md:text-5xl",
        h3: "text-3xl md:text-4xl",
        h4: "text-2xl md:text-3xl",
      },
      bodySize: "text-base md:text-lg",
      lineHeight: "leading-relaxed",
      letterSpacing: "tracking-normal",
    };
  }

  // Map typography values to Tailwind classes
  const weightMap = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
  };

  const headingSizeMap = {
    small: {
      h1: "text-4xl md:text-5xl",
      h2: "text-3xl md:text-4xl",
      h3: "text-2xl md:text-3xl",
      h4: "text-xl md:text-2xl",
    },
    medium: {
      h1: "text-5xl md:text-6xl",
      h2: "text-4xl md:text-5xl",
      h3: "text-3xl md:text-4xl",
      h4: "text-2xl md:text-3xl",
    },
    large: {
      h1: "text-6xl md:text-7xl lg:text-8xl",
      h2: "text-5xl md:text-6xl",
      h3: "text-4xl md:text-5xl",
      h4: "text-3xl md:text-4xl",
    },
    "extra-large": {
      h1: "text-7xl md:text-8xl lg:text-9xl",
      h2: "text-6xl md:text-7xl",
      h3: "text-5xl md:text-6xl",
      h4: "text-4xl md:text-5xl",
    },
  };

  const bodySizeMap = {
    small: "text-sm md:text-base",
    medium: "text-base md:text-lg",
    large: "text-lg md:text-xl",
  };

  const lineHeightMap = {
    tight: "leading-tight",
    normal: "leading-normal",
    relaxed: "leading-relaxed",
    loose: "leading-loose",
  };

  const letterSpacingMap = {
    tight: "tracking-tight",
    normal: "tracking-normal",
    wide: "tracking-wide",
    wider: "tracking-wider",
  };

  return {
    headingFont: typography.headingFont || "Inter",
    bodyFont: typography.bodyFont || "Inter",
    headingWeight: weightMap[typography.headingWeight || "bold"],
    bodyWeight: weightMap[typography.bodyWeight || "normal"],
    headingSize: headingSizeMap[typography.headingSize || "medium"],
    bodySize: bodySizeMap[typography.bodySize || "medium"],
    lineHeight: lineHeightMap[typography.lineHeight || "relaxed"],
    letterSpacing: letterSpacingMap[typography.letterSpacing || "normal"],
  };
}

// ============================================================================
// SPACING SYSTEM
// ============================================================================

function getSpacingStyles(spec: AiFrontstoreSpec) {
  const spacing = spec.meta.spacing;

  if (!spacing) {
    return {
      scale: "normal",
      sectionGap: "py-16 md:py-24",
      containerMaxWidth: "max-w-7xl",
    };
  }

  const scaleMap = {
    compact: {
      sectionGap: "py-12 md:py-16",
      elementGap: "space-y-4",
    },
    normal: {
      sectionGap: "py-16 md:py-24",
      elementGap: "space-y-6",
    },
    relaxed: {
      sectionGap: "py-20 md:py-32",
      elementGap: "space-y-8",
    },
    spacious: {
      sectionGap: "py-24 md:py-40",
      elementGap: "space-y-10",
    },
  };

  const sectionGapMap = {
    small: "py-12 md:py-16",
    medium: "py-16 md:py-24",
    large: "py-20 md:py-32",
    "extra-large": "py-24 md:py-40",
  };

  const containerMap = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-[1600px]",
    full: "max-w-full",
  };

  return {
    scale: spacing.scale || "normal",
    sectionGap: spacing.sectionGap
      ? sectionGapMap[spacing.sectionGap]
      : scaleMap[spacing.scale || "normal"].sectionGap,
    containerMaxWidth: containerMap[spacing.containerMaxWidth || "xl"],
    elementGap: scaleMap[spacing.scale || "normal"].elementGap,
  };
}

// ============================================================================
// EFFECTS SYSTEM
// ============================================================================

function getEffectsStyles(spec: AiFrontstoreSpec) {
  const effects = spec.meta.effects;

  if (!effects) {
    return {
      shadows: "shadow-md",
      borders: "",
      gradients: false,
      glassmorphism: false,
      animations: "subtle",
    };
  }

  const shadowMap = {
    none: "",
    soft: "shadow-sm",
    medium: "shadow-md",
    hard: "shadow-xl",
    colored: "shadow-2xl shadow-primary/20",
  };

  const borderMap = {
    none: "",
    thin: "border border-border",
    medium: "border-2 border-border",
    thick: "border-4 border-border",
    colorful: "border-2 border-primary",
  };

  return {
    shadows: shadowMap[effects.shadows || "medium"],
    borders: borderMap[effects.borders || "none"],
    gradients: effects.gradients ?? false,
    glassmorphism: effects.glassmorphism ?? false,
    animations: effects.animations || "subtle",
  };
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// ============================================================================
// ANIMATED SECTION WRAPPER
// ============================================================================

function AnimatedSection({
  children,
  className = "",
  animationType = "fadeInUp",
}: {
  children: React.ReactNode;
  className?: string;
  animationType?:
    | "fadeInUp"
    | "fadeIn"
    | "scaleIn"
    | "slideInLeft"
    | "slideInRight";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const variants = {
    fadeInUp,
    fadeIn,
    scaleIn,
    slideInLeft,
    slideInRight,
  };

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants[animationType]}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ============================================================================
// HERO SECTION V2
// ============================================================================

function HeroSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
  heroOverride,
  storeBanner,
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
  heroOverride: AiStorefrontRendererV2Props["heroOverride"];
  storeBanner: string | null;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const { content, styling } = section;
  const title =
    heroOverride?.title || readContentString(content, "title") || "Welcome";
  const subtitle =
    heroOverride?.subtitle || readContentString(content, "subtitle");
  const description =
    heroOverride?.description || readContentString(content, "description");
  const primaryCTA =
    heroOverride?.primaryCTA || readContentString(content, "primaryCTA");
  const secondaryCTA =
    heroOverride?.secondaryCTA || readContentString(content, "secondaryCTA");

  const backgroundVideo = spec.meta.backgroundVideo;
  const backgroundImage = styling?.backgroundImage || spec.meta.backgroundImage;
  const backgroundColor =
    styling?.backgroundColor ||
    spec.meta.backgroundColor ||
    spec.meta.primaryColor;
  const textColor = styling?.textColor || spec.meta.textColor || "#ffffff";

  const heroSize = spec.meta.heroSize || "full";
  const heightMap = {
    compact: "min-h-[60vh]",
    full: "min-h-screen",
    "extra-large": "min-h-[120vh]",
    minimal: "min-h-[40vh]",
  };

  return (
    <AnimatedSection
      className={`relative ${heightMap[heroSize]} flex items-center justify-center overflow-hidden`}
      animationType="fadeIn"
    >
      {/* Video Background */}
      {backgroundVideo?.url && (
        <motion.div className="absolute inset-0 z-0" style={{ y }}>
          <video
            autoPlay={backgroundVideo.autoplay ?? true}
            loop={backgroundVideo.loop ?? true}
            muted={backgroundVideo.muted ?? true}
            playsInline
            poster={backgroundVideo.poster}
            className="h-full w-full object-cover"
          >
            <source src={backgroundVideo.url} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      )}

      {/* Image Background */}
      {!backgroundVideo && backgroundImage?.url && (
        <motion.div className="absolute inset-0 z-0" style={{ y }}>
          <Image
            src={backgroundImage.url}
            alt={backgroundImage.alt || "Hero background"}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/50 to-black/30" />
        </motion.div>
      )}

      {/* Solid Background */}
      {!backgroundVideo && !backgroundImage?.url && (
        <div
          className="absolute inset-0 z-0"
          style={{
            background: effects.gradients
              ? `linear-gradient(135deg, ${backgroundColor} 0%, ${spec.meta.secondaryColor} 100%)`
              : backgroundColor,
          }}
        />
      )}

      {/* Content */}
      <motion.div
        className={`relative z-10 ${spacing.containerMaxWidth} mx-auto px-4 text-center`}
        style={{ opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={spacing.elementGap}
        >
          {storeBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6 inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <p
                className={`${typography.bodySize} font-semibold`}
                style={{ color: textColor }}
              >
                {storeBanner}
              </p>
            </motion.div>
          )}

          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`${typography.bodySize} ${typography.bodyWeight} ${
                typography.letterSpacing
              } text-${
                textColor.startsWith("#") ? "[" + textColor + "]" : textColor
              } uppercase mb-4`}
            >
              {subtitle}
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`${typography.headingSize.h1} ${typography.headingWeight} ${typography.lineHeight} ${typography.letterSpacing}`}
            style={{
              fontFamily: typography.headingFont,
              color: textColor,
            }}
          >
            {title}
          </motion.h1>

          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={`${typography.bodySize} ${typography.lineHeight} max-w-3xl mx-auto`}
              style={{
                fontFamily: typography.bodyFont,
                color: textColor,
                opacity: 0.9,
              }}
            >
              {description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8"
          >
            {primaryCTA && (
              <Button
                size="lg"
                className={`${effects.shadows} group relative overflow-hidden`}
                style={{
                  backgroundColor:
                    spec.meta.accentColor || spec.meta.secondaryColor,
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {primaryCTA}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                {effects.gradients && (
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                )}
              </Button>
            )}

            {secondaryCTA && (
              <Button
                size="lg"
                variant="outline"
                className={`${effects.borders} backdrop-blur-sm`}
                style={{
                  borderColor: textColor,
                  color: textColor,
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                {secondaryCTA}
              </Button>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 rounded-full flex items-start justify-center p-2"
          style={{ borderColor: textColor }}
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-3 rounded-full"
            style={{ backgroundColor: textColor }}
          />
        </motion.div>
      </motion.div>
    </AnimatedSection>
  );
}

// ============================================================================
// FEATURES/HIGHLIGHTS SECTION V2
// ============================================================================

function FeaturesSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
}) {
  const { content } = section;
  const title = readContentString(content, "title") || "Features";
  const subtitle = readContentString(content, "subtitle");
  const items =
    (content.items as Array<{
      title: string;
      description: string;
      icon?: string;
    }>) || [];

  const grid = spec.meta.grid;
  const columns = grid?.columns || 3;
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <AnimatedSection className={`${spacing.sectionGap} bg-background`}>
      <div className={`${spacing.containerMaxWidth} mx-auto px-4`}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          {subtitle && (
            <motion.p
              variants={fadeInUp}
              className={`${typography.bodySize} ${typography.bodyWeight} text-primary uppercase ${typography.letterSpacing} mb-4`}
            >
              {subtitle}
            </motion.p>
          )}
          <motion.h2
            variants={fadeInUp}
            className={`${typography.headingSize.h2} ${typography.headingWeight} ${typography.lineHeight}`}
            style={{ fontFamily: typography.headingFont }}
          >
            {title}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className={`grid ${
            gridCols[columns as keyof typeof gridCols] || gridCols[3]
          } gap-8`}
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className={`p-6 rounded-lg ${effects.borders} ${
                effects.shadows
              } ${
                effects.glassmorphism
                  ? "bg-background/50 backdrop-blur-sm"
                  : "bg-card"
              } group cursor-pointer`}
            >
              {item.icon && (
                <div
                  className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                  style={{
                    backgroundColor: spec.meta.primaryColor,
                    color: isHexColorDark(spec.meta.primaryColor)
                      ? "#ffffff"
                      : "#000000",
                  }}
                >
                  <span className="text-2xl">{item.icon}</span>
                </div>
              )}
              <h3
                className={`${typography.headingSize.h4} ${typography.headingWeight} mb-2 group-hover:text-primary transition-colors`}
                style={{ fontFamily: typography.headingFont }}
              >
                {item.title}
              </h3>
              <p
                className={`${typography.bodySize} ${typography.lineHeight} text-muted-foreground`}
                style={{ fontFamily: typography.bodyFont }}
              >
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// TESTIMONIALS SECTION V2
// ============================================================================

function TestimonialsSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
  testimonials = [],
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
  testimonials: StorefrontTestimonial[];
}) {
  const { content } = section;
  const title = readContentString(content, "title") || "What Our Customers Say";
  const subtitle = readContentString(content, "subtitle");

  if (testimonials.length === 0) return null;

  return (
    <AnimatedSection className={`${spacing.sectionGap} bg-muted/30`}>
      <div className={`${spacing.containerMaxWidth} mx-auto px-4`}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          {subtitle && (
            <motion.p
              variants={fadeInUp}
              className={`${typography.bodySize} ${typography.bodyWeight} text-primary uppercase ${typography.letterSpacing} mb-4`}
            >
              {subtitle}
            </motion.p>
          )}
          <motion.h2
            variants={fadeInUp}
            className={`${typography.headingSize.h2} ${typography.headingWeight} ${typography.lineHeight}`}
            style={{ fontFamily: typography.headingFont }}
          >
            {title}
          </motion.h2>
        </motion.div>

        <Marquee pauseOnHover className="[--duration:40s]">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`mx-4 p-6 rounded-lg ${effects.borders} ${
                effects.shadows
              } ${
                effects.glassmorphism
                  ? "bg-background/80 backdrop-blur-md"
                  : "bg-card"
              } max-w-md`}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5"
                    fill={spec.meta.primaryColor || "currentColor"}
                    style={{ color: spec.meta.primaryColor }}
                  />
                ))}
              </div>
              <p
                className={`${typography.bodySize} ${typography.lineHeight} mb-4`}
                style={{ fontFamily: typography.bodyFont }}
              >
                &quot;{testimonial.testimonial}&quot;
              </p>
              <p
                className={`${typography.bodyWeight} font-semibold`}
                style={{ fontFamily: typography.bodyFont }}
              >
                {testimonial.customerName}
              </p>
            </motion.div>
          ))}
        </Marquee>
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// PRODUCTS SECTION V2
// ============================================================================

function ProductsSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
  featuredProducts = [],
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
  featuredProducts: FeaturedProduct[];
}) {
  const columns = spec.meta.grid?.columns || 3;

  return (
    <AnimatedSection
      className={`${spacing.sectionGap} ${spacing.containerMaxWidth} mx-auto px-4`}
    >
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`${typography.headingSize.h2} ${typography.headingWeight} mb-4`}
          style={{
            fontFamily: typography.headingFont,
            color: spec.meta.primaryColor,
          }}
        >
          {readContentString(section.content, "title") || "Our Products"}
        </motion.h2>
        {readContentString(section.content, "subtitle") && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`${typography.bodySize} text-muted-foreground max-w-2xl mx-auto`}
            style={{ fontFamily: typography.bodyFont }}
          >
            {readContentString(section.content, "subtitle")}
          </motion.p>
        )}
      </div>

      <div
        className={`grid gap-6 ${
          columns === 2
            ? "grid-cols-1 md:grid-cols-2"
            : columns === 4
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {featuredProducts.length > 0 ? (
          featuredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`${effects.borders} ${
                effects.shadows
              } rounded-xl overflow-hidden ${
                effects.glassmorphism
                  ? "bg-background/80 backdrop-blur-md"
                  : "bg-card"
              } group cursor-pointer`}
            >
              {product.images && product.images.length > 0 && (
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-6">
                <h3
                  className={`${typography.headingSize.h4} ${typography.headingWeight} mb-2`}
                  style={{ fontFamily: typography.headingFont }}
                >
                  {product.name}
                </h3>
                {product.description && (
                  <p
                    className={`${typography.bodySize} text-muted-foreground mb-4 line-clamp-2`}
                    style={{ fontFamily: typography.bodyFont }}
                  >
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`${typography.headingSize.h4} font-bold`}
                    style={{ color: spec.meta.primaryColor }}
                  >
                    ${product.price.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    style={{ backgroundColor: spec.meta.primaryColor }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No products available
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// SERVICES SECTION V2
// ============================================================================

function ServicesSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
  featuredServices = [],
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
  featuredServices: FeaturedService[];
}) {
  return (
    <AnimatedSection
      className={`${spacing.sectionGap} ${spacing.containerMaxWidth} mx-auto px-4`}
    >
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`${typography.headingSize.h2} ${typography.headingWeight} mb-4`}
          style={{
            fontFamily: typography.headingFont,
            color: spec.meta.primaryColor,
          }}
        >
          {readContentString(section.content, "title") || "Our Services"}
        </motion.h2>
        {readContentString(section.content, "subtitle") && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`${typography.bodySize} text-muted-foreground max-w-2xl mx-auto`}
            style={{ fontFamily: typography.bodyFont }}
          >
            {readContentString(section.content, "subtitle")}
          </motion.p>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {featuredServices.length > 0 ? (
          featuredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className={`${effects.borders} ${
                effects.shadows
              } rounded-xl p-8 ${
                effects.glassmorphism
                  ? "bg-background/80 backdrop-blur-md"
                  : "bg-card"
              }`}
            >
              <h3
                className={`${typography.headingSize.h3} ${typography.headingWeight} mb-3`}
                style={{
                  fontFamily: typography.headingFont,
                  color: spec.meta.primaryColor,
                }}
              >
                {service.name}
              </h3>
              {service.description && (
                <p
                  className={`${typography.bodySize} text-muted-foreground mb-4`}
                  style={{ fontFamily: typography.bodyFont }}
                >
                  {service.description}
                </p>
              )}

              {/* Service highlights */}
              <div className="mb-6 space-y-2">
                {["Quality guaranteed", "Fast delivery", "Expert support"].map(
                  (feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span
                        className={`${typography.bodySize} text-sm text-muted-foreground`}
                      >
                        {feature}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`${typography.headingSize.h4} font-bold`}
                  style={{ color: spec.meta.primaryColor }}
                >
                  ${service.price.toFixed(2)}
                </span>
                <Button
                  variant="outline"
                  style={{ borderColor: spec.meta.primaryColor }}
                >
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No services available
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// STATS SECTION V2
// ============================================================================

function StatsSectionV2({
  section,
  spec,
  typography,
  spacing,
  customersCount = 0,
  approvedTestimonialsCount = 0,
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  customersCount: number;
  approvedTestimonialsCount: number;
}) {
  const stats = [
    { label: "Happy Clients", value: customersCount || 500 },
    {
      label: "Projects Completed",
      value: approvedTestimonialsCount * 2 || 1000,
    },
    { label: "Years Experience", value: 15 },
    { label: "Team Members", value: 25 },
  ];

  const title = readContentString(section.content, "title") || "Our Impact";

  return (
    <AnimatedSection
      className={`${spacing.sectionGap} ${spacing.containerMaxWidth} mx-auto px-4`}
    >
      {title && (
        <h2
          className={`${typography.headingSize.h2} ${typography.headingWeight} text-center mb-12`}
          style={{ fontFamily: typography.headingFont }}
        >
          {title}
        </h2>
      )}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className={`${typography.headingSize.h1} font-bold mb-2`}
              style={{
                fontFamily: typography.headingFont,
                color: spec.meta.primaryColor,
              }}
            >
              {stat.value.toLocaleString()}+
            </motion.div>
            <p
              className={`${typography.bodySize} text-muted-foreground`}
              style={{ fontFamily: typography.bodyFont }}
            >
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// PORTFOLIO SECTION V2
// ============================================================================

function PortfolioSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
  portfolioProjects,
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: Typography;
  spacing: Spacing;
  effects: Effects;
  portfolioProjects: PortfolioProject[];
}) {
  const { content } = section;
  const title = readContentString(content, "title") || "Our Portfolio";
  const subtitle = readContentString(content, "subtitle");
  const gapClass = "gap-8 md:gap-10";

  return (
    <AnimatedSection className={`${spacing.sectionGap} bg-background`}>
      <div className={`${spacing.containerMaxWidth} mx-auto px-4`}>
        {subtitle && (
          <p
            className={`${typography.bodySize} ${typography.bodyWeight} text-primary uppercase ${typography.letterSpacing} mb-4 text-center`}
          >
            {subtitle}
          </p>
        )}
        {title && (
          <h2
            className={`${typography.headingSize.h2} ${typography.headingWeight} text-foreground mb-12 text-center`}
            style={{
              fontFamily: typography.headingFont,
              letterSpacing: typography.letterSpacing,
              lineHeight: typography.lineHeight,
            }}
          >
            {title}
          </h2>
        )}

        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gapClass}`}
        >
          {portfolioProjects && portfolioProjects.length > 0 ? (
            portfolioProjects.map((project, index) => (
              <Link key={project.id} href={`#project-${project.id}`}>
                <motion.article
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-xl bg-card cursor-pointer"
                  style={{
                    boxShadow:
                      effects.shadows === "soft"
                        ? "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                        : effects.shadows === "hard"
                        ? "8px 8px 0 rgb(0 0 0 / 0.1)"
                        : "none",
                    borderWidth: effects.borders ? "1px" : "0",
                    borderColor: effects.borders ? "var(--border)" : undefined,
                  }}
                >
                  <div className="aspect-4/3 overflow-hidden bg-muted">
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={project.title}
                        width={600}
                        height={450}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-linear-to-br from-muted to-muted-foreground/20">
                        <span className="text-4xl font-bold text-muted-foreground/30">
                          {project.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-card via-card/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    <div className="translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
                      {project.category && (
                        <span
                          className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider"
                          style={{
                            backgroundColor: `${spec.meta.primaryColor}20`,
                            color: spec.meta.primaryColor,
                          }}
                        >
                          {project.category}
                        </span>
                      )}

                      <h3
                        className={`${typography.headingSize.h3} font-${typography.headingWeight} text-card-foreground`}
                        style={{ fontFamily: typography.headingFont }}
                      >
                        {project.title}
                      </h3>

                      {project.client && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {project.client}
                        </p>
                      )}

                      {project.description && (
                        <p className="mt-4 max-h-0 overflow-hidden text-sm text-muted-foreground/80 transition-all duration-500 group-hover:max-h-24 line-clamp-3">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div
                      className="mt-4 flex items-center gap-2 opacity-0 transition-all duration-500 group-hover:opacity-100"
                      style={{ color: spec.meta.primaryColor }}
                    >
                      <span className="text-sm font-medium">View Project</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.article>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No projects available
            </div>
          )}
        </div>
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// FAQ SECTION V2
// ============================================================================

function FAQSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
  supportFaqs = [],
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
  supportFaqs: { id: string; title: string; summary?: string | null }[];
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const defaultFaqs = [
    {
      id: "1",
      title: "What services do you offer?",
      summary:
        "We offer comprehensive web design, development, and digital marketing services tailored to your business needs.",
    },
    {
      id: "2",
      title: "How long does a typical project take?",
      summary:
        "Project timelines vary based on scope, but most websites take 4-8 weeks from start to launch.",
    },
    {
      id: "3",
      title: "Do you provide ongoing support?",
      summary:
        "Yes! We offer maintenance packages and ongoing support to keep your website running smoothly.",
    },
  ];

  const faqs = supportFaqs.length > 0 ? supportFaqs : defaultFaqs;

  return (
    <AnimatedSection
      className={`${spacing.sectionGap} ${spacing.containerMaxWidth} mx-auto px-4`}
    >
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`${typography.headingSize.h2} ${typography.headingWeight} mb-4`}
          style={{
            fontFamily: typography.headingFont,
            color: spec.meta.primaryColor,
          }}
        >
          {readContentString(section.content, "title") ||
            "Frequently Asked Questions"}
        </motion.h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`${effects.borders} ${
              effects.shadows
            } rounded-xl overflow-hidden ${
              effects.glassmorphism
                ? "bg-background/80 backdrop-blur-md"
                : "bg-card"
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors"
            >
              <span
                className={`${typography.headingSize.h4} ${typography.headingWeight}`}
                style={{ fontFamily: typography.headingFont }}
              >
                {faq.title}
              </span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="w-5 h-5 rotate-90" />
              </motion.div>
            </button>
            <motion.div
              initial={false}
              animate={{
                height: openIndex === index ? "auto" : 0,
                opacity: openIndex === index ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p
                className={`${typography.bodySize} text-muted-foreground px-6 pb-4`}
                style={{ fontFamily: typography.bodyFont }}
              >
                {faq.summary}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// CONTACT SECTION V2
// ============================================================================

function ContactSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
  contactEmail,
  contactPhone,
  companyId,
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
  contactEmail?: string | null;
  contactPhone?: string | null;
  companyId?: string;
}) {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, send to API with companyId
    console.log("Submitting contact form for company:", companyId, formData);
    toast.success("Message sent! We'll get back to you soon.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <AnimatedSection
      className={`${spacing.sectionGap} ${spacing.containerMaxWidth} mx-auto px-4`}
    >
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`${typography.headingSize.h2} ${typography.headingWeight} mb-4`}
          style={{
            fontFamily: typography.headingFont,
            color: spec.meta.primaryColor,
          }}
        >
          {readContentString(section.content, "title") || "Get In Touch"}
        </motion.h2>
        {readContentString(section.content, "subtitle") && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`${typography.bodySize} text-muted-foreground max-w-2xl mx-auto`}
            style={{ fontFamily: typography.bodyFont }}
          >
            {readContentString(section.content, "subtitle")}
          </motion.p>
        )}
      </div>

      <div className="grid gap-12 lg:grid-cols-2 max-w-5xl mx-auto">
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className={`block ${typography.bodySize} font-medium mb-2`}>
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-3 rounded-lg ${effects.borders} bg-background`}
            />
          </div>
          <div>
            <label className={`block ${typography.bodySize} font-medium mb-2`}>
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`w-full px-4 py-3 rounded-lg ${effects.borders} bg-background`}
            />
          </div>
          <div>
            <label className={`block ${typography.bodySize} font-medium mb-2`}>
              Message
            </label>
            <textarea
              required
              rows={5}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className={`w-full px-4 py-3 rounded-lg ${effects.borders} bg-background resize-none`}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            style={{ backgroundColor: spec.meta.primaryColor }}
          >
            Send Message
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {contactEmail && (
            <div>
              <h3
                className={`${typography.headingSize.h4} ${typography.headingWeight} mb-2`}
                style={{ fontFamily: typography.headingFont }}
              >
                Email
              </h3>
              <a
                href={`mailto:${contactEmail}`}
                className={`${typography.bodySize} hover:underline`}
                style={{ color: spec.meta.primaryColor }}
              >
                {contactEmail}
              </a>
            </div>
          )}
          {contactPhone && (
            <div>
              <h3
                className={`${typography.headingSize.h4} ${typography.headingWeight} mb-2`}
                style={{ fontFamily: typography.headingFont }}
              >
                Phone
              </h3>
              <a
                href={`tel:${contactPhone}`}
                className={`${typography.bodySize} hover:underline`}
                style={{ color: spec.meta.primaryColor }}
              >
                {contactPhone}
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// CTA BAND SECTION V2
// ============================================================================

function CTABandV2({
  section,
  spec,
  typography,
  spacing,
  effects,
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
}) {
  return (
    <AnimatedSection
      className={`${spacing.sectionGap} ${spacing.containerMaxWidth} mx-auto px-4`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className={`${effects.borders} ${
          effects.shadows
        } rounded-2xl p-12 text-center ${
          effects.glassmorphism
            ? "bg-background/80 backdrop-blur-md"
            : "bg-card"
        }`}
        style={{
          background: effects.gradients
            ? `linear-gradient(135deg, ${spec.meta.primaryColor}15, ${spec.meta.secondaryColor}15)`
            : undefined,
        }}
      >
        <h2
          className={`${typography.headingSize.h2} ${typography.headingWeight} mb-4`}
          style={{
            fontFamily: typography.headingFont,
            color: spec.meta.primaryColor,
          }}
        >
          {readContentString(section.content, "title") ||
            "Ready to Get Started?"}
        </h2>
        {readContentString(section.content, "subtitle") && (
          <p
            className={`${typography.bodySize} text-muted-foreground mb-8 max-w-2xl mx-auto`}
            style={{ fontFamily: typography.bodyFont }}
          >
            {readContentString(section.content, "subtitle")}
          </p>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" style={{ backgroundColor: spec.meta.primaryColor }}>
            {readContentString(section.content, "primaryCTA") || "Get Started"}
          </Button>
          <Button size="lg" variant="outline">
            {readContentString(section.content, "secondaryCTA") || "Learn More"}
          </Button>
        </div>
      </motion.div>
    </AnimatedSection>
  );
}

// ============================================================================
// POSTS SECTION V2
// ============================================================================

function PostsSectionV2({
  section,
  spec,
  typography,
  spacing,
  effects,
  posts = [],
}: {
  section: AiFrontstoreSection;
  spec: AiFrontstoreSpec;
  typography: ReturnType<typeof getTypographyStyles>;
  spacing: ReturnType<typeof getSpacingStyles>;
  effects: ReturnType<typeof getEffectsStyles>;
  posts: {
    id: string;
    title: string;
    excerpt?: string | null;
    heroImage?: string | null;
  }[];
}) {
  return (
    <AnimatedSection
      className={`${spacing.sectionGap} ${spacing.containerMaxWidth} mx-auto px-4`}
    >
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`${typography.headingSize.h2} ${typography.headingWeight} mb-4`}
          style={{
            fontFamily: typography.headingFont,
            color: spec.meta.primaryColor,
          }}
        >
          {readContentString(section.content, "title") || "Latest Insights"}
        </motion.h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.length > 0 ? (
          posts.slice(0, 3).map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className={`${effects.borders} ${
                effects.shadows
              } rounded-xl overflow-hidden ${
                effects.glassmorphism
                  ? "bg-background/80 backdrop-blur-md"
                  : "bg-card"
              }`}
            >
              {post.heroImage && (
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={post.heroImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3
                  className={`${typography.headingSize.h4} ${typography.headingWeight} mb-3`}
                  style={{ fontFamily: typography.headingFont }}
                >
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p
                    className={`${typography.bodySize} text-muted-foreground mb-4 line-clamp-3`}
                    style={{ fontFamily: typography.bodyFont }}
                  >
                    {post.excerpt}
                  </p>
                )}
                <Button
                  variant="link"
                  className="p-0"
                  style={{ color: spec.meta.primaryColor }}
                >
                  Read More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.article>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No posts available
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}

// ============================================================================
// MAIN RENDERER COMPONENT
// ============================================================================

export function AiStorefrontRendererV2(props: AiStorefrontRendererV2Props) {
  const { spec } = props;

  // Extract design systems from spec
  const typography = getTypographyStyles(spec);
  const spacing = getSpacingStyles(spec);
  const effects = getEffectsStyles(spec);

  // Apply global font families
  useEffect(() => {
    if (typography.headingFont !== "Inter") {
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${typography.headingFont.replace(
        " ",
        "+"
      )}:wght@300;400;500;600;700;800;900&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (
      typography.bodyFont !== "Inter" &&
      typography.bodyFont !== typography.headingFont
    ) {
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${typography.bodyFont.replace(
        " ",
        "+"
      )}:wght@300;400;500;600;700&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, [typography.headingFont, typography.bodyFont]);

  const sections = spec.sections || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
      style={{ fontFamily: typography.bodyFont }}
    >
      {sections.map((section) => {
        switch (section.type) {
          case "hero":
            return (
              <HeroSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
                heroOverride={props.heroOverride}
                storeBanner={props.storeBanner ?? null}
              />
            );

          case "highlights":
            return (
              <FeaturesSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
              />
            );

          case "testimonials":
            return (
              <TestimonialsSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
                testimonials={props.testimonials || []}
              />
            );

          case "product-grid":
            return (
              <ProductsSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
                featuredProducts={props.featuredProducts || []}
              />
            );

          case "service-grid":
            return (
              <ServicesSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
                featuredServices={props.featuredServices || []}
              />
            );

          case "portfolio":
            return (
              <PortfolioSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
                portfolioProjects={props.portfolioProjects || []}
              />
            );

          case "stats":
            return (
              <StatsSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                customersCount={props.customersCount || 0}
                approvedTestimonialsCount={props.approvedTestimonialsCount || 0}
              />
            );

          case "faq":
            return (
              <FAQSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
                supportFaqs={props.supportFaqs || []}
              />
            );

          case "contact":
            return (
              <ContactSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
                contactEmail={props.contactEmail}
                contactPhone={props.contactPhone}
                companyId={props.companyId}
              />
            );

          case "cta-band":
            return (
              <CTABandV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
              />
            );

          case "posts":
            return (
              <PostsSectionV2
                key={section.id}
                section={section}
                spec={spec}
                typography={typography}
                spacing={spacing}
                effects={effects}
                posts={props.posts || []}
              />
            );

          default:
            return null;
        }
      })}
    </motion.div>
  );
}
