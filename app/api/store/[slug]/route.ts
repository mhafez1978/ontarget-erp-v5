import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find company by slug
    const company = await db.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slogan: true,
        description: true,
        logo: true,
        logoLight: true,
        logoDark: true,
        website: true,
        phone: true,
        email: true,
        isStoreEnabled: true,
        storeTheme: true,
        storeBanner: true,
        storeMetadata: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        aiStorefrontEnabled: true,
        aiStorefrontSpec: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!company.isStoreEnabled) {
      return NextResponse.json(
        { error: "Store is not enabled" },
        { status: 403 }
      );
    }

    // Extract a lightweight AI meta object (colors, layout) if AI storefront is enabled
    let aiStorefrontMeta: Record<string, unknown> | null = null;
    if (company.aiStorefrontEnabled && company.aiStorefrontSpec) {
      const spec = company.aiStorefrontSpec as any;
      if (spec && typeof spec === "object" && spec.meta) {
        aiStorefrontMeta = spec.meta as Record<string, unknown>;
      }
    }

    const { aiStorefrontSpec, ...rest } = company as any;

    return NextResponse.json({
      success: true,
      store: {
        ...rest,
        aiStorefrontMeta,
      },
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}
