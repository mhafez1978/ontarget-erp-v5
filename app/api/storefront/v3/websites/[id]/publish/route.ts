import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * POST /api/storefront/v3/websites/[id]/publish
 * Publish a V3 website (make it active)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }
    const { user } = validation;

    const { id: websiteId } = await params;

    // Fetch the website
    const website = await db.storefrontWebsiteV3.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Check permissions
    const userWithCompanies = await db.user.findUnique({
      where: { id: user.id },
      include: {
        ownedCompanies: { where: { id: website.companyId } },
        companyMemberships: { where: { companyId: website.companyId } },
      },
    });

    const isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
    const ownsCompany = (userWithCompanies?.ownedCompanies || []).length > 0;
    const isMember = (userWithCompanies?.companyMemberships || []).length > 0;

    if (!isSuperAdmin && !ownsCompany && !isMember) {
      return NextResponse.json(
        { error: "Unauthorized - no access to this company" },
        { status: 403 }
      );
    }

    // Deactivate all other websites for this company
    await db.storefrontWebsiteV3.updateMany({
      where: {
        companyId: website.companyId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Activate this website
    const updatedWebsite = await db.storefrontWebsiteV3.update({
      where: { id: websiteId },
      data: {
        isActive: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      website: updatedWebsite,
    });
  } catch (error) {
    console.error("[V3 Publish] Error:", error);
    return NextResponse.json(
      { error: "Failed to publish website" },
      { status: 500 }
    );
  }
}
