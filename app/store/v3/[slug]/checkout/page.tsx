/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CheckoutPageClient } from "@/components/checkout-page-client";
import type { V3Website } from "@/lib/ai/v3-types";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

function getPrimaryColor(colors: any): string {
  if (!colors) return "#000";
  return colors.primary || colors.accent || "#000";
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
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
          </div>
        </div>
      </nav>

      <CheckoutPageClient
        companyId={company.id}
        companySlug={slug}
        companyName={company.name}
        companyEmail={company.email || ""}
        primaryColor={primaryColor}
      />
    </div>
  );
}
