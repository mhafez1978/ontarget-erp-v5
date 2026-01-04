/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CartPageClient } from "@/components/cart-page-client";
import type { V3Website } from "@/lib/ai/v3-types";

interface CartPageProps {
  params: Promise<{ slug: string }>;
}

function getPrimaryColor(colors: any): string {
  if (!colors) return "#000";
  return colors.primary || colors.accent || "#000";
}

export default async function CartPage({ params }: CartPageProps) {
  const { slug } = await params;

  const company = await db.company.findUnique({
    where: { slug },
    include: {
      storefrontWebsitesV3: {
        where: { isActive: true },
      },
    },
  });

  if (!company || !company.storefrontWebsitesV3.length) {
    notFound();
  }

  const website = company.storefrontWebsitesV3[0];
  const websiteData = website.websiteData as V3Website;
  const primaryColor = getPrimaryColor(websiteData.brand?.colors);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav
        className="border-b bg-white shadow-sm"
        style={{ borderBottomColor: primaryColor }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a
              href={`/store/v3/${slug}`}
              className="text-2xl font-bold"
              style={{ color: primaryColor }}
            >
              {company.name}
            </a>
            <div className="hidden md:flex gap-6">
              {websiteData.navigation.primary.map((item, idx: number) => (
                <a
                  key={idx}
                  href={
                    item.slug === "home"
                      ? `/store/v3/${slug}`
                      : `/store/v3/${slug}/${item.slug}`
                  }
                  className="hover:opacity-70 transition-opacity font-medium"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <CartPageClient
        companyId={company.id}
        companySlug={slug}
        companyName={company.name}
        primaryColor={primaryColor}
      />
    </div>
  );
}
