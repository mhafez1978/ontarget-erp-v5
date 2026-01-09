import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { generateAIVideo } from "@/lib/frontstore/v6-video-service";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const userId = validation.user.id;

    const body = await request.json();
    const { companyId, sectionId, variantId, prompt, duration, resolution } = body;

    if (!companyId || !sectionId || !variantId || !prompt) {
      return NextResponse.json({ error: "companyId, sectionId, variantId and prompt are required" }, { status: 400 });
    }

    // Authorization: must be super admin or owner
    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, ownedCompanies: { select: { id: true } } } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Kick off generation (blocking call for now)
    const result = await generateAIVideo({ companyId, sectionId, variantId, prompt, duration, resolution });

    return NextResponse.json({ success: true, url: result.url, provider: result.provider });
  } catch (error) {
    console.error("Generate video error:", error);
    return NextResponse.json({ error: "Failed to generate video" }, { status: 500 });
  }
}
