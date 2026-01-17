import { db } from "@/lib/db";
import type { OutboxJob, Prisma } from "@/generated/prisma/client";

export type OutboxJobType = "HEDERA_ANCHOR" | string;

export async function enqueueOutboxJob(
  type: OutboxJobType,
  payload: Prisma.JsonValue,
  runAt?: Date
): Promise<OutboxJob> {
  return db.outboxJob.create({
    data: {
      type,
      payload: payload as unknown as Prisma.InputJsonValue,
      runAt: runAt || null,
    },
  });
}

export async function getPendingJobs(limit = 10): Promise<OutboxJob[]> {
  const now = new Date();
  return db.outboxJob.findMany({
    where: {
      status: "PENDING",
      OR: [{ runAt: null }, { runAt: { lte: now } }],
    },
    orderBy: { runAt: "asc" },
    take: limit,
  });
}

export async function markJobInProgress(
  id: string,
  lockId: string
): Promise<OutboxJob> {
  return db.outboxJob.update({
    where: { id },
    data: { status: "IN_PROGRESS", lockedAt: new Date(), lockId },
  });
}

export async function markJobCompleted(id: string): Promise<OutboxJob> {
  return db.outboxJob.update({
    where: { id },
    data: { status: "COMPLETED" },
  });
}

export async function markJobFailed(
  id: string,
  error: unknown,
  scheduleRetry: Date | null
): Promise<OutboxJob> {
  const lastError = error instanceof Error ? error.message : String(error);
  const attemptsInc = await db.outboxJob.update({
    where: { id },
    data: {
      attempts: { increment: 1 },
      lastError,
      status: scheduleRetry ? "PENDING" : "FAILED",
      runAt: scheduleRetry,
    },
  });
  return attemptsInc;
}
