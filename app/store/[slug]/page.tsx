import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { defaultThemes, type ThemeSection } from "@/lib/storefront-themes";
import { ThemeRenderer } from "@/components/storefront/theme-renderer";
import StorefrontLayout from "@/components/storefront/storefront-layout";
import { AiStorefrontRenderer } from "@/components/storefront/ai-storefront-renderer";
import { AiStorefrontRendererV2 } from "@/components/storefront/v2/ai-storefront-renderer-v2";
import { ChatWidget } from "@/components/storefront/chat-widget";
import type { Metadata } from "next";
import type { V4Website } from "@/lib/ai/v4-types";

// V4 component type alias (individual page components)
type V4Component = import("@/lib/ai/v4-types").V4Page["components"][number];
import {
  aiFrontstoreSpecSchema,
  type AiFrontstoreSpec,
} from "@/lib/ai/ai-storefront-types";
import { extractBodyContent } from "@/lib/storefront/html-utils";
import { computeHeaderLinks } from "@/lib/storefront/header-utils";

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
    include: {
      locations: {
        select: {
          id: true,
          name: true,
          type: true,
          isMain: true,
          latitude: true,
          longitude: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
          phone: true,
          email: true,
        },
      },
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

    // Fetch company locations (multi-location support)
    locations: await db.companyLocation.findMany({
      where: { companyId: company.id },
      orderBy: [{ isMain: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        type: true,
        isMain: true,
        latitude: true,
        longitude: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        email: true,
      },
    }),
  };
}

export default async function StorefrontPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  // Check if company has an active V4 or V3 website. Prefer V4 (no version exposing in public URL)
  const companyCheck = await db.company.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (companyCheck) {
    // Prefer active V4 website if exists
    const activeV4Website = await db.v4Website.findFirst({
      where: {
        companyId: companyCheck.id,
        isActive: true,
      },
      orderBy: { publishedAt: "desc" },
    });

    if (activeV4Website) {
      // Render the published V4 website directly at /store/:slug (do not expose version in URL)
      const websiteData =
        (activeV4Website.websiteData as unknown as V4Website) || null;

      // Fetch company details so we can show branding in header
      const companyMeta = await db.company.findUnique({
        where: { id: companyCheck.id },
        select: {
          name: true,
          slug: true,
          logo: true,
          logoLight: true,
          logoDark: true,
          storeBanner: true,
          email: true,
          phone: true,
        },
      });

      // Count products/services for conditional page logic
      const productCount = await db.product.count({
        where: {
          companyId: companyCheck.id,
          isPublished: true,
          isActive: true,
        },
      });

      // Count projects so we can decide what CTAs should link to
      const projectCount = await db.project.count({
        where: { subscriberCompanyId: companyCheck.id },
      });

      // Work with the canonical V4 page type
      // pages are expected to be V4Page[] when present in the V4 website payload
      let pages = Array.isArray(websiteData?.pages)
        ? (websiteData.pages as import("@/lib/ai/v4-types").V4Page[])
        : [];

      // Filter out empty pages and products page when there are no products
      pages = pages.filter((p) => {
        if (!p || !Array.isArray(p.components) || p.components.length === 0)
          return false;
        const slugLike = (p.slug || p.name || "").toLowerCase();
        if (slugLike.includes("product") && productCount === 0) return false;
        return true;
      });

      // Sanitize names (remove seasonal labels)
      pages = pages.map((p) => {
        if (p && typeof p.name === "string") {
          p.name = p.name.replace(/black\s*-?\s*friday/gi, "").trim();
          if (!p.name) p.name = "Services";
        }
        return p;
      });

      // If there is no Contact page but company has contact info, add a simple Contact V4 page
      const hasContact = pages.some(
        (p) =>
          (p.slug || "").toLowerCase().includes("contact") ||
          (p.name || "").toLowerCase().includes("contact")
      );
      if (!hasContact && (companyMeta?.email || companyMeta?.phone)) {
        pages.push({
          slug: "contact",
          name: "Contact",
          components: [
            {
              id: `contact-fallback-${companyCheck.id}`,
              order: 0,
              componentCode: `<section class=\"py-12 bg-white\"><div class=\"container mx-auto\"><h2 class=\"text-2xl font-semibold\">Contact Us</h2><p class=\"mt-2\">Reach out at <a href=\"mailto:${
                companyMeta?.email || ""
              }\">${companyMeta?.email || ""}</a> or call ${
                companyMeta?.phone || ""
              }.</p></div></section>`,
              metadata: {
                name: "ContactFallback",
                description: "Contact fallback section",
                props: {},
                dependencies: [],
              },
            },
          ],
          seo: {
            title: "Contact",
            description: `Contact ${companyMeta?.name || ""}`,
            keywords: [],
            ogImage: null,
            canonicalUrl: null,
            structuredData: [],
          },
        });
      }

      // If there is no testimonials page but we have testimonials in DB, add one
      const testimonialCount = await db.testimonial.count({
        where: { companyId: companyCheck.id, status: "APPROVED" },
      });
      const hasTestimonials = pages.some(
        (p) =>
          (p.slug || "").toLowerCase().includes("testimonial") ||
          (p.name || "").toLowerCase().includes("testimonial")
      );
      if (!hasTestimonials && testimonialCount > 0) {
        const approved = await db.testimonial.findMany({
          where: { companyId: companyCheck.id, status: "APPROVED" },
          take: 6,
          orderBy: { createdAt: "desc" },
        });
        const itemsHtml = approved
          .map(
            (t) =>
              `<blockquote class=\"p-4 bg-white rounded-lg shadow-sm\"><p class=\"font-medium\">${(
                t.testimonial || ""
              ).replace(
                /</g,
                "&lt;"
              )}</p><footer class=\"mt-2 text-sm text-muted-foreground\">— ${
                t.customerName || ""
              }</footer></blockquote>`
          )
          .join("\n");
        pages.push({
          slug: "testimonials",
          name: "Testimonials",
          components: [
            {
              id: `testimonials-${companyCheck.id}`,
              order: 0,
              componentCode: `<section class=\"py-12 bg-gradient-to-r from-gray-50 to-white\"><div class=\"container mx-auto\"><h2 class=\"text-2xl font-semibold\">What our customers say</h2><div class=\"mt-4 grid grid-cols-1 md:grid-cols-2 gap-4\">${itemsHtml}</div></div></section>`,
              metadata: {
                name: "TestimonialsFallback",
                description: "Testimonials fallback section",
                props: {},
                dependencies: [],
              },
            },
          ],
          seo: {
            title: "Testimonials",
            description: `What our customers say about ${
              companyMeta?.name || ""
            }`,
            keywords: [],
            ogImage: null,
            canonicalUrl: null,
            structuredData: [],
          },
        });
      }

      // Determine first page
      const firstPage = pages.length > 0 ? pages[0] : null;

      // Inject global styles from design system if present
      const globalStyles = websiteData?.globalStyles || "";

      // Map the V4 design system to our AiMeta shape expected by StorefrontLayout
      const aiMetaFromV4 = websiteData?.designSystem
        ? {
            primaryColor: websiteData.designSystem.colors?.primary,
            secondaryColor: websiteData.designSystem.colors?.secondary,
            accentColor: websiteData.designSystem.colors?.accent,
            backgroundColor: websiteData.designSystem.colors?.background,
            textColor: websiteData.designSystem.colors?.foreground,
          }
        : null;

      // Fetch small datasets we may need for fallbacks
      const featuredTeamMembers = await db.companyStaff.findMany({
        where: {
          companyId: companyCheck.id,
          status: "ACTIVE",
        },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: [{ displayOrder: "asc" }, { hireDate: "asc" }],
      });

      const featuredProjectsPrimary = await db.project.findMany({
        where: { subscriberCompanyId: companyCheck.id },
        select: {
          id: true,
          name: true,
          description: true,
          featuredImage: true,
          startDate: true,
        },
        take: 6,
        orderBy: { startDate: "desc" },
      });

      const featuredProjects =
        featuredProjectsPrimary.length > 0 ? featuredProjectsPrimary : [];

      let headerLinksToPass: Array<{ label: string; href: string }> | null =
        null;
      try {
        const postsCount = await db.storefrontPost.count({
          where: { companyId: companyCheck.id, status: "PUBLISHED" },
        });

        headerLinksToPass = computeHeaderLinks(slug, postsCount);
      } catch (e) {
        console.error("Failed to compute storefront header links", e);
        headerLinksToPass = null;
      }

      // Add About page fallback when missing
      const hasAbout = pages.some((p) =>
        (p.slug || "").toLowerCase().includes("about")
      );
      if (!hasAbout) {
        pages.push({
          slug: "about",
          name: "About",
          components: [
            {
              id: `about-fallback-${companyCheck.id}`,
              order: 0,
              componentCode: `<section class="py-12 bg-white"><div class="container mx-auto"><h2 class="text-2xl font-semibold">About ${
                companyMeta?.name || ""
              }</h2><p class="mt-4">${
                (companyMeta?.name || "") +
                " is a digital agency focused on web design and e-commerce. We help businesses expand their online presence."
              }</p></div></section>`,
              metadata: {
                name: "AboutFallback",
                description: "About fallback section",
                props: {},
                dependencies: [],
              },
            },
          ],
          seo: {
            title: "About",
            description: `About ${companyMeta?.name || ""}`,
            keywords: [],
            ogImage: null,
            canonicalUrl: null,
            structuredData: [],
          },
        });
      }

      // Add Team page fallback when team members exist
      const hasTeam = pages.some(
        (p) =>
          (p.slug || "").toLowerCase().includes("team") ||
          (p.name || "").toLowerCase().includes("team")
      );
      if (
        !hasTeam &&
        Array.isArray(featuredTeamMembers) &&
        featuredTeamMembers.length > 0
      ) {
        const membersHtml = featuredTeamMembers
          .map(
            (m) =>
              `<div class="p-4"><h4 class="font-medium">${
                m.user?.name || "Team Member"
              }</h4><p class="text-sm text-muted-foreground">${
                m.jobTitle || ""
              }</p></div>`
          )
          .join("");
        pages.push({
          slug: "team",
          name: "Meet the Team",
          components: [
            {
              id: `team-fallback-${companyCheck.id}`,
              order: 0,
              componentCode: `<section class="py-12 bg-white"><div class="container mx-auto"><h2 class="text-2xl font-semibold">Meet the Team</h2><div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">${membersHtml}</div></div></section>`,
              metadata: {
                name: "TeamFallback",
                description: "Team fallback",
                props: {},
                dependencies: [],
              },
            },
          ],
          seo: {
            title: "Meet the Team",
            description: `The team at ${companyMeta?.name || ""}`,
            keywords: [],
            ogImage: null,
            canonicalUrl: null,
            structuredData: [],
          },
        });
      }

      // Add Portfolio page fallback when projects exist
      const hasPortfolio = pages.some(
        (p) =>
          (p.slug || "").toLowerCase().includes("portfolio") ||
          (p.name || "").toLowerCase().includes("portfolio") ||
          (p.slug || "").toLowerCase().includes("projects")
      );
      if (!hasPortfolio && projectCount > 0) {
        const projectsHtml = featuredProjects
          .map(
            (pr) =>
              `<div class="p-4"><h4 class="font-medium">${
                pr.name
              }</h4><p class="text-sm">${(pr.description || "").slice(
                0,
                120
              )}</p></div>`
          )
          .join("");
        pages.push({
          slug: "portfolio",
          name: "Portfolio",
          components: [
            {
              id: `portfolio-fallback-${companyCheck.id}`,
              order: 0,
              componentCode: `<section class="py-12 bg-white"><div class="container mx-auto"><h2 class="text-2xl font-semibold">Portfolio</h2><div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">${projectsHtml}</div></div></section>`,
              metadata: {
                name: "PortfolioFallback",
                description: "Portfolio fallback",
                props: {},
                dependencies: [],
              },
            },
          ],
          seo: {
            title: "Portfolio",
            description: `Recent projects from ${companyMeta?.name || ""}`,
            keywords: [],
            ogImage: null,
            canonicalUrl: null,
            structuredData: [],
          },
        });
      }

      return (
        <StorefrontLayout
          slug={slug}
          companyName={companyMeta?.name || ""}
          logo={companyMeta?.logo || null}
          logoLight={companyMeta?.logoLight || null}
          logoDark={companyMeta?.logoDark || null}
          storeBanner={companyMeta?.storeBanner || null}
          storeMetadata={null}
          aiMeta={aiMetaFromV4}
          isStoreEnabled={true}
          storeBlogEnabled={false}
          renderHero={false}
          headerLinks={headerLinksToPass}
          hideProducts={productCount === 0}
          showFeedbackCTA={hasContact}
          feedbackHref={
            hasContact ? "#contact" : `/store/${slug}/contact#testimonial`
          }
        >
          {/* Inject generated global styles to ensure design system is applied and full-bleed backgrounds work */}
          {globalStyles ? (
            <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
          ) : null}

          {/* Render each component's HTML for the first page (full-bleed wrapper) */}
          {firstPage ? (
            <div className="w-full py-0">
              {firstPage.components?.map((comp, idx) => {
                // Use canonical V4 componentCode and sanitize problematic CTAs
                let html = (comp as V4Component).componentCode || "";

                // If the component contains a full HTML document, extract only the inner <body> contents
                // Use shared util to ensure consistent behavior and make this testable
                html = extractBodyContent(html);

                // NOTE: we use the shared util to strip full HTML documents from generated
                // component output (doctype/html/head/body) so we only inject inner markup
                // into the storefront. This avoids nested <html> and <body> tags which can
                // produce non-deterministic client-side mutations and hydration mismatches.
                // If portfolio/projects are absent, rewrite #portfolio or /portfolio links to contact
                if (
                  !Array.isArray(websiteData?.pages) ||
                  websiteData.pages.length === 0
                ) {
                  // no-op
                }

                // If there are no projects, replace in-page portfolio anchors with contact anchor
                if (Array.isArray(websiteData?.pages)) {
                  const hasProjects = projectCount > 0; // derived from DB
                  if (!hasProjects) {
                    html = html.replace(
                      /href=\"#portfolio\"/gi,
                      'href="#contact"'
                    );
                    html = html.replace(
                      /href=\"\/portfolio\"/gi,
                      'href="/contact"'
                    );
                    html = html.replace(
                      /href=\"#projects\"/gi,
                      'href="#contact"'
                    );
                  }
                }

                // Final HTML normalizations before injection (footer links, canonical anchors)
                try {
                  // map common empty anchors to canonical storefront pages
                  html = html.replace(
                    /<a([^>]*?)href=(['"])#\2([^>]*?)>\s*(About Us|About)\s*<\/a>/gi,
                    `<a$1href="/store/${slug}/about"$3>$4</a>`
                  );
                  html = html.replace(
                    /<a([^>]*?)href=(['"])#\2([^>]*?)>\s*(Our Portfolio|Portfolio|Projects)\s*<\/a>/gi,
                    `<a$1href="/store/${slug}/portfolio"$3>$4</a>`
                  );
                  html = html.replace(
                    /<a([^>]*?)href=(['"])#\2([^>]*?)>\s*(Testimonials|Reviews)\s*<\/a>/gi,
                    `<a$1href="/store/${slug}/testimonials"$3>$4</a>`
                  );
                } catch (e) {
                  // Non-essential normalization; swallow errors
                  console.debug("HTML footer normalization failed", e);
                }

                return (
                  <div
                    key={idx}
                    className="w-full"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              })}

              {/* Chat widget: prefer structured config (mount client widget) when available, otherwise render legacy HTML fallback */}
              {websiteData?.chatWidget?.config ? (
                // ChatWidget is a client component; render it with config
                <div key="v4-chat-widget-client">
                  <ChatWidget
                    companySlug={companyMeta?.slug || slug}
                    companyId={companyCheck.id}
                    companyName={companyMeta?.name || ""}
                    config={websiteData.chatWidget.config}
                    mountInside={false}
                  />
                </div>
              ) : websiteData?.chatWidget?.html ? (
                <div
                  key="v4-chat-widget-html"
                  dangerouslySetInnerHTML={{
                    __html: websiteData.chatWidget.html,
                  }}
                />
              ) : null}
            </div>
          ) : (
            <div className="w-full py-8 text-center">
              <p>No published content available.</p>
            </div>
          )}
        </StorefrontLayout>
      );
    }

    // If no active V4 site, fallback to existing V3 redirect behavior
    const activeV3Website = await db.storefrontWebsiteV3.findFirst({
      where: {
        companyId: companyCheck.id,
        isActive: true,
      },
      select: { id: true },
    });

    if (activeV3Website) {
      // Redirect to V3 preview
      redirect(`/store/v3/${slug}`);
    }
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
    // zod schema expects optional string (undefined) rather than explicit null
    client:
      project.customer?.name ?? project.subscriberCompany?.name ?? undefined,
    category: project.category
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" "),
    description: project.description ?? undefined,
    image: project.featuredImage ?? undefined,
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
            locations={company.locations ?? []}
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
        storeMetadata={company.storeMetadata as unknown as StoreMetadata | null}
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
          locations={data.locations}
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
      storeMetadata={company.storeMetadata as unknown as StoreMetadata | null}
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
        storeMetadata={company.storeMetadata as unknown as StoreMetadata | null}
        posts={posts}
      />
    </StorefrontLayout>
  );
}
