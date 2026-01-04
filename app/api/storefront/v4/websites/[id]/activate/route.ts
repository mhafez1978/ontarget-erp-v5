import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }
    const userId = validation.user.id;

    const { id: websiteId } = await params;

    // Get website to verify ownership
    const website = await db.v4Website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Deactivate all other websites for this company
    await db.v4Website.updateMany({
      where: {
        companyId: website.companyId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Activate this website
    const activated = await db.v4Website.update({
      where: { id: websiteId },
      data: {
        isActive: true,
        publishedAt: new Date(),
      },
    });

    console.log("[V4 Activate] Website activated:", websiteId);

    return NextResponse.json({
      success: true,
      website: {
        id: activated.id,
        isActive: activated.isActive,
        publishedAt: activated.publishedAt,
      },
    });
  } catch (error) {
    console.error("[V4 Activate] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to activate website",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
