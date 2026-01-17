import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(
  request: NextRequest,
  __context:
    | { params: { jobId: string } }
    | { params: Promise<{ jobId: string }> }
) {
  const paramsOrPromise = "params" in __context ? __context.params : undefined;
  // Normalize params whether it's a value or a promise
  let params: { jobId: string } | undefined;
  if (paramsOrPromise) {
    if (typeof (paramsOrPromise as any).then === "function") {
      params = (await paramsOrPromise) as { jobId: string };
    } else {
      params = paramsOrPromise as { jobId: string };
    }
  }
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    if (!params?.jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await db.videoGenerationJob.findUnique({
      where: { id: params.jobId },
      include: { logs: true },
    });
    if (!job)
      return NextResponse.json({ error: "Job not found" }, { status: 404 });

    if (user.role !== "SUPER_ADMIN") {
      // owners only
      const ownedCompanies = (user as { ownedCompanies?: { id: string }[] })
        .ownedCompanies;
      const owns =
        Array.isArray(ownedCompanies) &&
        ownedCompanies.some((c) => c.id === job.companyId);
      if (!owns)
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    console.error("Get job error:", err);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}
