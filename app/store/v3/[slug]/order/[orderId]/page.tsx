/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { CheckCircle } from "lucide-react";
import type { V3Website } from "@/lib/ai/v3-types";

interface OrderConfirmationProps {
  params: Promise<{ slug: string; orderId: string }>;
}

function getPrimaryColor(colors: any): string {
  if (!colors) return "#000";
  return colors.primary || colors.accent || "#000";
}

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationProps) {
  const { slug, orderId } = await params;

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

  // TODO: Fetch actual order from database when Order table is added
  // const order = await db.order.findUnique({
  //   where: { id: orderId },
  //   include: { items: true },
  // });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav
        className="border-b bg-white shadow-sm"
        style={{ borderBottomColor: primaryColor }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/store/v3/${slug}`}
              className="text-2xl font-bold"
              style={{ color: primaryColor }}
            >
              {company.name}
            </Link>
          </div>
        </div>
      </nav>

      {/* Order Confirmation */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                backgroundColor: `${primaryColor}20`,
              }}
            >
              <CheckCircle size={48} style={{ color: primaryColor }} />
            </div>

            <h1
              className="text-4xl font-bold mb-4"
              style={{ color: primaryColor }}
            >
              Order Confirmed!
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Thank you for your order. We&apos;ve sent a confirmation email
              with your order details.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">Order Number</p>
              <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                {orderId}
              </p>
            </div>

            <div className="space-y-4 text-left mb-8">
              <div className="border-t pt-4">
                <p className="text-gray-600 mb-4">
                  We&apos;ll send you shipping updates and tracking information
                  to your email address.
                </p>
                <p className="text-gray-600">
                  If you have any questions about your order, please contact us
                  at{" "}
                  <a
                    href={`mailto:${company.email}`}
                    className="font-semibold"
                    style={{ color: primaryColor }}
                  >
                    {company.email}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/store/v3/${slug}`}
                className="py-3 px-8 rounded-lg font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Continue Shopping
              </Link>
              <Link
                href={`/store/v3/${slug}/contact`}
                className="py-3 px-8 rounded-lg font-semibold border-2 transition-all duration-300 hover:bg-gray-50"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
