import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultThemes } from "@/lib/storefront-themes";
import { ThemeRenderer } from "@/components/storefront/theme-renderer";
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";
import type { Metadata } from "next";
import type { AiFrontstoreSpec } from "@/lib/ai/ai-storefront-types";

// Force dynamic rendering to prevent caching issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: {
    slug: string;
  };
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
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = params;
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

async function getStoreData(slug: string) {
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

  return {
    company,
    featuredProducts,
    featuredServices,
    featuredTeamMembers,
    testimonials,
  };
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = params;
  const data = await getStoreData(slug);

  if (!data) {
    notFound();
  }

  const {
    company,
    featuredProducts,
    featuredServices,
    featuredTeamMembers,
    testimonials,
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

  const aiEnabled =
    company.aiStorefrontEnabled && !!company.aiStorefrontSpec;
  const aiSpec =
    (company.aiStorefrontSpec as unknown as AiFrontstoreSpec | null) ?? null;
  const aiMeta = aiSpec?.meta ?? null;
  const headerLogo: string | null =
    company.logo || company.logoLight || company.logoDark || null;

  if (aiEnabled && aiSpec) {
    return (
      <div className="min-h-screen bg-background">
        {/* Store Disabled Banner */}
        {!company.isStoreEnabled && (
          <div className="bg-yellow-500 text-yellow-950 px-4 py-3 text-center font-medium">
            ⚠️ This store is currently disabled and only visible in preview mode
          </div>
        )}
        <header
          className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
          style={
            aiMeta
              ? {
                  backgroundColor: aiMeta.primaryColor || undefined,
                  color: aiMeta.textColor || undefined,
                  borderColor: aiMeta.accentColor || aiMeta.secondaryColor,
                }
              : undefined
          }
        >
          <div className="container mx-auto h-14 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {headerLogo ? (
                <div className="relative h-14 w-[330px] border border-red-500 flex justify-start items-center">
                  <Image
                    src={headerLogo}
                    alt={company.name}
                    width={230}
                    height={67}
                  />
                </div>
              ) : (
                <h1 className="text-white text-2xl font-bold">
                  {company.name}
                </h1>
              )}
            </div>
            <nav className="hidden md:flex items-center gap-6 text-white">
              <Link
                href={`/store/${slug}`}
                className="text-sm font-medium hover:underline"
              >
                Home
              </Link>
              <Link
                href={`/store/${slug}/products`}
                className="text-sm font-medium hover:underline"
              >
                Products
              </Link>
              <Link
                href={`/store/${slug}/services`}
                className="text-sm font-medium hover:underline"
              >
                Services
              </Link>
              <Link
                href={`/store/${slug}/login`}
                className="text-sm font-medium hover:underline"
              >
                Login
              </Link>
              <Button
                size="sm"
                variant="outline"
                asChild
                style={
                  aiMeta
                    ? {
                        borderColor:
                          aiMeta.accentColor || aiMeta.secondaryColor,
                        color: aiMeta.textColor || "#111827",
                      }
                    : undefined
                }
              >
                <Link href={`/store/${slug}/register`}>Register</Link>
              </Button>
              <Button
                size="sm"
                asChild
                style={
                  aiMeta
                    ? {
                        backgroundColor:
                          aiMeta.accentColor || aiMeta.primaryColor,
                        color: aiMeta.textColor || "#ffffff",
                      }
                    : undefined
                }
              >
                <Link href={`/store/${slug}/cart`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Link>
              </Button>
            </nav>
          </div>
        </header>

        <AiStorefrontRenderer
          spec={aiSpec}
          slug={slug}
          companyName={company.name}
          companyId={company.id}
          enableCart={company.isStoreEnabled}
          featuredProducts={serializedProducts}
          featuredServices={serializedServices}
          featuredTeamMembers={serializedTeamMembers}
          testimonials={testimonials}
          contactEmail={
            (company.storeMetadata as StoreMetadata | null)?.contactEmail ||
            null
          }
          contactPhone={
            (company.storeMetadata as StoreMetadata | null)?.contactPhone ||
            null
          }
          storeBanner={company.storeBanner}
        />
      </div>
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
  const linkClass = isBlackFriday
    ? "text-sm font-medium hover:text-red-500 transition"
    : isPrecisionCare
    ? "text-sm font-medium text-gray-800 hover:text-teal-600 transition"
    : isFitnessBoutique
    ? "text-sm font-medium text-[#3a2c20] hover:text-[#d36c3b] transition"
    : isDigitalCampus
    ? "text-sm font-semibold text-white hover:text-[#ffdd33] transition"
    : isBoutiqueStay
    ? "text-sm font-medium text-[#3a2a2a] hover:text-[#dd6fa4] transition"
    : isBuildCraft
    ? "text-sm font-semibold text-black hover:text-white transition"
    : "text-sm font-medium hover:underline";

  return (
    <div className="min-h-screen bg-background">
      {/* Store Disabled Banner */}
      {!company.isStoreEnabled && (
        <div className="bg-yellow-500 text-yellow-950 px-4 py-3 text-center font-medium">
          ⚠️ This store is currently disabled and only visible in preview mode
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-50 ${headerClass}`}>
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {headerLogo ? (
                <div className="relative h-8 w-[330px]">
                  <Image
                    src={headerLogo}
                    alt={company.name}
                    fill
                    className="object-contain"
                    sizes="230px"
                  />
                </div>
              ) : (
                <h1 className="text-2xl font-bold">{company.name}</h1>
              )}
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/store/${slug}`} className={linkClass}>
                Home
              </Link>
              <Link href={`/store/${slug}/products`} className={linkClass}>
                Products
              </Link>
              <Link href={`/store/${slug}/services`} className={linkClass}>
                Services
              </Link>
              <Link href={`/store/${slug}/login`} className={linkClass}>
                Login
              </Link>
              <Button
                size="sm"
                variant="outline"
                className={
                  isBlackFriday
                    ? "border-red-600 text-black hover:text-white hover:bg-red-600/10"
                    : isPrecisionCare
                    ? "border-teal-600 text-teal-700 hover:bg-teal-50 "
                    : ""
                }
                asChild
              >
                <Link href={`/store/${slug}/register`}>Register</Link>
              </Button>
              <Button
                size="sm"
                className={
                  isBlackFriday
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : isPrecisionCare
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : ""
                }
                asChild
              >
                <Link href={`/store/${slug}/cart`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Theme-based Content */}
      <ThemeRenderer
        sections={selectedTheme.sections}
        slug={slug}
        companyName={company.name}
        featuredProducts={serializedProducts}
        featuredServices={serializedServices}
        featuredTeamMembers={serializedTeamMembers}
        testimonials={testimonials}
        themeId={selectedTheme.id}
        storeBanner={company.storeBanner}
        storeMetadata={company.storeMetadata as StoreMetadata}
      />
    </div>
  );
}
