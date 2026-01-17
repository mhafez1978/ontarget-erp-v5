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
import type { VideoGenerationJob } from "@/generated/prisma/client";

async function log(jobId: string, level: string, message: string) {
  await db.videoGenerationLog.create({ data: { jobId, level, message } });
}

function normalizeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

async function processOne() {
  // Find one queued job
  const job = (await db.videoGenerationJob.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
  })) as VideoGenerationJob | null;
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

    // Try to attach the generated video to the corresponding section variant assets
    try {
      const section = await db.generatedSection.findUnique({
        where: { id: job.sectionId },
      });
      if (section) {
        const variants = Array.isArray(section.variants)
          ? (section.variants as unknown as Record<string, unknown>[])
          : [];
        const updated = variants.map((v) => {
          const rv = v as Record<string, unknown>;
          const vid = String(rv.id || "");
          if (vid === job.variantId) {
            const assets = Array.isArray(rv.assets)
              ? (rv.assets as Record<string, unknown>[])
              : [];
            return {
              ...rv,
              assets: [
                ...assets,
                { type: "video", url: result.url, provider: result.provider },
              ],
            };
          }
          return rv;
        });
        await db.generatedSection.update({
          where: { id: section.id },
          data: { variants: updated as any },
        });
      }
    } catch (attachErr) {
      console.warn(
        "Failed to attach video asset to section variant:",
        attachErr
      );
    }

    await log(job.id, "info", `Job succeeded with provider ${result.provider}`);
    console.log(`[worker] job ${job.id} succeeded`);
  } catch (err: unknown) {
    const msg = normalizeError(err);
    console.error(`[worker] job ${job.id} failed:`, msg);
    await db.videoGenerationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error: msg, completedAt: new Date() },
    });
    await log(job.id, "error", msg);
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
