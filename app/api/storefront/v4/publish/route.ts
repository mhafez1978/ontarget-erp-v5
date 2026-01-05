import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

/**
 * API endpoint to publish V4 website changes
 * Makes the website active and visible on the storefront
 */
export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }
    const userId = validation.user.id;

    const body = await req.json();
    const { websiteId } = body;

    if (!websiteId) {
      return NextResponse.json(
        { error: "Missing required field: websiteId" },
        { status: 400 }
      );
    }

    // Fetch the website and verify ownership
    const website = await db.v4Website.findUnique({
      where: { id: websiteId },
      include: { company: true },
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Verify user has access to this company
    const hasAccess = await db.companyUser.findFirst({
      where: {
        userId,
        companyId: website.companyId,
      },
    });

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Deactivate any other active websites for this company
    await db.v4Website.updateMany({
      where: {
        companyId: website.companyId,
        isActive: true,
        id: { not: websiteId },
      },
      data: {
        isActive: false,
      },
    });

    // Activate this website
    await db.v4Website.update({
      where: { id: websiteId },
      data: {
        isActive: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Website published successfully",
      publishedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[V4 Publish] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to publish website",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
