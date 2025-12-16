import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { defaultThemes, type ThemeSection } from "@/lib/storefront-themes";
import { ThemeRenderer } from "@/components/storefront/theme-renderer";
import StorefrontLayout from "@/components/storefront/storefront-layout";
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";
import { AiStorefrontRendererV2 } from "@/components/storefront/v2/ai-storefront-renderer-v2";
import type { Metadata } from "next";
import {
  aiFrontstoreSpecSchema,
  type AiFrontstoreSpec,
} from "@/lib/ai/ai-storefront-types";

// Force dynamic rendering to prevent caching issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    slug?: string;
  }>;
};

interface StoreMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  // Optional saved layout/content sections from Content Wizard
  sections?: ThemeSection[];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!slug) {
    return {
      title: "Store Not Found",
      description: "The requested store could not be found.",
    };
  }

  const company = await db.company.findUnique({
    where: { slug },
    select: {
      name: true,
      storeMetadata: true,
    },
  });

  if (!company) {
    return {
      title: "Store Not Found",
      description: "The requested store could not be found.",
    };
  }

  const metadata = company.storeMetadata as StoreMetadata | null;
  const title = metadata?.title || `${company.name} - Online Store`;
  const description =
    metadata?.description ||
    `Shop at ${company.name} for great products and services`;
  const keywords = metadata?.keywords?.join(", ") || "";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

async function getStoreData(slug?: string) {
  if (!slug) {
    return null;
  }

  const company = await db.company.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logo: true,
      logoLight: true,
      logoDark: true,
      slug: true,
      isStoreEnabled: true,
      storeTheme: true,
      storeBlogEnabled: true,
      storeBanner: true,
      storeMetadata: true,
      aiStorefrontEnabled: true,
      aiStorefrontSpec: true,
    },
  });

  if (!company) {
    return null;
  }

  // Get featured products (limit to 3 for homepage)
  const featuredProductsPrimary = await db.product.findMany({
    where: {
      companyId: company.id,
      isPublished: true,
      isActive: true,
      isFeatured: true,
    },
    include: {
      images: {
        orderBy: { order: "asc" },
        take: 1,
      },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const featuredProducts =
    featuredProductsPrimary.length > 0
      ? featuredProductsPrimary
      : await db.product.findMany({
          where: {
            companyId: company.id,
            isPublished: true,
            isActive: true,
          },
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        });

  // Get featured services (limit to 3 for homepage)
  const featuredServicesPrimary = await db.service.findMany({
    where: {
      companyId: company.id,
      isPublished: true,
      isActive: true,
      isFeatured: true,
    },
    include: {
      images: {
        orderBy: { order: "asc" },
        take: 1,
      },
    },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  const featuredServices =
    featuredServicesPrimary.length > 0
      ? featuredServicesPrimary
      : await db.service.findMany({
          where: {
            companyId: company.id,
            isPublished: true,
            isActive: true,
          },
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        });

  // Get featured team members
  const featuredTeamMembers = await db.companyStaff.findMany({
    where: {
      companyId: company.id,
      status: "ACTIVE",
      isFeatured: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { hireDate: "asc" }],
  });

  // Get approved testimonials
  const testimonials = await db.testimonial.findMany({
    where: {
      companyId: company.id,
      status: "APPROVED",
    },
    orderBy: [
      { isFeatured: "desc" },
      { displayOrder: "asc" },
      { createdAt: "desc" },
    ],
    take: 6, // Limit to 6 most recent/featured
  });

  // Get total approved testimonials count (full count, not just the limited slice)
  const approvedTestimonialsCount = await db.testimonial.count({
    where: { companyId: company.id, status: "APPROVED" },
  });

  // Count company customers (users with COMPANY_CUSTOMER role attached via companyMember)
  const customersCount = await db.companyMember.count({
    where: { companyId: company.id, user: { role: "COMPANY_CUSTOMER" } },
  });

  // Get featured projects/portfolio items
  const featuredProjectsPrimary = await db.project.findMany({
    where: {
      subscriberCompanyId: company.id,
      isFeatured: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      featuredImage: true,
      projectType: true,
      category: true,
      startDate: true,
      endDate: true,
      customer: {
        select: {
          name: true,
        },
      },
      subscriberCompany: {
        select: {
          name: true,
        },
      },
    },
    take: 6,
    orderBy: { startDate: "desc" },
  });

  const featuredProjects =
    featuredProjectsPrimary.length > 0
      ? featuredProjectsPrimary
      : await db.project.findMany({
          where: {
            subscriberCompanyId: company.id,
          },
          select: {
            id: true,
            name: true,
            description: true,
            featuredImage: true,
            projectType: true,
            category: true,
            startDate: true,
            endDate: true,
            customer: {
              select: {
                name: true,
              },
            },
            subscriberCompany: {
              select: {
                name: true,
              },
            },
          },
          take: 6,
          orderBy: { startDate: "desc" },
        });

  return {
    company,
    featuredProducts,
    featuredServices,
    featuredTeamMembers,
    featuredProjects,
    testimonials,
    // Fetch some recent published storefront posts for homepage previews
    posts: await db.storefrontPost.findMany({
      where: { companyId: company.id, status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        heroImage: true,
        publishedAt: true,
      },
      take: 3,
    }),
    customersCount,
    approvedTestimonialsCount,
    // Include company support articles that look like FAQs (category 'FAQ' or tags contain 'faq')
    faqs: await db.supportArticle.findMany({
      where: {
        companyId: company.id,
        status: "PUBLISHED",
        OR: [{ category: "FAQ" }, { tags: { contains: "faq" } }],
      },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
    }),
  };
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const data = await getStoreData(slug);

  if (!data) {
    notFound();
  }

  const {
    company,
    featuredProducts,
    featuredServices,
    featuredTeamMembers,
    featuredProjects,
    testimonials,
    posts,
    customersCount,
    approvedTestimonialsCount,
  } = data;

  // Serialize products and services for client component (convert Decimal to number)
  const serializedProducts = featuredProducts.map((product) => ({
    ...product,
    price: Number(product.price),
  }));

  const serializedServices = featuredServices.map((service) => ({
    ...service,
    price: Number(service.price),
  }));

  const serializedTeamMembers = featuredTeamMembers.map((member) => ({
    id: member.id,
    name: member.user.name || "Team Member",
    email: member.user.email,
    image: member.user.image,
    role: member.role,
    jobTitle: member.jobTitle,
    bio: member.bio,
    displayOrder: member.displayOrder || 0,
  }));

  // Map projects to portfolio format expected by AI renderer
  const portfolioProjects = featuredProjects.map((project) => ({
    id: project.id,
    title: project.name,
    client: project.customer?.name || project.subscriberCompany?.name || null,
    category: project.category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" "),
    description: project.description || null,
    image: project.featuredImage || null,
    tags: [],
  }));

  let aiSpec: AiFrontstoreSpec | null = null;
  if (company.aiStorefrontEnabled && company.aiStorefrontSpec) {
    const parsed = aiFrontstoreSpecSchema.safeParse(company.aiStorefrontSpec);
    if (parsed.success) {
      aiSpec = parsed.data;
    } else {
      console.error(
        "[Storefront] Invalid aiStorefrontSpec for company",
        company.id,
        parsed.error
      );
    }
  }
  const aiEnabled = company.aiStorefrontEnabled && !!aiSpec;

  // Detect V2 spec by checking for rich design system properties
  const isV2Spec =
    aiSpec &&
    (aiSpec.meta?.typography ||
      aiSpec.meta?.spacing ||
      aiSpec.meta?.effects ||
      aiSpec.meta?.animations);

  const aiMeta = aiSpec?.meta ?? null;
  const headerLogo: string | null =
    company.logo || company.logoLight || company.logoDark || null;

  if (aiEnabled && aiSpec) {
    const metadata = company.storeMetadata as StoreMetadata | null;
    const promoBannerSection =
      metadata?.sections && Array.isArray(metadata.sections)
        ? (metadata.sections as ThemeSection[]).find(
            (s) => s.type === "promo-banner" && s.enabled
          )
        : undefined;

    const heroSection =
      metadata?.sections && Array.isArray(metadata.sections)
        ? (metadata.sections as ThemeSection[]).find(
            (s) => s.type === "hero" && s.enabled
          )
        : undefined;

    const heroOverride =
      heroSection && heroSection.content
        ? {
            title:
              (heroSection.content.heading as string | undefined) ||
              (heroSection.content.title as string | undefined),
            subtitle:
              (heroSection.content.subheading as string | undefined) ||
              (heroSection.content.subtitle as string | undefined),
            description:
              (heroSection.content.description as string | undefined) ||
              undefined,
            primaryCTA:
              (heroSection.content.ctaText as string | undefined) ||
              (heroSection.content.primaryCTA as string | undefined),
            secondaryCTA:
              (heroSection.content.secondaryCtaText as string | undefined) ||
              (heroSection.content.secondaryCTA as string | undefined),
          }
        : null;

    // V2 spec has its own header/footer, so render without StorefrontLayout wrapper
    if (isV2Spec) {
      return (
        <>
          {/* Store Disabled Banner */}
          {!company.isStoreEnabled && (
            <div className="bg-yellow-500 text-yellow-950 px-4 py-3 text-center font-medium">
              ⚠️ This store is currently disabled and only visible in preview
              mode
            </div>
          )}

          {/* Optional promo banner from Content Wizard */}
          {promoBannerSection && (
            <div
              className="w-full py-3 px-4 text-center border-b"
              style={{
                background:
                  promoBannerSection.styling?.gradient ||
                  promoBannerSection.styling?.backgroundColor ||
                  undefined,
                color: promoBannerSection.styling?.textColor || undefined,
              }}
            >
              <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                <span className="text-sm sm:text-base font-semibold">
                  {String(promoBannerSection.content.text || "")}
                </span>
                {promoBannerSection.content.link &&
                  promoBannerSection.content.linkText && (
                    <Link
                      href={String(promoBannerSection.content.link)}
                      className="text-sm sm:text-base font-bold underline hover:opacity-80 transition-opacity"
                    >
                      {String(promoBannerSection.content.linkText)}
                    </Link>
                  )}
              </div>
            </div>
          )}

          <AiStorefrontRendererV2
            spec={aiSpec}
            slug={slug}
            companyName={company.name}
            companyId={company.id}
            enableCart={company.isStoreEnabled}
            featuredProducts={serializedProducts}
            featuredServices={serializedServices}
            featuredTeamMembers={serializedTeamMembers}
            portfolioProjects={portfolioProjects}
            posts={data.posts}
            testimonials={testimonials}
            supportFaqs={data.faqs ?? []}
            contactEmail={
              (company.storeMetadata as StoreMetadata | null)?.contactEmail ||
              null
            }
            contactPhone={
              (company.storeMetadata as StoreMetadata | null)?.contactPhone ||
              null
            }
            storeBanner={company.storeBanner}
            customersCount={customersCount}
            approvedTestimonialsCount={approvedTestimonialsCount}
            heroOverride={heroOverride}
          />
        </>
      );
    }

    // V1 spec uses StorefrontLayout wrapper
    return (
      <StorefrontLayout
        slug={slug}
        companyName={company.name}
        logo={headerLogo}
        logoLight={company.logoLight}
        logoDark={company.logoDark}
        storeBanner={company.storeBanner}
        storeMetadata={company.storeMetadata}
        aiMeta={aiMeta}
        isStoreEnabled={company.isStoreEnabled}
        storeBlogEnabled={company.storeBlogEnabled}
        renderHero={false}
      >
        {/* Store Disabled Banner */}
        {!company.isStoreEnabled && (
          <div className="bg-yellow-500 text-yellow-950 px-4 py-3 text-center font-medium">
            ⚠️ This store is currently disabled and only visible in preview mode
          </div>
        )}
        {/* header is provided by StorefrontLayout */}

        {/* Optional promo banner from Content Wizard (even when AI layout is enabled) */}
        {promoBannerSection && (
          <div
            className="w-full py-3 px-4 text-center border-b"
            style={{
              background:
                promoBannerSection.styling?.gradient ||
                promoBannerSection.styling?.backgroundColor ||
                undefined,
              color: promoBannerSection.styling?.textColor || undefined,
            }}
          >
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <span className="text-sm sm:text-base font-semibold">
                {String(promoBannerSection.content.text || "")}
              </span>
              {promoBannerSection.content.link &&
                promoBannerSection.content.linkText && (
                  <Link
                    href={String(promoBannerSection.content.link)}
                    className="text-sm sm:text-base font-bold underline hover:opacity-80 transition-opacity"
                  >
                    {String(promoBannerSection.content.linkText)}
                  </Link>
                )}
            </div>
          </div>
        )}

        <AiStorefrontRenderer
          spec={aiSpec}
          slug={slug}
          companyName={company.name}
          companyId={company.id}
          enableCart={company.isStoreEnabled}
          featuredProducts={serializedProducts}
          featuredServices={serializedServices}
          featuredTeamMembers={serializedTeamMembers}
          posts={data.posts}
          testimonials={testimonials}
          // admin-created FAQs (support articles) — merged by renderer with AI FAQs
          supportFaqs={data.faqs ?? []}
          contactEmail={
            (company.storeMetadata as StoreMetadata | null)?.contactEmail ||
            null
          }
          contactPhone={
            (company.storeMetadata as StoreMetadata | null)?.contactPhone ||
            null
          }
          storeBanner={company.storeBanner}
          customersCount={customersCount}
          approvedTestimonialsCount={approvedTestimonialsCount}
          heroOverride={heroOverride}
        />
      </StorefrontLayout>
    );
  }

  // Get the selected theme or default to "modern-tech"
  const themeId = company.storeTheme || "modern-tech";
  const selectedTheme =
    defaultThemes.find((t) => t.id === themeId) || defaultThemes[0];
  const isBlackFriday = selectedTheme.id === "black-friday-mega-sale";
  const isPrecisionCare = selectedTheme.id === "healthcare-precision-care";
  const isFitnessBoutique = selectedTheme.id === "fitness-boutique";
  const isDigitalCampus = selectedTheme.id === "education-digital-campus";
  const isBoutiqueStay = selectedTheme.id === "hospitality-boutique-stay";
  const isBuildCraft = selectedTheme.id === "construction-buildcraft";
  const headerClass = isBlackFriday
    ? "bg-black/90 text-white border-b border-red-600"
    : isPrecisionCare
    ? "bg-white/90 text-gray-900 border-b border-gray-200"
    : isFitnessBoutique
    ? "bg-[#f6eee5] text-[#3a2c20] border-b-4 border-[#d36c3b]"
    : isDigitalCampus
    ? "bg-[#1d75ff] text-white border-b-4 border-[#ffdd33]"
    : isBoutiqueStay
    ? "bg-white/70 text-[#3a2a2a] border-b shadow-sm"
    : isBuildCraft
    ? "bg-[#ff6b00] text-black border-b-4 border-black shadow-lg"
    : "border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60";

  return (
    <StorefrontLayout
      slug={slug}
      companyName={company.name}
      logo={headerLogo}
      logoLight={company.logoLight}
      logoDark={company.logoDark}
      storeBanner={company.storeBanner}
      storeMetadata={company.storeMetadata}
      aiMeta={aiMeta}
      isStoreEnabled={company.isStoreEnabled}
      storeBlogEnabled={company.storeBlogEnabled}
      renderHero={false}
      useThemeClass={headerClass}
    >
      {/* Store Disabled Banner */}
      {!company.isStoreEnabled && (
        <div className="bg-yellow-500 text-yellow-950 px-4 py-3 text-center font-medium">
          ⚠️ This store is currently disabled and only visible in preview mode
        </div>
      )}

      {/* Header rendered by StorefrontLayout */}

      {/* Theme-based Content */}
      <ThemeRenderer
        sections={
          ((company.storeMetadata as StoreMetadata | null)?.sections &&
          ((company.storeMetadata as StoreMetadata | null)?.sections?.length ??
            0) > 0
            ? (company.storeMetadata as StoreMetadata | null)?.sections
            : selectedTheme.sections) as ThemeSection[]
        }
        slug={slug}
        companyName={company.name}
        featuredProducts={serializedProducts}
        featuredServices={serializedServices}
        featuredTeamMembers={serializedTeamMembers}
        testimonials={testimonials}
        customersCount={customersCount}
        approvedTestimonialsCount={approvedTestimonialsCount}
        themeId={selectedTheme.id}
        storeBanner={company.storeBanner}
        storeMetadata={company.storeMetadata as StoreMetadata}
        posts={posts}
      />
    </StorefrontLayout>
  );
}
