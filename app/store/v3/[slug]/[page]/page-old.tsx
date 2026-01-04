/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import type { V3Website, V3Section } from "@/lib/ai/v3-types";

// Helper function to validate image URLs against Next.js remotePatterns
function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    // Allowed domains from next.config.ts remotePatterns
    const allowedDomains = [
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "graph.microsoft.com",
      "platform-lookaside.fbsbx.com",
      "graph.facebook.com",
      "media.licdn.com",
      "images.unsplash.com",
      "avatar.vercel.sh",
      "encrypted-tbn0.gstatic.com",
      "robohash.org",
    ];
    return allowedDomains.includes(urlObj.hostname);
  } catch {
    return false;
  }
}

interface V3PageProps {
  params: Promise<{
    slug: string;
    page: string;
  }>;
}

export default async function V3DynamicPage({ params }: V3PageProps) {
  const { slug, page } = await params;

  // Find company by slug
  const company = await db.company.findUnique({
    where: { slug },
  });

  if (!company) {
    notFound();
  }

  // Find active V3 website
  const website = await db.storefrontWebsiteV3.findFirst({
    where: {
      companyId: company.id,
      isActive: true,
    },
  });

  if (!website) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Active Website</h1>
          <p className="text-muted-foreground">
            This company hasn&apos;t published a V3 website yet.
          </p>
        </div>
      </div>
    );
  }

  const websiteData = website.websiteData as V3Website;
  const currentPage = websiteData.pages.find((p) => p.slug === page);

  if (!currentPage) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a
              href={`/store/v3/${slug}`}
              className="text-2xl font-bold hover:text-primary transition-colors"
            >
              {company.name}
            </a>
            <div className="flex gap-6">
              {websiteData.navigation.primary.map((item, idx: number) => (
                <a
                  key={idx}
                  href={
                    item.slug === "home"
                      ? `/store/v3/${slug}`
                      : `/store/v3/${slug}/${item.slug}`
                  }
                  className={`hover:text-primary transition-colors ${
                    item.slug === page ? "text-primary font-semibold" : ""
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* SEO Metadata */}
      <title>{currentPage.seo.title}</title>
      <meta name="description" content={currentPage.seo.description} />

      {/* Page Content */}
      <main>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-8">
            {currentPage.headingHierarchy.h1}
          </h1>

          {currentPage.sections
            .sort((a: V3Section, b: V3Section) => a.order - b.order)
            .map((section: V3Section, idx: number) => {
              const content = section.content as any;
              return (
                <section
                  key={idx}
                  className="mb-16"
                  aria-label={section.accessibility.ariaLabel}
                >
                  <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
                  {section.subheading && (
                    <p className="text-lg text-muted-foreground mb-6">
                      {section.subheading}
                    </p>
                  )}

                  {/* Render content based on section type */}
                  {section.type === "about" && (
                    <div className="prose max-w-none">
                      {typeof content === "object" && content.description && (
                        <p>{content.description}</p>
                      )}
                    </div>
                  )}

                  {section.type === "contact" && (
                    <div className="space-y-6">
                      {/* Check if content has locations array */}
                      {content.locations && Array.isArray(content.locations) ? (
                        <div className="grid md:grid-cols-2 gap-8">
                          {content.locations.map(
                            (location: any, locIdx: number) => (
                              <div
                                key={locIdx}
                                className="border rounded-lg p-6 hover:shadow-lg transition-shadow"
                              >
                                <h3 className="font-semibold text-xl mb-2">
                                  {location.name}
                                </h3>
                                {location.type && (
                                  <p className="text-sm text-muted-foreground mb-4">
                                    {location.type}
                                  </p>
                                )}
                                <div className="space-y-2">
                                  {location.address && (
                                    <p className="text-sm">
                                      <strong>Address:</strong>
                                      <br />
                                      {location.address}
                                      <br />
                                      {[
                                        location.city,
                                        location.state,
                                        location.postalCode,
                                      ]
                                        .filter(Boolean)
                                        .join(", ")}
                                      {location.country && (
                                        <>
                                          <br />
                                          {location.country}
                                        </>
                                      )}
                                    </p>
                                  )}
                                  {location.phone && (
                                    <p className="text-sm">
                                      <strong>Phone:</strong>{" "}
                                      <a
                                        href={`tel:${location.phone}`}
                                        className="text-primary hover:underline"
                                      >
                                        {location.phone}
                                      </a>
                                    </p>
                                  )}
                                  {location.email && (
                                    <p className="text-sm">
                                      <strong>Email:</strong>{" "}
                                      <a
                                        href={`mailto:${location.email}`}
                                        className="text-primary hover:underline"
                                      >
                                        {location.email}
                                      </a>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        // Fallback for legacy single contact info
                        <div className="space-y-4">
                          {content.email && (
                            <p>
                              <strong>Email:</strong>{" "}
                              <a
                                href={`mailto:${content.email}`}
                                className="text-primary hover:underline"
                              >
                                {content.email}
                              </a>
                            </p>
                          )}
                          {content.phone && (
                            <p>
                              <strong>Phone:</strong>{" "}
                              <a
                                href={`tel:${content.phone}`}
                                className="text-primary hover:underline"
                              >
                                {content.phone}
                              </a>
                            </p>
                          )}
                          {content.address && (
                            <p>
                              <strong>Address:</strong> {content.address}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {section.type === "catalog" && Array.isArray(content) && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(Array.isArray(content) ? content : []).map(
                        (item, iIdx: number) => (
                          <div
                            key={iIdx}
                            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                          >
                            {isValidImageUrl(item.image) && (
                              <div className="relative w-full h-48">
                                <Image
                                  src={item.image}
                                  alt={item.imageAlt || item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="p-6">
                              <h3 className="font-semibold text-lg mb-2">
                                {item.name}
                              </h3>
                              <p className="text-muted-foreground mb-4">
                                {item.description}
                              </p>
                              {item.price && (
                                <p className="text-xl font-bold text-primary">
                                  ${item.price}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {section.type === "testimonials" &&
                    Array.isArray(content) && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {(Array.isArray(content) ? content : []).map(
                          (testimonial, tIdx: number) => (
                            <div key={tIdx} className="bg-muted p-6 rounded-lg">
                              <p className="italic mb-4">
                                &quot;{testimonial.quote}&quot;
                              </p>
                              <div className="flex items-center gap-4">
                                {isValidImageUrl(testimonial.photo) && (
                                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                                    <Image
                                      src={testimonial.photo}
                                      alt={testimonial.author}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold">
                                    {testimonial.author}
                                  </p>
                                  {testimonial.role && (
                                    <p className="text-sm text-muted-foreground">
                                      {testimonial.role}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {section.type === "faq" && Array.isArray(content) && (
                    <div className="space-y-4">
                      {(Array.isArray(content) ? content : []).map(
                        (faq, fIdx: number) => (
                          <div key={fIdx} className="border-b pb-4">
                            <h3 className="font-semibold mb-2">
                              {faq.question}
                            </h3>
                            <p className="text-muted-foreground">
                              {faq.answer}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Fallback: Display raw content */}
                  {![
                    "about",
                    "contact",
                    "catalog",
                    "testimonials",
                    "faq",
                  ].includes(section.type) && (
                    <div className="bg-muted p-4 rounded">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(content, null, 2)}
                      </pre>
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {company.name}. All rights reserved.
            </div>
            {websiteData.navigation.footer && (
              <div className="flex gap-6">
                {websiteData.navigation.footer.map((item, idx: number) => (
                  <a
                    key={idx}
                    href={`/store/v3/${slug}/${item.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
