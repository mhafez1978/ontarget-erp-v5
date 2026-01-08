import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response as NextResponse;

    const user = validation.user;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

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

    const conversations = await db.storefrontConversation.findMany({
      where: { companyId },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: {
        id: true,
        companyId: true,
        createdBy: true,
        status: true,
        lastMessageAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error("List conversations error:", error);
    return NextResponse.json(
      { error: "Failed to list conversations" },
      { status: 500 }
    );
  }
}
