import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const body = await request.json();
    const { companyId, versionId } = body as {
      companyId?: string;
      versionId?: string;
    };

    if (!companyId || !versionId)
      return NextResponse.json(
        { error: "companyId and versionId required" },
        { status: 400 }
      );

    // Permission check
    const userWithCompanies = await db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        ownedCompanies: { where: { id: companyId }, select: { id: true } },
      },
    });

    const isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
    const ownsCompany = (userWithCompanies?.ownedCompanies || []).length > 0;
    if (!isSuperAdmin && !ownsCompany)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const version = await db.storefrontSpecVersion.findUnique({
      where: { id: versionId },
    });
    if (!version || version.companyId !== companyId)
      return NextResponse.json({ error: "Version not found" }, { status: 404 });

    // Apply spec (save to company.aiStorefrontSpec and enable)
    await db.company.update({
      where: { id: companyId },
      data: { aiStorefrontSpec: version.spec, aiStorefrontEnabled: true },
    });

    // Mark appliedAt
    await db.storefrontSpecVersion.update({
      where: { id: versionId },
      data: { appliedAt: new Date() },
    });

    // Create system message in latest open conversation (optional)
    const conv = await db.storefrontConversation.findFirst({
      where: { companyId },
      orderBy: { lastMessageAt: "desc" },
    });
    if (conv) {
      await db.storefrontMessage.create({
        data: {
          conversationId: conv.id,
          role: "system",
          content: `Spec version ${versionId} applied by ${user.id}`,
          isPreviewOnly: false,
        },
      });
      await db.storefrontConversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, message: "Version applied" });
  } catch (error) {
    console.error("Apply version error:", error);
    return NextResponse.json(
      { error: "Failed to apply version" },
      { status: 500 }
    );
  }
}
