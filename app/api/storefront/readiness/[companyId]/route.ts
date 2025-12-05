import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkStorefrontReadiness } from "@/lib/storefront-readiness";

const prisma = db;

/**
 * GET /api/storefront/readiness/[companyId]
 * Returns storefront readiness score and recommendations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    // Fetch company and related data
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        isStoreEnabled: true,
        storeBanner: true,
        logo: true,
        description: true,
        email: true,
        phone: true,
        _count: {
          select: {
            products: {
              where: {
                isPublished: true,
              },
            },
            services: {
              where: {
                isPublished: true,
              },
            },
            staff: {
              where: {
                isFeatured: true,
              },
            },
            testimonials: {
              where: {
                status: "APPROVED",
                isFeatured: true,
              },
            },
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Prepare data for readiness check
    const storefrontData = {
      productsCount: company._count?.products || 0,
      servicesCount: company._count?.services || 0,
      teamMembersCount: company._count?.staff || 0,
      testimonialsCount: company._count?.testimonials || 0,
      hasBanner: !!company.storeBanner,
      hasLogo: !!company.logo,
      hasDescription: !!company.description && company.description.length > 20,
      hasContactInfo: !!(company.email || company.phone),
      isStoreEnabled: company.isStoreEnabled,
    };

    // Calculate readiness
    const readiness = checkStorefrontReadiness(storefrontData);

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        isStoreEnabled: company.isStoreEnabled,
      },
      readiness,
    });
  } catch (error) {
    console.error("Storefront readiness check error:", error);
    return NextResponse.json(
      { error: "Failed to check storefront readiness" },
      { status: 500 }
    );
  }
}
