import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response as NextResponse;

    const user = validation.user;
    const companyId = request.nextUrl.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

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
    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the company's current AI spec
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        aiStorefrontSpec: true,
        aiStorefrontEnabled: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get the most recent conversation for this company
    const conversation = await db.storefrontConversation.findFirst({
      where: { companyId },
      orderBy: { lastMessageAt: "desc" },
      select: { id: true },
    });

    return NextResponse.json({
      spec: company.aiStorefrontEnabled ? company.aiStorefrontSpec : null,
      conversationId: conversation?.id || null,
    });
  } catch (error) {
    console.error("Get current spec error:", error);
    return NextResponse.json(
      { error: "Failed to get current spec" },
      { status: 500 }
    );
  }
}
