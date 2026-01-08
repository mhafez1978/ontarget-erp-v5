import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * GET /api/storefront/v3/websites
 * List all V3 websites for a company
 */
export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response as NextResponse;
    }
    const { user } = validation;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    // Check permissions
    const userWithCompanies = await db.user.findUnique({
      where: { id: user.id },
      include: {
        ownedCompanies: { where: { id: companyId } },
        companyMemberships: { where: { companyId } },
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

    // Fetch all V3 websites for this company
    const websites = await db.storefrontWebsiteV3.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      websites,
    });
  } catch (error) {
    console.error("[V3 List] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch websites" },
      { status: 500 }
    );
  }
}
