import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * GET /api/storefront/v3/websites/[id]
 * Get a specific V3 website
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }
    const { user } = validation;

    const { id: websiteId } = await params;

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

    return NextResponse.json({
      success: true,
      website,
    });
  } catch (error) {
    console.error("[V3 Get] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch website" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/storefront/v3/websites/[id]
 * Delete a V3 website
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }
    const { user } = validation;

    const { id: websiteId } = await params;

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

    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json(
        { error: "Unauthorized - only owners can delete websites" },
        { status: 403 }
      );
    }

    // Don't allow deleting active website
    if (website.isActive) {
      return NextResponse.json(
        {
          error: "Cannot delete active website. Publish another version first.",
        },
        { status: 400 }
      );
    }

    await db.storefrontWebsiteV3.delete({
      where: { id: websiteId },
    });

    return NextResponse.json({
      success: true,
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error("[V3 Delete] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete website" },
      { status: 500 }
    );
  }
}
