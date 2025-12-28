import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { mapAiSpecToThemeSections } from "@/lib/storefront/ai-spec-mapper";
import {
  computeSectionDiffs,
  humanReadableSummary,
} from "@/lib/storefront/section-diffs";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const body = await request.json();
    const { companyId, versionId, spec, themeId = "default" } = body as any;
    if (!companyId)
      return NextResponse.json(
        { error: "companyId required" },
        { status: 400 }
      );

    // Permission check: user must be owner or super admin
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

    // Fetch current storeMetadata sections
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { storeMetadata: true },
    });
    const prevSections = Array.isArray(
      (company?.storeMetadata as any)?.sections
    )
      ? (company?.storeMetadata as any).sections
      : [];

    // Determine target spec (either from body or from version)
    let targetSpec = spec;
    if (!targetSpec && versionId) {
      const v = await db.storefrontSpecVersion.findUnique({
        where: { id: versionId },
      });
      if (!v)
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 }
        );
      targetSpec = v.spec as any;
    }

    if (!targetSpec)
      return NextResponse.json(
        { error: "spec or versionId required" },
        { status: 400 }
      );

    const mapped = mapAiSpecToThemeSections(targetSpec, themeId);
    if (!mapped) {
      console.error("[Diffs] Failed to map spec to theme:", {
        specKeys: Object.keys(targetSpec || {}),
        themeId,
      });
      return NextResponse.json(
        { error: "Failed to map spec to theme" },
        { status: 500 }
      );
    }

    const changes = computeSectionDiffs(prevSections, mapped);
    const summary = humanReadableSummary(changes);

    return NextResponse.json({ success: true, changes, summary });
  } catch (error) {
    console.error("Diffs error:", error);
    console.error("[Diffs] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to compute diffs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
