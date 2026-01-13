import { db } from "../db.ts";
import { enqueueOutboxJob } from "../outbox.ts";
import { createAuditLog, AUDIT_ACTIONS } from "../audit-log.ts";
import type { CompanyHederaSetting } from "@prisma/client";

export interface EnableOptions {
  companyId: string;
  user: { id: string; email?: string | null };
  enable: boolean;
  historicalAnchoring?: boolean;
  monthlyBudget?: number | null;
  company: { id: string; name?: string };
  existingSetting?: CompanyHederaSetting | null;
}

export async function enableCompanyHedera(opts: EnableOptions, dbClient = db) {
  const {
    companyId,
    user,
    enable,
    historicalAnchoring,
    monthlyBudget,
    company,
    existingSetting,
  } = opts;

  const update = await dbClient.companyHederaSetting.upsert({
    where: { companyId },
    create: {
      companyId,
      enabled: !!enable,
      historicalAnchored: false,
      enabledById: user.id,
      enabledAt: new Date(),
      monthlyBudgetHbar: monthlyBudget != null ? monthlyBudget : null,
      budgetResetDate: monthlyBudget ? new Date() : null,
    },
    update: {
      enabled: !!enable,
      enabledById: user.id,
      enabledAt: new Date(),
      monthlyBudgetHbar: monthlyBudget != null ? monthlyBudget : null,
      budgetResetDate: monthlyBudget ? new Date() : null,
    },
  });

  // Create general audit log
  await createAuditLog({
    companyId,
    userId: user.id,
    action: AUDIT_ACTIONS.COMPANY_UPDATED,
    description: `${
      enable ? "Enabled" : "Disabled"
    } Hedera blockchain anchoring for ${company.name}`,
    metadata: {
      hederaEnabled: enable,
      historicalAnchoring,
      monthlyBudget: monthlyBudget || null,
      enabledBy: user.email,
    },
  });

  // Create Hedera-specific audit
  await dbClient.hederaCompanyAudit.create({
    data: {
      companyId,
      actorId: user.id,
      action: enable ? "ENABLE" : "DISABLE",
      details: {
        historicalAnchoring: !!historicalAnchoring,
        monthlyBudget: monthlyBudget || null,
        companyName: company.name,
      },
    },
  });

  // Add a dedicated entry to the main audit log
  await createAuditLog({
    action: enable
      ? AUDIT_ACTIONS.HEDERA_ENABLED
      : AUDIT_ACTIONS.HEDERA_DISABLED,
    userId: user.id,
    companyId,
    description: `${
      enable ? "Enabled" : "Disabled"
    } Hedera blockchain anchoring for ${company.name}`,
    metadata: { hederaEnabled: enable },
  });

  // If historicalAnchoring requested, create background job
  if (historicalAnchoring && enable) {
    // Prevent duplicate or unnecessary historical jobs
    if (existingSetting?.historicalAnchored) {
      throw new Error("HISTORICAL_ALREADY_COMPLETED");
    }

    if (existingSetting?.historicalJobId) {
      const existingJob = await dbClient.outboxJob.findUnique({
        where: { id: existingSetting.historicalJobId },
      });
      if (existingJob && existingJob.status !== "FAILED") {
        throw new Error("HISTORICAL_ALREADY_IN_PROGRESS");
      }
    }

    const job = await enqueueOutboxJob("HEDERA_HISTORICAL_ANCHOR", {
      companyId,
      requestedBy: user.id,
      requestedAt: new Date().toISOString(),
    });

    // Update setting with job ID
    await dbClient.companyHederaSetting.update({
      where: { companyId },
      data: { historicalJobId: job.id },
    });

    await dbClient.hederaCompanyAudit.create({
      data: {
        companyId,
        actorId: user.id,
        action: "HISTORICAL_REQUEST",
        details: {
          jobId: job.id,
          requestedBy: user.id,
          requestedAt: new Date().toISOString(),
        },
      },
    });

    // Also create an audit log entry for visibility in the main activity feed
    await createAuditLog({
      action: AUDIT_ACTIONS.HEDERA_HISTORICAL_REQUEST,
      userId: user.id,
      companyId,
      description: `Requested historical Hedera anchoring (job ${job.id})`,
      metadata: { jobId: job.id },
    });
  }

  return update;
}
