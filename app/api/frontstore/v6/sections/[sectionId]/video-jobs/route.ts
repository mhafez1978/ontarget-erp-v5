import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sectionId: string }> }
) {
  const params = await context.params;
  try {
    const { sectionId } = params;
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;
    const user = validation.user;

    // Find section to check authorization & company
    const section = await db.generatedSection.findUnique({
      where: { id: sectionId },
    });
    if (!section)
      return NextResponse.json({ error: "Section not found" }, { status: 404 });

    if (user.role !== "SUPER_ADMIN") {
      const ownedCompanies = (user as { ownedCompanies?: { id: string }[] })
        .ownedCompanies;
      const owns =
        Array.isArray(ownedCompanies) &&
        ownedCompanies.some((c) => c.id === section.companyId);
      if (!owns)
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const jobs = await db.videoGenerationJob.findMany({
      where: { sectionId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("List section jobs error:", err);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}
