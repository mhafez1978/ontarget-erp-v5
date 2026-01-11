import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(
  request: NextRequest,
  __context:
    | { params: { jobId: string } }
    | { params: Promise<{ jobId: string }> }
) {
  const params = ("params" in __context ? __context.params : undefined) as any;
  // If params is a promise (newer Next types), await it
  const resolvedParams =
    params && typeof params.then === "function" ? await params : params;
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const job = await db.videoGenerationJob.findUnique({
      where: { id: params.jobId },
      include: { logs: true },
    });
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    if (user.role !== "SUPER_ADMIN") {
      // owners only
      const owns = (user as any).ownedCompanies?.some(
        (c: any) => c.id === job.companyId
      );
      if (!owns)
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    console.error("Get job error:", err);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}
