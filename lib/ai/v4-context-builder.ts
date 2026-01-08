/**
 * V4 Context Builder
 *
 * Gathers comprehensive company data for AI to create truly unique designs
 */

import type { PrismaClient } from "@prisma/client";
import type { V4CompanyContext } from "./v4-types.ts";

export async function buildV4Context(
  companyId: string,
  db: PrismaClient
): Promise<V4CompanyContext> {
  // Fetch company with all relations
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      locations: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      staff: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          images: {
            orderBy: { order: "asc" },
          },
        },
      },
      services: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          images: {
            orderBy: { order: "asc" },
          },
        },
      },
      testimonials: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      storefrontPosts: {
        where: {
          status: "PUBLISHED",
          publishedAt: { lte: new Date() },
        },
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          heroImage: true,
          publishedAt: true,
        },
      },
      projects: {
        where: {
          isFeatured: true,
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          status: true,
          featuredImage: true,
          createdAt: true,
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
      },
    },
  });

  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // Calculate years in business
  const yearsInBusiness = company.createdAt
    ? new Date().getFullYear() - new Date(company.createdAt).getFullYear()
    : 0;

  // Customer insights (aggregated data only)
  // Note: Customer model may not exist in all implementations
  const totalCustomers = 0;
  const customerIndustries: Array<{ industry: string | null; _count: number }> =
    [];

  // Calculate average testimonial rating
  const testimonialRatings = company.testimonials
    .filter((t) => t.rating !== null)
    .map((t) => t.rating as number);
  const averageRating =
    testimonialRatings.length > 0
      ? testimonialRatings.reduce((a, b) => a + b, 0) /
        testimonialRatings.length
      : null;

  // Extract SEO keywords from company data
  const seoKeywords = extractSEOKeywords(company);

  // Debug: Log what data we have
  console.log("[V4 Context] Data loaded for company:", company.name);
  console.log("[V4 Context] Products:", company.products.length);
  console.log("[V4 Context] Services:", company.services.length);
  console.log("[V4 Context] Team/Staff:", company.staff.length);
  console.log("[V4 Context] Testimonials:", company.testimonials.length);
  console.log("[V4 Context] Blog posts:", company.storefrontPosts.length);
  console.log("[V4 Context] Projects:", company.projects.length);

  // Build comprehensive context
  const context: V4CompanyContext = {
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug || "",
      industry: company.industry,
      description: company.description,
      slogan: company.slogan,
      logo: company.logo,
      email: company.email,
      phone: company.phone,
      website: company.website,
      foundedYear: company.foundedYear,
      employeeCount: company.employeeCount,
    },

    locations: company.locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      address: {
        line1: loc.addressLine1,
        line2: loc.addressLine2,
        city: loc.city,
        state: loc.state,
        country: loc.country,
        postalCode: loc.postalCode,
      },
      phone: loc.phone,
      email: loc.email,
      hours: loc.hours,
      isPrimary: loc.isMain,
    })),

    team: company.staff.map((staff) => ({
      id: staff.id,
      name: staff.user.name || "Team Member",
      role: staff.role,
      bio: staff.bio,
      email: staff.user.email || null,
      phone: null,
      profileImage: staff.user.image,
      linkedin: null,
      twitter: null,
      specialties: [],
    })),

    products: company.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price ? Number(product.price) : null,
      compareAtPrice: null,
      sku: product.sku,
      inStock: true,
      featured: product.isFeatured,
      images: product.images.map((img) => ({
        url: img.url,
        alt: null,
      })),
      tags: [],
    })),

    services: company.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price ? Number(service.price) : null,
      duration: service.duration,
      featured: service.isFeatured,
      images: service.images.map((img) => ({
        url: img.url,
        alt: null,
      })),
      benefits: [],
    })),

    testimonials: company.testimonials.map((testimonial) => ({
      id: testimonial.id,
      customerName: testimonial.customerName,
      customerRole: testimonial.customerTitle,
      customerCompany: null,
      content: testimonial.testimonial,
      rating: testimonial.rating,
      image: testimonial.customerPhoto,
      date: testimonial.createdAt.toISOString(),
      featured: testimonial.isFeatured,
    })),

    customerInsights: {
      totalCustomers,
      topIndustries: customerIndustries.map((ci) => ({
        industry: ci.industry || "Other",
        count: ci._count,
      })),
      averageRating,
      repeatCustomerRate: null, // Would need order history to calculate
    },

    metrics: {
      yearsInBusiness,
      projectsCompleted: null, // Could be calculated from completed projects/orders
      satisfactionScore: averageRating,
      certifications: company.certifications
        ? (company.certifications as string[])
        : [],
      awards: company.awards ? (company.awards as string[]) : [],
    },

    socialProof: {
      instagramFollowers: company.instagramFollowers,
      facebookLikes: company.facebookLikes,
      linkedinFollowers: company.linkedinFollowers,
      youtubeSubscribers: company.youtubeSubscribers,
      trustpilotRating: company.trustpilotRating,
      googleRating: company.googleRating,
    },

    // Extract social media links from storeMetadata
    socialLinks: {
      facebook: (company.storeMetadata as any)?.socialLinks?.facebook || null,
      twitter: (company.storeMetadata as any)?.socialLinks?.twitter || null,
      instagram: (company.storeMetadata as any)?.socialLinks?.instagram || null,
      linkedin: (company.storeMetadata as any)?.socialLinks?.linkedin || null,
      youtube: (company.storeMetadata as any)?.socialLinks?.youtube || null,
    },

    gallery: [], // Could be extracted from product/service images

    blogPosts: company.storefrontPosts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      heroImage: post.heroImage,
      publishedAt: post.publishedAt?.toISOString() || null,
    })),

    projects: company.projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      category: project.category,
      status: project.status,
      featuredImage: project.featuredImage,
      client: project.customer?.name || project.subscriberCompany?.name || null,
      completedDate:
        project.status === "COMPLETED" ? project.createdAt.toISOString() : null,
      tags: project.category ? [project.category] : [],
    })),

    seoKeywords,
  };

  return context;
}

function extractSEOKeywords(company: {
  name: string;
  industry: string | null;
  description: string | null;
  products?: Array<{ category: string | null }>;
  services?: Array<{ category: string | null }>;
  locations?: Array<{ city: string }>;
}): string[] {
  const keywords = new Set<string>();

  // Add company name
  if (company.name) {
    keywords.add(company.name.toLowerCase());
  }

  // Add industry
  if (company.industry) {
    keywords.add(company.industry.toLowerCase());
  }

  // Extract from description
  if (company.description) {
    const words = company.description
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 4); // Only meaningful words
    words.slice(0, 10).forEach((w) => keywords.add(w));
  }

  // Add product/service categories
  company.products?.forEach((p) => {
    if (p.category) keywords.add(p.category.toLowerCase());
  });
  company.services?.forEach((s) => {
    if (s.category) keywords.add(s.category.toLowerCase());
  });

  // Add location cities
  company.locations?.forEach((l) => {
    if (l.city) keywords.add(l.city.toLowerCase());
  });

  return Array.from(keywords).slice(0, 20);
}
