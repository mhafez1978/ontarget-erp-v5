import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// List jobs (SUPER_ADMIN) or company-specific (owner)
export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;
    const user = validation.user;
    const url = new URL(request.url);
    const companyId = url.searchParams.get("companyId");

    if (user.role === "SUPER_ADMIN") {
      // return latest 50 jobs
      const jobs = await db.videoGenerationJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({ jobs });
    }

    if (!companyId)
      return NextResponse.json(
        { error: "companyId required" },
        { status: 400 }
      );

    // Only owners can fetch company jobs
    const owns = (user as any).ownedCompanies?.some(
      (c: any) => c.id === companyId
    );
    if (!owns)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const jobs = await db.videoGenerationJob.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("List jobs error:", error);
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 });
  }
}
