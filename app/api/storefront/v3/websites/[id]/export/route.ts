/**
 * V3 Website Export to Content Wizard API
 *
 * POST /api/storefront/v3/websites/[id]/export
 * Converts V3 website sections to Content Wizard format
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { convertV3WebsiteToThemeSections } from "@/lib/ai/v3-to-content-wizard-mapper";
import type { V3Website } from "@/lib/ai/v3-types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate session
  const validation = await validateSessionForAPI(req);
  if (!validation.valid) {
    return validation.response as NextResponse;
  }
  const { user } = validation;

  const { id: websiteId } = await params;

  try {
    // Fetch the V3 website
    const website = await db.storefrontWebsiteV3.findUnique({
      where: {
        id: websiteId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logo: true,
            email: true,
            phone: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            country: true,
            postalCode: true,
          },
        },
      },
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Verify user has access to the company
    const userWithCompanies = await db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        ownedCompanies: {
          where: { id: website.companyId },
          select: { id: true },
        },
        companyMemberships: {
          where: { companyId: website.companyId },
          select: { companyId: true },
        },
      },
    });

    const isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
    const isOwner = (userWithCompanies?.ownedCompanies.length ?? 0) > 0;
    const isMember = (userWithCompanies?.companyMemberships.length ?? 0) > 0;

    if (!isSuperAdmin && !isOwner && !isMember) {
      return NextResponse.json(
        { error: "Unauthorized to access this website" },
        { status: 403 }
      );
    }

    // Parse website data
    const websiteData = website.websiteData as V3Website;

    // Convert to Content Wizard format
    const themeSections = convertV3WebsiteToThemeSections(websiteData);

    // Return converted sections
    return NextResponse.json({
      success: true,
      sections: themeSections,
      companyData: {
        name: website.company.name,
        description: website.company.description || undefined,
        logo: website.company.logo || undefined,
        email: website.company.email || undefined,
        phone: website.company.phone || undefined,
        addressLine1: website.company.addressLine1 || undefined,
        addressLine2: website.company.addressLine2 || undefined,
        city: website.company.city || undefined,
        state: website.company.state || undefined,
        country: website.company.country || undefined,
        postalCode: website.company.postalCode || undefined,
      },
      metadata: {
        websiteId: website.id,
        version: websiteData.version,
        generatedAt: websiteData.generatedAt,
        pageCount: websiteData.pages.length,
        sectionCount: themeSections.length,
      },
    });
  } catch (error) {
    console.error("[V3 Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export website" },
      { status: 500 }
    );
  }
}
