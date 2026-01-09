#!/usr/bin/env node

/**
 * Simple video job worker.
 * - Polls for queued jobs
 * - Marks job PROCESSING
 * - Calls generateAIVideo
 * - Updates job with result or error and writes logs
 *
 * Run with: `node ./lib/frontstore/v6-job-worker.ts`
 * In production, run under a process manager and monitor.
 */

import { db } from "@/lib/db";
import { generateAIVideo } from "@/lib/frontstore/v6-video-service";

async function log(jobId: string, level: string, message: string) {
  await db.videoGenerationLog.create({ data: { jobId, level, message } });
}

async function processOne() {
  // Find one queued job
  const job = await db.videoGenerationJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
  });
  if (!job) return false;

  console.log(`[worker] picked job ${job.id}`);

  try {
    await db.videoGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    await log(job.id, "info", "Job started processing");

    const result = await generateAIVideo({
      companyId: job.companyId,
      sectionId: job.sectionId,
      variantId: job.variantId,
      prompt: job.prompt,
      duration: job.duration || 4,
      resolution: job.resolution || "1920x1080",
    });

    await db.videoGenerationJob.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        provider: result.provider,
        resultUrl: result.url,
        completedAt: new Date(),
      },
    });
    await log(job.id, "info", `Job succeeded with provider ${result.provider}`);
    console.log(`[worker] job ${job.id} succeeded`);
  } catch (err: any) {
    console.error(`[worker] job ${job.id} failed:`, err);
    await db.videoGenerationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: String(err), completedAt: new Date() },
    });
    await log(job.id, "error", String(err));
  }

  return true;
}

async function runLoop() {
  while (true) {
    try {
      const didWork = await processOne();
      if (!didWork) {
        // Sleep for a few seconds
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error("Worker loop error:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

if (require.main === module) {
  console.log("Starting video job worker...");
  runLoop();
}
