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
    let { companyId, sectionId, variantId, prompt, duration, resolution } =
      body;

    if (!sectionId || !variantId || !prompt) {
      return NextResponse.json(
        { error: "sectionId, variantId and prompt are required" },
        { status: 400 }
      );
    }

    // If companyId not supplied, infer from sectionId
    if (!companyId) {
      const sec = await db.generatedSection.findUnique({
        where: { id: sectionId },
        select: { companyId: true },
      });
      if (!sec)
        return NextResponse.json(
          { error: "Section not found" },
          { status: 404 }
        );
      companyId = sec.companyId;
    }

    // Authorization: must be super admin or owner
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, ownedCompanies: { select: { id: true } } },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create a queued job record so worker can process it asynchronously
    const job = await db.videoGenerationJob.create({
      data: {
        companyId,
        sectionId,
        variantId,
        prompt,
        duration: duration ? Number(duration) : 4,
        resolution: resolution || "1920x1080",
        status: "QUEUED",
      },
    });

    // Log the enqueue activity
    await db.videoGenerationLog.create({
      data: { jobId: job.id, level: "info", message: "Job enqueued" },
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
    });
  } catch (error) {
    console.error("Generate video error:", error);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 }
    );
  }
}
