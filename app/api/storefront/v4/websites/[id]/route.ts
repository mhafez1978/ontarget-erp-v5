import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }
    const userId = validation.user.id;
    const { id } = await params;

    // Check if website exists and user owns it
    const website = await db.v4Website.findUnique({
      where: { id },
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    if (website.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the website
    await db.v4Website.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[V4 Website DELETE] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete website",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
