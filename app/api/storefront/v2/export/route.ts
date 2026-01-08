import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { mapAiSpecToThemeSections } from "@/lib/storefront/ai-spec-mapper";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const body = await request.json();
    const { companyId, versionId, sections, themeId = "default" } = body as any;
    if (!companyId)
      return NextResponse.json(
        { error: "companyId required" },
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

    let mappedSections = sections;
    if (!mappedSections && versionId) {
      const v = await db.storefrontSpecVersion.findUnique({
        where: { id: versionId },
      });
      if (!v)
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 }
        );
      const mapped = mapAiSpecToThemeSections(v.spec as any, themeId);
      if (!mapped)
        return NextResponse.json(
          { error: "Failed to map spec to theme" },
          { status: 500 }
        );
      mappedSections = mapped;
    }

    if (!mappedSections || !Array.isArray(mappedSections))
      return NextResponse.json(
        { error: "sections or versionId required" },
        { status: 400 }
      );

    // Merge into existing storeMetadata without clobbering other keys
    const prev = await db.company.findUnique({
      where: { id: companyId },
      select: { storeMetadata: true },
    });
    const prevMeta =
      prev?.storeMetadata &&
      typeof prev.storeMetadata === "object" &&
      !Array.isArray(prev.storeMetadata)
        ? (prev.storeMetadata as Record<string, unknown>)
        : {};
    const newMeta = { ...prevMeta, sections: mappedSections } as Record<
      string,
      unknown
    >;

    await db.company.update({
      where: { id: companyId },
      data: { storeMetadata: newMeta as any },
    });

    return NextResponse.json({
      success: true,
      message: "Exported sections to company.storeMetadata",
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export sections" },
      { status: 500 }
    );
  }
}
