/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/lib/db";
import type { V3Website, V3Section } from "@/lib/ai/v3-types";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CartIcon } from "@/components/cart-icon";

// Helper function to validate image URLs against Next.js remotePatterns
function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
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

// Helper to extract primary color for dynamic styling
function getPrimaryColor(brandColors: string[] | undefined): string {
  return brandColors?.[0] || "#7C3AED";
}

// Helper to extract secondary color
function getSecondaryColor(brandColors: string[] | undefined): string {
  return brandColors?.[1] || "#065F46";
}

interface V3PageProps {
  params: Promise<{
    slug: string;
    page: string;
  }>;
}

export default async function V3DynamicPage({ params }: V3PageProps) {
  const { slug, page } = await params;

  const company = await db.company.findUnique({
    where: { slug },
    include: {
      staff: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!company) {
    notFound();
  }

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
          <p className="dark:text-gray-200">
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
      {/* Navigation with brand colors */}
      <nav
        className="border-b sticky top-0 bg-white/95 backdrop-blur-sm z-50 shadow-sm"
        style={{
          borderBottomColor: getPrimaryColor(websiteData.brand?.colors),
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a
              href={`/store/v3/${slug}`}
              className="text-2xl font-bold hover:opacity-70 transition-opacity"
              style={{ color: getPrimaryColor(websiteData.brand?.colors) }}
            >
              {company.name}
            </a>
            <div className="hidden md:flex gap-6 items-center">
              {websiteData.navigation.primary.map((item, idx: number) => (
                <a
                  key={idx}
                  href={
                    item.slug === "home"
                      ? `/store/v3/${slug}`
                      : `/store/v3/${slug}/${item.slug}`
                  }
                  className="hover:opacity-70 transition-opacity font-medium"
                  style={{
                    color:
                      item.slug === page
                        ? getPrimaryColor(websiteData.brand?.colors)
                        : "inherit",
                  }}
                >
                  {item.label}
                </a>
              ))}
              <CartIcon
                companySlug={company.slug || ""}
                companyId={company.id}
                primaryColor={getPrimaryColor(websiteData.brand?.colors)}
              />
            </div>
            <div className="md:hidden flex items-center gap-2">
              <CartIcon
                companySlug={company.slug || ""}
                companyId={company.id}
                primaryColor={getPrimaryColor(websiteData.brand?.colors)}
              />
              <button className="p-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div
        className="py-20 text-center"
        style={{
          background: `linear-gradient(135deg, ${getPrimaryColor(
            websiteData.brand?.colors
          )}15, ${getSecondaryColor(websiteData.brand?.colors)}15)`,
        }}
      >
        <div className="container mx-auto px-4">
          <h1
            className="text-5xl md:text-6xl font-black mb-4"
            style={{ color: getPrimaryColor(websiteData.brand?.colors) }}
          >
            {currentPage.pageName}
          </h1>
          {currentPage.seo.description && (
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              {currentPage.seo.description}
            </p>
          )}
        </div>
      </div>

      {/* Page Content - Same renderer as home page */}
      <main>
        {currentPage.sections
          .sort((a: V3Section, b: V3Section) => a.order - b.order)
          .filter((section: V3Section) => {
            // Don't show location sections on non-contact pages
            if (
              currentPage.slug !== "contact" &&
              section.content &&
              (section.content as any).locations
            ) {
              return false;
            }
            return true;
          })
          .map((section: V3Section, idx: number) => {
            const content = section.content as any;
            const primaryColor = getPrimaryColor(websiteData.brand?.colors);
            const secondaryColor = getSecondaryColor(websiteData.brand?.colors);

            return (
              <section
                key={idx}
                className={`py-20 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                aria-label={section.accessibility.ariaLabel}
              >
                <div className="container mx-auto px-4">
                  {/* All section types - copy from home page */}
                  {section.type === "about" && (
                    <div className="max-w-5xl mx-auto">
                      <div className="grid md:grid-cols-2 gap-12 items-center">
                        {isValidImageUrl(content.image) && (
                          <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                              src={content.image}
                              alt={
                                section.accessibility.altText || "About image"
                              }
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h2
                            className="text-4xl md:text-5xl font-bold mb-6"
                            style={{ color: primaryColor }}
                          >
                            {section.heading}
                          </h2>
                          {section.subheading && (
                            <p className="text-xl text-gray-600 mb-6">
                              {section.subheading}
                            </p>
                          )}
                          <div className="prose prose-lg text-gray-700 leading-relaxed">
                            {content.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.type === "catalog" && (
                    <div className="max-w-7xl mx-auto">
                      <div className="text-center mb-20">
                        <p
                          className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-70"
                          style={{ color: primaryColor }}
                        >
                          What We Offer
                        </p>
                        <h2
                          className="text-5xl md:text-6xl font-black mb-6"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                            {section.subheading}
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {(content.items || []).map(
                          (item: any, iIdx: number) => (
                            <div
                              key={iIdx}
                              className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100"
                            >
                              {isValidImageUrl(item.image) && (
                                <div className="relative w-full h-72 overflow-hidden">
                                  <Image
                                    src={item.image}
                                    alt={item.name || "Service image"}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                                  <div className="absolute top-4 right-4">
                                    <div
                                      className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold"
                                      style={{ color: primaryColor }}
                                    >
                                      {item.category || "Featured"}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="p-8">
                                <h3
                                  className="font-black text-2xl mb-4 leading-tight"
                                  style={{ color: primaryColor }}
                                >
                                  {item.name}
                                </h3>
                                <p className="text-gray-600 mb-6 line-clamp-4 leading-relaxed">
                                  {item.description}
                                </p>
                                {item.features && item.features.length > 0 && (
                                  <ul className="space-y-2 mb-6">
                                    {item.features
                                      .slice(0, 3)
                                      .map((feature: string, fIdx: number) => (
                                        <li
                                          key={fIdx}
                                          className="flex items-start gap-2 text-sm text-gray-600"
                                        >
                                          <svg
                                            className="w-5 h-5 flex-shrink-0 mt-0.5"
                                            style={{ color: primaryColor }}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                          <span>{feature}</span>
                                        </li>
                                      ))}
                                  </ul>
                                )}
                                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                  {item.price ? (
                                    <>
                                      <div className="flex flex-col">
                                        <span className="text-sm text-gray-500 font-medium">
                                          Starting at
                                        </span>
                                        <div
                                          className="text-3xl font-black"
                                          style={{ color: primaryColor }}
                                        >
                                          ${item.price.toLocaleString()}
                                        </div>
                                      </div>
                                      <AddToCartButton
                                        item={item}
                                        type="product"
                                        companyId={company.id}
                                        companySlug={company.slug || ""}
                                        primaryColor={primaryColor}
                                        fallbackId={`catalog-${iIdx}`}
                                      />
                                    </>
                                  ) : (
                                    <a
                                      href={`/store/v3/${slug}/contact`}
                                      className="w-full text-center py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                                      style={{ backgroundColor: primaryColor }}
                                    >
                                      Learn More
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                      {/* CTA Section */}
                      <div className="mt-20 text-center">
                        <div
                          className="inline-block bg-linear-to-r from-gray-50 to-white border-2 rounded-2xl p-8 shadow-lg"
                          style={{ borderColor: `${primaryColor}20` }}
                        >
                          <p className="text-2xl font-bold text-gray-900 mb-4">
                            Can&apos;t find what you&apos;re looking for?
                          </p>
                          <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            We offer custom solutions tailored to your specific
                            needs. Let&apos;s discuss your project!
                          </p>
                          <a
                            href={`/store/v3/${slug}/contact`}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Get Custom Quote
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.type === "team" && (
                    <section className="min-h-screen bg-linear-to-br from-white via-gray-50 to-white px-6 py-20 md:px-12 lg:px-20">
                      <div className="mx-auto max-w-7xl">
                        {/* Header */}
                        <header className="mb-16 text-center md:mb-24">
                          <p
                            className="mb-4 text-sm font-medium uppercase tracking-[0.2em] opacity-70"
                            style={{ color: primaryColor }}
                          >
                            Our People
                          </p>
                          <h2
                            className="text-5xl font-bold text-gray-900 md:text-6xl lg:text-7xl"
                            style={{ color: primaryColor }}
                          >
                            {section.heading}
                          </h2>
                          {section.subheading &&
                            ((content.members && content.members.length > 0) ||
                              company.staff.length > 0) && (
                              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                                {section.subheading.replace(
                                  /\d+/,
                                  String(
                                    content.members?.length ||
                                      company.staff.length
                                  )
                                )}
                              </p>
                            )}
                        </header>

                        {/* Team Grid */}
                        {(() => {
                          // Use actual company staff if available, otherwise use content members
                          const teamMembers =
                            company.staff.length > 0
                              ? company.staff.map((s) => ({
                                  name: s.user.name || "Team Member",
                                  role:
                                    s.role === "ADMIN"
                                      ? "Administrator"
                                      : s.role === "MANAGER"
                                      ? "Manager"
                                      : "Team Member",
                                  image: s.user.image || null,
                                  email: s.user.email || null,
                                  bio: null,
                                }))
                              : content.members || [];

                          return teamMembers.length > 0 ? (
                            <>
                              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                {teamMembers.map(
                                  (member: any, mIdx: number) => (
                                    <article
                                      key={mIdx}
                                      className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                                    >
                                      <div className="relative mb-6 aspect-square overflow-hidden rounded-xl">
                                        {isValidImageUrl(member.image) ? (
                                          <Image
                                            src={member.image}
                                            alt={`Portrait of ${member.name}`}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                          />
                                        ) : (
                                          <div
                                            className="flex h-full w-full items-center justify-center text-6xl font-bold text-white"
                                            style={{
                                              backgroundColor: primaryColor,
                                            }}
                                          >
                                            {member.name.charAt(0)}
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                      </div>

                                      <div className="space-y-3">
                                        <div>
                                          <h3 className="text-2xl font-bold text-gray-900">
                                            {member.name}
                                          </h3>
                                          <p
                                            className="text-sm font-semibold uppercase tracking-wider"
                                            style={{ color: primaryColor }}
                                          >
                                            {member.role}
                                          </p>
                                        </div>

                                        {member.bio && (
                                          <p className="text-sm leading-relaxed text-gray-600">
                                            {member.bio}
                                          </p>
                                        )}

                                        {member.email && (
                                          <div className="flex items-center gap-3 pt-2">
                                            <a
                                              href={`mailto:${member.email}`}
                                              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all duration-300 hover:shadow-lg"
                                              style={{
                                                backgroundColor:
                                                  "rgb(243 244 246)",
                                              }}
                                              aria-label={`Email ${member.name}`}
                                            >
                                              <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                />
                                              </svg>
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </article>
                                  )
                                )}
                              </div>

                              {/* Footer CTA */}
                              <div className="mt-20 text-center">
                                <p className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl">
                                  Want to join our team?
                                </p>
                                <a
                                  href={`/store/v3/${slug}/contact`}
                                  className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  Get in Touch
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                  </svg>
                                </a>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-16">
                              <div
                                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
                                style={{ backgroundColor: `${primaryColor}15` }}
                              >
                                👥
                              </div>
                              <h3 className="text-2xl font-bold mb-3 text-gray-700">
                                Our Team is Growing
                              </h3>
                              <p className="text-gray-600 max-w-md mx-auto">
                                We&apos;re building an amazing team. Check back
                                soon to meet the people behind our success!
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </section>
                  )}

                  {section.type === "contact" && (
                    <div className="max-w-7xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-6"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                            {section.subheading}
                          </p>
                        )}
                      </div>

                      {/* Contact Form and Image */}
                      {content.formFields && (
                        <div className="grid lg:grid-cols-2 gap-12 mb-16">
                          <div className="space-y-8">
                            {/* Contact Image */}
                            <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-2xl">
                              <Image
                                src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=800&q=80"
                                alt="Contact Us"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                          </div>
                          {/* Contact Form */}
                          <div
                            className="bg-linear-to-br from-white to-gray-50 p-10 rounded-3xl shadow-xl border-2"
                            style={{ borderColor: `${primaryColor}15` }}
                          >
                            <h3
                              className="text-2xl font-bold mb-6"
                              style={{ color: primaryColor }}
                            >
                              Send us a message
                            </h3>
                            <form className="space-y-6">
                              {(content.formFields || []).map(
                                (field: any, fIdx: number) => (
                                  <div key={fIdx}>
                                    <label className="block text-sm font-bold mb-3 text-gray-700">
                                      {field.label}
                                      {field.required && (
                                        <span style={{ color: primaryColor }}>
                                          {" "}
                                          *
                                        </span>
                                      )}
                                    </label>
                                    {field.type === "textarea" ? (
                                      <textarea
                                        required={field.required}
                                        rows={5}
                                        placeholder={`Enter your ${field.label.toLowerCase()}...`}
                                        className="w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white"
                                        style={{
                                          borderColor: `${primaryColor}30`,
                                        }}
                                      />
                                    ) : field.type === "select" ? (
                                      <select
                                        required={field.required}
                                        className="w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white"
                                        style={{
                                          borderColor: `${primaryColor}30`,
                                        }}
                                      >
                                        <option value="">Select...</option>
                                        {(field.options || []).map(
                                          (option: string, oIdx: number) => (
                                            <option key={oIdx} value={option}>
                                              {option}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    ) : (
                                      <input
                                        type={field.type}
                                        required={field.required}
                                        placeholder={`Enter your ${field.label.toLowerCase()}...`}
                                        className="w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white"
                                        style={{
                                          borderColor: `${primaryColor}30`,
                                        }}
                                      />
                                    )}
                                  </div>
                                )
                              )}
                              <button
                                type="submit"
                                className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95"
                                style={{ backgroundColor: primaryColor }}
                              >
                                Send Message 📨
                              </button>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* Location Cards */}
                      {section.type === "contact" && content.locations && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                          {(content.locations || []).map(
                            (location: any, lIdx: number) => (
                              <div
                                key={lIdx}
                                className="bg-linear-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2"
                                style={{ borderColor: `${primaryColor}15` }}
                              >
                                <div className="flex items-start gap-4">
                                  <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                                    style={{
                                      backgroundColor: `${primaryColor}15`,
                                    }}
                                  >
                                    <span className="text-2xl">📍</span>
                                  </div>
                                  <div className="flex-1">
                                    <h3
                                      className="font-bold text-xl mb-3"
                                      style={{ color: primaryColor }}
                                    >
                                      {location.name}
                                    </h3>
                                    <div className="space-y-2">
                                      <p className="text-gray-700 flex items-start gap-2">
                                        <span className="text-lg mt-0.5">
                                          📌
                                        </span>
                                        <span>{location.address}</span>
                                      </p>
                                      {location.phone && (
                                        <p className="text-gray-700 flex items-center gap-2">
                                          <span className="text-lg">📞</span>
                                          <a
                                            href={`tel:${location.phone}`}
                                            className="hover:opacity-70 transition-opacity"
                                            style={{ color: primaryColor }}
                                          >
                                            {location.phone}
                                          </a>
                                        </p>
                                      )}
                                      {location.email && (
                                        <p className="text-gray-700 flex items-center gap-2">
                                          <span className="text-lg">✉️</span>
                                          <a
                                            href={`mailto:${location.email}`}
                                            className="hover:opacity-70 transition-opacity"
                                            style={{ color: primaryColor }}
                                          >
                                            {location.email}
                                          </a>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Map showing all locations - ONLY for contact section */}
                      {section.type === "contact" &&
                        content.locations &&
                        content.locations.length > 0 && (
                          <div className="mt-12">
                            <h3
                              className="text-3xl font-bold mb-8 text-center"
                              style={{ color: primaryColor }}
                            >
                              Find Us
                            </h3>
                            <div
                              className="bg-white rounded-2xl shadow-lg overflow-hidden border-2"
                              style={{ borderColor: `${primaryColor}20` }}
                            >
                              {content.locations.length === 1 ? (
                                <iframe
                                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                                    content.locations[0].address
                                  )}&zoom=14`}
                                  width="100%"
                                  height="500"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                />
                              ) : (
                                <iframe
                                  src={`https://www.google.com/maps?q=${content.locations
                                    .map((loc: any) =>
                                      encodeURIComponent(loc.address)
                                    )
                                    .join("&q=")}&output=embed&z=11`}
                                  width="100%"
                                  height="500"
                                  style={{ border: 0 }}
                                  allowFullScreen
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                />
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {section.type === "process" && (
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-4"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600">
                            {section.subheading}
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {(content.steps || []).map(
                          (step: any, sIdx: number) => (
                            <div key={sIdx} className="relative text-center">
                              <div
                                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg"
                                style={{
                                  backgroundColor: primaryColor,
                                }}
                              >
                                {sIdx + 1}
                              </div>
                              <h3 className="font-bold text-xl mb-3">
                                {step.heading}
                              </h3>
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {step.description}
                              </p>
                              {sIdx < (content.steps?.length || 0) - 1 && (
                                <div
                                  className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-gray-300"
                                  style={{
                                    background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
                                  }}
                                />
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {section.type === "cta" && (
                    <div
                      className="relative min-h-[400px] -mx-4 flex items-center justify-center text-center rounded-3xl overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      {isValidImageUrl(content.backgroundImage) && (
                        <div className="absolute inset-0">
                          <Image
                            src={content.backgroundImage}
                            alt={
                              section.accessibility.altText || "CTA background"
                            }
                            fill
                            className="object-cover opacity-20"
                          />
                        </div>
                      )}
                      <div className="relative z-10 max-w-4xl mx-auto px-8 py-16 text-white">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl md:text-2xl mb-8 opacity-95">
                            {section.subheading}
                          </p>
                        )}
                        {content.description && (
                          <p className="text-lg mb-10 opacity-90">
                            {content.description}
                          </p>
                        )}
                        {content.ctaText && (
                          <a
                            href={content.ctaLink || "#"}
                            className="inline-block bg-white px-10 py-4 rounded-full text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                            style={{
                              color: primaryColor,
                            }}
                          >
                            {content.ctaText}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {section.type === "features" && (
                    <div className="max-w-7xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-4"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                            {section.subheading}
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-8">
                        {(content.items || []).map(
                          (feature: any, fIdx: number) => (
                            <div
                              key={fIdx}
                              className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                            >
                              {isValidImageUrl(feature.image) && (
                                <div className="relative w-full h-56 rounded-xl overflow-hidden mb-6">
                                  <Image
                                    src={feature.image}
                                    alt={feature.imageAlt || feature.heading}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                </div>
                              )}
                              <h3
                                className="font-bold text-2xl mb-4"
                                style={{ color: primaryColor }}
                              >
                                {feature.heading}
                              </h3>
                              <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {section.type === "testimonials" && (
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-4"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600">
                            {section.subheading}
                          </p>
                        )}
                        <div className="mt-6">
                          <a
                            href={`/store/v3/${slug}/review`}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            Leave a Review
                          </a>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(content.testimonials || []).map(
                          (testimonial: any, tIdx: number) => (
                            <div
                              key={tIdx}
                              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                            >
                              <div className="flex items-center mb-4">
                                {[...Array(testimonial.rating || 5)].map(
                                  (_, i) => (
                                    <svg
                                      key={i}
                                      className="w-5 h-5"
                                      style={{ fill: primaryColor }}
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                    </svg>
                                  )
                                )}
                              </div>
                              <p className="text-gray-700 mb-6 italic leading-relaxed">
                                &quot;{testimonial.testimonial}&quot;
                              </p>
                              <div className="flex items-center">
                                {isValidImageUrl(testimonial.customerPhoto) && (
                                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                                    <Image
                                      src={testimonial.customerPhoto}
                                      alt={testimonial.customerName}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold">
                                    {testimonial.customerName}
                                  </div>
                                  {testimonial.customerTitle && (
                                    <div className="text-sm text-gray-500">
                                      {testimonial.customerTitle}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {section.type === "faq" && (
                    <div className="max-w-4xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-4"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600">
                            {section.subheading}
                          </p>
                        )}
                      </div>
                      <div className="space-y-4">
                        {(content.questions || []).map(
                          (faq: any, fIdx: number) => (
                            <details
                              key={fIdx}
                              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow group"
                            >
                              <summary
                                className="font-bold text-lg cursor-pointer list-none flex justify-between items-center"
                                style={{ color: primaryColor }}
                              >
                                {faq.question}
                                <span className="text-2xl group-open:rotate-180 transition-transform">
                                  ▼
                                </span>
                              </summary>
                              <p className="mt-4 text-gray-600 leading-relaxed">
                                {faq.answer}
                              </p>
                            </details>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* STATS SECTION */}
                  {section.type === "stats" && (
                    <div className="max-w-6xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-4"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600">
                            {section.subheading}
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-8">
                        {(content.items || []).map(
                          (stat: any, sIdx: number) => (
                            <div
                              key={sIdx}
                              className="text-center p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                              style={{
                                background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`,
                              }}
                            >
                              <div
                                className="text-6xl font-black mb-4"
                                style={{ color: primaryColor }}
                              >
                                {stat.value}
                              </div>
                              <h3 className="text-xl font-bold mb-3">
                                {stat.label}
                              </h3>
                              {stat.description && (
                                <p className="text-gray-600 text-sm leading-relaxed">
                                  {stat.description}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* PORTFOLIO SECTION */}
                  {section.type === "portfolio" && (
                    <div className="max-w-7xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-4"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600">
                            {section.subheading}
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(content.items || []).map(
                          (item: any, pIdx: number) => (
                            <div
                              key={pIdx}
                              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all"
                            >
                              {isValidImageUrl(item.image) && (
                                <div className="relative h-80">
                                  <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                <h3 className="font-bold text-2xl mb-2">
                                  {item.title}
                                </h3>
                                {item.description && (
                                  <p className="text-sm opacity-90">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* PRICING SECTION */}
                  {section.type === "pricing" && (
                    <div className="max-w-7xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-4"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600">
                            {section.subheading}
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-8">
                        {(content.tiers || []).map(
                          (tier: any, tIdx: number) => (
                            <div
                              key={tIdx}
                              className={`relative p-8 rounded-2xl shadow-xl ${
                                tier.featured
                                  ? "ring-4 transform scale-105"
                                  : "bg-white"
                              }`}
                              style={{
                                backgroundColor: tier.featured
                                  ? `${primaryColor}10`
                                  : undefined,
                                ...(tier.featured &&
                                  ({
                                    "--tw-ring-color": primaryColor,
                                  } as React.CSSProperties)),
                              }}
                            >
                              {tier.featured && (
                                <div
                                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-white text-sm font-bold shadow-lg"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  Most Popular
                                </div>
                              )}
                              <h3 className="text-2xl font-bold mb-4">
                                {tier.name}
                              </h3>
                              <div className="mb-6">
                                <span
                                  className="text-5xl font-black"
                                  style={{ color: primaryColor }}
                                >
                                  ${tier.price}
                                </span>
                                {tier.period && (
                                  <span className="text-gray-600">
                                    /{tier.period}
                                  </span>
                                )}
                              </div>
                              {tier.description && (
                                <p className="text-gray-600 mb-6">
                                  {tier.description}
                                </p>
                              )}
                              <ul className="space-y-3 mb-8">
                                {(tier.features || []).map(
                                  (feature: string, fIdx: number) => (
                                    <li
                                      key={fIdx}
                                      className="flex items-start gap-2"
                                    >
                                      <svg
                                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                                        style={{ fill: primaryColor }}
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <span className="text-gray-700">
                                        {feature}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                              <button
                                className="w-full py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                style={{
                                  backgroundColor: tier.featured
                                    ? primaryColor
                                    : `${primaryColor}20`,
                                  color: tier.featured ? "white" : primaryColor,
                                }}
                              >
                                {tier.ctaText || "Get Started"}
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* BLOG PREVIEW SECTION */}
                  {section.type === "blog-preview" && (
                    <div className="max-w-7xl mx-auto">
                      <div className="text-center mb-16">
                        <h2
                          className="text-4xl md:text-5xl font-bold mb-4"
                          style={{ color: primaryColor }}
                        >
                          {section.heading}
                        </h2>
                        {section.subheading && (
                          <p className="text-xl text-gray-600">
                            {section.subheading}
                          </p>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-8">
                        {(content.posts || []).map(
                          (post: any, pIdx: number) => (
                            <article
                              key={pIdx}
                              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
                            >
                              {isValidImageUrl(post.image) && (
                                <div className="relative h-48">
                                  <Image
                                    src={post.image}
                                    alt={post.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="p-6">
                                {post.category && (
                                  <span
                                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                                    style={{
                                      backgroundColor: `${primaryColor}20`,
                                      color: primaryColor,
                                    }}
                                  >
                                    {post.category}
                                  </span>
                                )}
                                <h3 className="font-bold text-xl mb-3 line-clamp-2">
                                  {post.title}
                                </h3>
                                {post.excerpt && (
                                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {post.excerpt}
                                  </p>
                                )}
                                {post.date && (
                                  <div className="text-sm text-gray-500">
                                    {post.date}
                                  </div>
                                )}
                              </div>
                            </article>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fallback for unsupported types */}
                  {![
                    "about",
                    "catalog",
                    "team",
                    "contact",
                    "process",
                    "cta",
                    "features",
                    "testimonials",
                    "faq",
                    "stats",
                    "portfolio",
                    "pricing",
                    "blog-preview",
                    "hero",
                  ].includes(section.type) && (
                    <div className="max-w-4xl mx-auto">
                      <h2
                        className="text-3xl font-bold mb-4"
                        style={{ color: primaryColor }}
                      >
                        {section.heading}
                      </h2>
                      {section.subheading && (
                        <p className="text-xl text-gray-600 mb-8">
                          {section.subheading}
                        </p>
                      )}
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
                        <p className="text-sm font-semibold text-yellow-800 mb-2">
                          Unsupported section type: {section.type}
                        </p>
                        <pre className="text-xs bg-white p-4 rounded overflow-x-auto">
                          {JSON.stringify(content, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
      </main>

      {/* Footer with brand colors */}
      <footer
        className="border-t py-12 mt-20"
        style={{
          borderTopColor: getPrimaryColor(websiteData.brand?.colors),
          background: `linear-gradient(135deg, ${getPrimaryColor(
            websiteData.brand?.colors
          )}15, ${getSecondaryColor(websiteData.brand?.colors)}15)`,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div
                className="text-2xl font-bold mb-2"
                style={{
                  color: getPrimaryColor(websiteData.brand?.colors),
                }}
              >
                {company.name}
              </div>
              <div className="text-sm text-gray-600">
                © {new Date().getFullYear()} {company.name}. All rights
                reserved.
              </div>
            </div>
            {websiteData.navigation.footer && (
              <div className="flex gap-6">
                {websiteData.navigation.footer.map((item, idx: number) => (
                  <a
                    key={idx}
                    href={`/store/v3/${slug}/${item.slug}`}
                    className="text-sm text-gray-600 hover:opacity-70 transition-opacity font-medium"
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
