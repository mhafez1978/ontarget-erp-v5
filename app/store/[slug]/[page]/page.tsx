import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import StorefrontLayout from "@/components/storefront/storefront-layout";
import { extractBodyContent } from "@/lib/storefront/html-utils";
import { computeHeaderLinks } from "@/lib/storefront/header-utils";
import type { V4Website } from "@/lib/ai/v4-types";
import ContactForm from "@/components/storefront/contact-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug?: string; page?: string }>;
};

export default async function StorefrontInnerPage({ params }: PageProps) {
  const { slug, page } = await params;
  if (!slug || !page) notFound();

  const companyCheck = await db.company.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!companyCheck) notFound();

  const activeV4Website = await db.v4Website.findFirst({
    where: { companyId: companyCheck.id, isActive: true },
    orderBy: { publishedAt: "desc" },
  });
  if (!activeV4Website) notFound();

  const websiteData =
    (activeV4Website.websiteData as unknown as V4Website) || null;
  if (!websiteData) notFound();

  // Build pages + fallbacks similar to root renderer
  const pages = Array.isArray(websiteData?.pages) ? websiteData.pages : [];

  // Add simple Contact fallback if absent
  const companyMeta = await db.company.findUnique({
    where: { id: companyCheck.id },
    select: { name: true, email: true, phone: true },
  });

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
          componentCode: `<section class=\"py-12\"><div class=\"container mx-auto\"><div id=\"contact-root\"></div></div></section>`,
          metadata: {
            name: "ContactFallback",
            description: "Contact fallback",
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

  // Find requested page
  const pageSlug = String(page).toLowerCase();
  const found = pages.find(
    (p) =>
      (p.slug || "").toLowerCase() === pageSlug ||
      (p.name || "").toLowerCase() === pageSlug
  );
  if (!found) notFound();

  // global styles from design system
  const globalStyles = websiteData?.globalStyles || "";
  const aiMetaFromV4 = websiteData?.designSystem
    ? {
        primaryColor: websiteData.designSystem.colors?.primary,
        secondaryColor: websiteData.designSystem.colors?.secondary,
        accentColor: websiteData.designSystem.colors?.accent,
        backgroundColor: websiteData.designSystem.colors?.background,
        textColor: websiteData.designSystem.colors?.foreground,
      }
    : null;

  // header links
  const postsCount = await db.storefrontPost.count({
    where: { companyId: companyCheck.id, status: "PUBLISHED" },
  });
  const headerLinksToPass = computeHeaderLinks(slug, postsCount);

  return (
    <StorefrontLayout
      slug={slug}
      companyName={companyMeta?.name || ""}
      headerLinks={headerLinksToPass}
      aiMeta={aiMetaFromV4}
      isStoreEnabled={true}
      storeBlogEnabled={false}
      renderHero={false}
    >
      {globalStyles ? (
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      ) : null}

      <div className="w-full py-8">
        {/* Contact page special-casing: render React ContactForm into the page */}
        {pageSlug === "contact" ? (
          <div className="container mx-auto px-4">
            <ContactForm slug={slug} />
          </div>
        ) : (
          // For other pages, render components' HTML
          <div>
            {found.components?.map((comp, idx) => {
              let html = (comp as { componentCode?: string }).componentCode || "";
              html = extractBodyContent(html);

              // Basic anchor normalizations
              try {
                html = html.replace(/href=\"#\"/gi, `href=\"/store/${slug}\"`);
              } catch (e) {
                // noop
              }

              return (
                <div key={idx} dangerouslySetInnerHTML={{ __html: html }} />
              );
            })}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
