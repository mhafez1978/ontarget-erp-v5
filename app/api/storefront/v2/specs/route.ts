import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const body = await request.json();
    const { companyId, spec, title, apply } = body as {
      companyId?: string;
      spec?: unknown;
      title?: string;
      apply?: boolean;
    };

    if (!companyId || !spec)
      return NextResponse.json(
        { error: "companyId and spec are required" },
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

    const version = await db.storefrontSpecVersion.create({
      data: {
        companyId,
        spec: spec as any,
        createdBy: user.id,
        title: title || null,
        source: "manual",
      },
    });

    if (apply) {
      await db.company.update({
        where: { id: companyId },
        data: { aiStorefrontSpec: spec as any, aiStorefrontEnabled: true },
      });
      await db.storefrontSpecVersion.update({
        where: { id: version.id },
        data: { appliedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      versionId: version.id,
      applied: !!apply,
    });
  } catch (error) {
    console.error("Create spec version error:", error);
    return NextResponse.json(
      { error: "Failed to create spec version" },
      { status: 500 }
    );
  }
}
