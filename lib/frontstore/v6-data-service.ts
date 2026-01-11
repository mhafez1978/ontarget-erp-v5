/**
 * V6 Data Service - Real Data Integration
 *
 * Pulls actual company data from database tables to use in section generation.
 * No hallucinations - only real data or static fallbacks.
 */

import { db } from "@/lib/db";
import type {
  Company,
  Product,
  Service,
  Testimonial,
  CompanyStaff,
} from "@prisma/client";

// ============================================================================
// TYPES
// ============================================================================

export interface V6CompanyContext {
  company: {
    id: string;
    name: string;
    slug: string;
    industry: string | null;
    description: string | null;
    slogan: string | null;
    logo: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    foundedYear: number | null;
    employeeCount: number | null;
  };
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    images: string[];
    category: string | null;
    inStock: boolean;
  }>;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    duration: string | null;
    category: string | null;
  }>;
  testimonials: Array<{
    id: string;
    customerName: string;
    content: string;
    rating: number | null;
    position: string | null;
    companyName: string | null;
    photo: string | null;
  }>;
  team: Array<{
    id: string;
    name: string;
    role: string | null;
    bio: string | null;
    photo: string | null;
    email: string | null;
  }>;
  stats: {
    totalProducts: number;
    totalServices: number;
    totalTestimonials: number;
    totalTeamMembers: number;
    totalLocations: number;
    hasEcommerce: boolean;
    hasBooking: boolean;
  };
}

// ============================================================================
// MAIN FUNCTION - GET COMPANY CONTEXT
// ============================================================================

export async function getCompanyContext(
  companyId: string
): Promise<V6CompanyContext> {
  // Fetch company profile
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      description: true,
      slogan: true,
      logo: true,
      phone: true,
      email: true,
      website: true,
      foundedYear: true,
      employeeCount: true,
    },
  });

  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }

  // Fetch products (active only)
  const productsRaw = await db.product.findMany({
    where: {
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      images: {
        select: {
          url: true,
        },
      },
      category: true,
      quantity: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20, // Limit for performance
  });

  const products = productsRaw.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price ? parseFloat(p.price.toString()) : null,
    images: p.images.map((img) => img.url),
    category: p.category,
    inStock: p.quantity > 0,
  }));

  // Fetch services (active only)
  const servicesRaw = await db.service.findMany({
    where: {
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      duration: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const services = servicesRaw.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price ? parseFloat(s.price.toString()) : null,
    duration: s.duration,
    category: s.category,
  }));

  // Fetch testimonials (approved + featured only)
  const testimonialsRaw = await db.testimonial.findMany({
    where: {
      companyId,
      status: "APPROVED",
      isFeatured: true,
    },
    select: {
      id: true,
      customerName: true,
      testimonial: true,
      rating: true,
      customerTitle: true,
      customerPhoto: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const testimonials = testimonialsRaw.map((t) => ({
    id: t.id,
    customerName: t.customerName,
    content: t.testimonial,
    rating: t.rating,
    position: t.customerTitle,
    companyName: null, // Not in schema
    photo: t.customerPhoto,
  }));

  // Fetch team members (active only)
  const teamRaw = await db.companyStaff.findMany({
    where: {
      companyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      jobTitle: true,
      role: true,
      bio: true,
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 15,
  });

  const team = teamRaw.map((m) => ({
    id: m.id,
    name: m.user.name || "Team Member",
    role: m.jobTitle || m.role,
    bio: m.bio,
    photo: m.user.image,
    email: m.user.email,
  }));

  // Calculate stats
  const stats = {
    totalProducts: products.length,
    totalServices: services.length,
    totalTestimonials: testimonials.length,
    totalTeamMembers: team.length,
    totalLocations: 0,
    hasEcommerce: products.length > 0,
    hasBooking: services.some((s) => s.duration !== null),
  };

  return {
    company: {
      ...company,
      slug: company.slug || company.id, // Use ID as fallback if slug is null
    },
    products,
    services,
    testimonials,
    team,
    stats,
  };
}

// ============================================================================
// FALLBACK GENERATORS (for companies with minimal data)
// ============================================================================

export function generateFallbackHeroContent(context: V6CompanyContext): {
  headline: string;
  subheadline: string;
  ctaText: string;
} {
  const { company, stats } = context;
  const industry = company.industry || "business";

  // Generate industry-appropriate headline
  let headline = `Welcome to ${company.name}`;
  if (stats.hasEcommerce) {
    headline = `Discover Premium ${industry} Solutions`;
  } else if (stats.hasBooking) {
    headline = `Expert ${industry} Services`;
  } else if (company.slogan) {
    headline = company.slogan;
  }

  // Generate subheadline
  let subheadline =
    company.description || `Professional ${industry} services you can trust.`;
  if (stats.totalProducts > 0) {
    subheadline = `Browse ${stats.totalProducts}+ premium products`;
  } else if (stats.totalServices > 0) {
    subheadline = `${stats.totalServices}+ services to transform your business`;
  }

  // Generate CTA
  let ctaText = "Get Started";
  if (stats.hasEcommerce) {
    ctaText = "Shop Now";
  } else if (stats.hasBooking) {
    ctaText = "Book Appointment";
  }

  return { headline, subheadline, ctaText };
}

export function generateFallbackServicesContent(
  context: V6CompanyContext
): Array<{
  title: string;
  description: string;
  price?: string;
}> {
  const { services, company } = context;

  // If we have real services, use them
  if (services.length > 0) {
    return services.slice(0, 6).map((s) => ({
      title: s.name,
      description:
        s.description || `Professional ${s.name.toLowerCase()} service`,
      price: s.price ? `$${s.price}` : undefined,
    }));
  }

  // Generate industry-specific fallback services
  const industry = (company.industry || "").toLowerCase();
  const fallbacks: Record<
    string,
    Array<{ title: string; description: string }>
  > = {
    "web design": [
      {
        title: "Website Design",
        description:
          "Custom, responsive website design that converts visitors into customers",
      },
      {
        title: "E-commerce Solutions",
        description:
          "Build powerful online stores with seamless checkout experiences",
      },
      {
        title: "SEO Optimization",
        description: "Rank higher in search results and drive organic traffic",
      },
    ],
    restaurant: [
      {
        title: "Dine-In Experience",
        description:
          "Fresh, locally-sourced ingredients prepared by expert chefs",
      },
      {
        title: "Catering Services",
        description: "Full-service catering for events of any size",
      },
      {
        title: "Private Events",
        description: "Host your next celebration in our private dining space",
      },
    ],
    default: [
      {
        title: "Consultation",
        description: "Expert guidance tailored to your specific needs",
      },
      {
        title: "Implementation",
        description: "Professional service delivery with attention to detail",
      },
      {
        title: "Support",
        description: "Ongoing support to ensure your success",
      },
    ],
  };

  const selected =
    fallbacks[industry] ||
    fallbacks[
      Object.keys(fallbacks).find((k) => industry.includes(k)) || "default"
    ] ||
    fallbacks.default;

  return selected;
}

export function generateFallbackTestimonials(context: V6CompanyContext): Array<{
  name: string;
  content: string;
  rating: number;
  position?: string;
}> {
  const { testimonials, company } = context;

  // If we have real testimonials, use them
  if (testimonials.length > 0) {
    return testimonials.slice(0, 3).map((t) => ({
      name: t.customerName,
      content: t.content,
      rating: t.rating || 5,
      position: t.position || undefined,
    }));
  }

  // Generate industry-appropriate fallback testimonials
  const companyName = company.name;
  return [
    {
      name: "Sarah Johnson",
      content: `Working with ${companyName} has been transformative for our business. Their professionalism and expertise are unmatched.`,
      rating: 5,
      position: "CEO, Tech Solutions Inc",
    },
    {
      name: "Michael Chen",
      content: `The team at ${companyName} delivered beyond our expectations. Highly recommend their services!`,
      rating: 5,
      position: "Director of Operations",
    },
    {
      name: "Emily Rodriguez",
      content: `Exceptional quality and outstanding customer service. ${companyName} sets the standard in the industry.`,
      rating: 5,
      position: "Marketing Manager",
    },
  ];
}

// ============================================================================
// STOREFRONT MODE DETECTION
// ============================================================================

export function detectStorefrontMode(context: V6CompanyContext): {
  mode: "ecommerce" | "booking" | "restaurant" | "catalog" | "portfolio";
  confidence: number;
} {
  const { stats, company, services, products } = context;
  const industry = (company.industry || "").toLowerCase();

  // Restaurant detection
  if (
    industry.includes("restaurant") ||
    industry.includes("food") ||
    industry.includes("cafe")
  ) {
    return { mode: "restaurant", confidence: 0.95 };
  }

  // E-commerce detection
  if (
    stats.hasEcommerce &&
    products.length > 5 &&
    products.some((p) => p.price !== null)
  ) {
    return { mode: "ecommerce", confidence: 0.9 };
  }

  // Booking detection
  if (
    stats.hasBooking &&
    services.some((s) => s.duration !== null && s.price !== null)
  ) {
    return { mode: "booking", confidence: 0.85 };
  }

  // Catalog (products but no pricing)
  if (products.length > 0 && !products.some((p) => p.price !== null)) {
    return { mode: "catalog", confidence: 0.7 };
  }

  // Portfolio (web design, creative agencies)
  if (
    industry.includes("design") ||
    industry.includes("agency") ||
    industry.includes("creative")
  ) {
    return { mode: "portfolio", confidence: 0.8 };
  }

  // Default to catalog
  return { mode: "catalog", confidence: 0.5 };
}
