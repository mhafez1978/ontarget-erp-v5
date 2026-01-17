import { db } from "@/lib/db";
import type { OutboxJob } from "@/generated/prisma/client";
// lightweight lock id generation (avoid adding uuid types during iteration)
function makeLockId() {
  return `lock_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}
import {
  getPendingJobs,
  markJobInProgress,
  markJobCompleted,
  markJobFailed,
} from "@/lib/outbox";
import { anchorHashToHedera } from "@/lib/hedera/service";

interface HederaAnchorPayload {
  hash: string;
  companyId?: string;
  auditLogId?: string;
}

export async function processNextJob() {
  const jobs = await getPendingJobs(1);
  if (jobs.length === 0) return null;
  const job = jobs[0];

  const lockId = makeLockId();
  await markJobInProgress(job.id, lockId);

  const result = await processJob(job);
  return result;
}

// Exported for unit testing - process a single job object
export async function processJob(job: OutboxJob): Promise<boolean> {
  try {
    switch (job.type) {
      case "HEDERA_ANCHOR": {
        const payload = job.payload as unknown as HederaAnchorPayload;
        if (!payload?.hash) throw new Error("Missing hash in payload");

        const result = await anchorHashToHedera(
          payload.hash,
          payload.companyId
        );

        // Link the transaction to the audit log if provided
        if (payload.auditLogId && result.transactionId) {
          await db.hederaTransaction.updateMany({
            where: {
              hash: payload.hash,
              transactionId: result.transactionId,
            },
            data: {
              auditLogId: payload.auditLogId,
            },
          });
        }

        await db.outboxJob.update({
          where: { id: job.id },
          data: { status: "COMPLETED", updatedAt: new Date() },
        });
        break;
      }

      default:
        throw new Error(`Unknown outbox job type: ${job.type}`);
    }

    await markJobCompleted(job.id);
    return true;
  } catch (err) {
    // Simple exponential backoff: attempts^2 * 60 seconds
    const attempts = (job.attempts || 0) + 1;
    const backoffSeconds = Math.min(60 * attempts * attempts, 60 * 60); // cap 1 hour
    const nextRun = new Date(Date.now() + backoffSeconds * 1000);

    await markJobFailed(job.id, err, attempts < 5 ? nextRun : null);
    return false;
  }
}

export async function runWorkerLoop(pollIntervalMs = 5000) {
  while (true) {
    try {
      await processNextJob();
    } catch (err) {
      console.error("Outbox worker error:", err);
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
}
