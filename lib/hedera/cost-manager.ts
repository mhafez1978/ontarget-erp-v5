import { db } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Cost Management Service for Hedera Blockchain Integration
 * Handles balance tracking, budget limits, and transaction cost monitoring
 */

export interface CostCheckResult {
  canProceed: boolean;
  reason?: string;
  currentBalance?: Decimal;
  estimatedCost?: Decimal;
  budgetRemaining?: Decimal;
}

export interface BalanceInfo {
  currentBalance: Decimal;
  lowBalanceThreshold: Decimal;
  isLow: boolean;
  lastCheck: Date | null;
}

/**
 * Check if a transaction can proceed based on balance and budget constraints
 */
export async function canAffordTransaction(
  companyId?: string
): Promise<CostCheckResult> {
  try {
    // Get global Hedera settings
    const settings = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (!settings) {
      return {
        canProceed: false,
        reason: "Hedera is not configured or active",
      };
    }

    const estimatedCost = settings.estimatedCostPerTx;
    const currentBalance = settings.currentBalance;

    // Check global balance
    if (!currentBalance || currentBalance.lessThan(estimatedCost)) {
      return {
        canProceed: false,
        reason: "Insufficient global Hedera balance",
        currentBalance: currentBalance || new Decimal(0),
        estimatedCost,
      };
    }

    // Check if balance is below threshold (warning but can proceed)
    const isLowBalance = currentBalance.lessThan(settings.lowBalanceThreshold);
    if (isLowBalance && !settings.balanceAlertSent) {
      await createBalanceAlert(
        "LOW_BALANCE",
        "WARNING",
        settings.lowBalanceThreshold
      );
      await db.hederaSetting.update({
        where: { id: settings.id },
        data: { balanceAlertSent: true },
      });
    }

    // Check company-specific budget if applicable
    if (companyId) {
      const companySetting = await db.companyHederaSetting.findUnique({
        where: { companyId },
      });

      if (companySetting?.monthlyBudgetHbar) {
        const budgetRemaining = companySetting.monthlyBudgetHbar.minus(
          companySetting.currentMonthSpent
        );

        if (budgetRemaining.lessThan(estimatedCost)) {
          return {
            canProceed: false,
            reason: "Company monthly budget exceeded",
            currentBalance,
            estimatedCost,
            budgetRemaining,
          };
        }

        // Check if approaching budget limit (80%)
        const budgetUsedPercent = companySetting.currentMonthSpent
          .dividedBy(companySetting.monthlyBudgetHbar)
          .times(100);

        if (
          budgetUsedPercent.greaterThan(80) &&
          !companySetting.budgetExceeded
        ) {
          await createCompanyBudgetAlert(
            companyId,
            "BUDGET_WARNING",
            "WARNING",
            budgetUsedPercent.toNumber()
          );
        }
      }
    }

    return {
      canProceed: true,
      currentBalance,
      estimatedCost,
    };
  } catch (error) {
    console.error("Cost check failed:", error);
    return {
      canProceed: false,
      reason: "Cost check error: " + (error as Error).message,
    };
  }
}

/**
 * Record a transaction cost after successful submission
 */
export async function recordTransactionCost(params: {
  companyId?: string;
  hash: string;
  topicId: string;
  transactionId?: string;
  consensusTimestamp?: Date;
  costHbar?: Decimal;
  balanceAfter?: Decimal;
  auditLogId?: string;
  outboxJobId?: string;
}): Promise<void> {
  try {
    const settings = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (!settings) return;

    const cost = params.costHbar || settings.estimatedCostPerTx;

    // Create transaction record
    await db.hederaTransaction.create({
      data: {
        companyId: params.companyId,
        hash: params.hash,
        topicId: params.topicId,
        transactionId: params.transactionId,
        consensusTimestamp: params.consensusTimestamp,
        costHbar: cost,
        balanceAfter: params.balanceAfter,
        auditLogId: params.auditLogId,
        outboxJobId: params.outboxJobId,
        status: params.transactionId ? "CONFIRMED" : "PENDING",
      },
    });

    // Update global stats
    await db.hederaSetting.update({
      where: { id: settings.id },
      data: {
        totalTransactions: { increment: 1 },
        totalCostHbar: { increment: cost },
        currentBalance: params.balanceAfter || { decrement: cost },
        lastBalanceCheck: new Date(),
      },
    });

    // Update company stats if applicable
    if (params.companyId) {
      const companySetting = await db.companyHederaSetting.findUnique({
        where: { companyId: params.companyId },
      });

      if (companySetting) {
        await db.companyHederaSetting.update({
          where: { companyId: params.companyId },
          data: {
            transactionCount: { increment: 1 },
            currentMonthSpent: { increment: cost },
          },
        });

        // Check if budget exceeded
        if (companySetting.monthlyBudgetHbar) {
          const newSpent = companySetting.currentMonthSpent.add(cost);
          if (newSpent.greaterThanOrEqualTo(companySetting.monthlyBudgetHbar)) {
            await db.companyHederaSetting.update({
              where: { companyId: params.companyId },
              data: { budgetExceeded: true },
            });
            await createCompanyBudgetAlert(
              params.companyId,
              "BUDGET_EXCEEDED",
              "CRITICAL",
              100
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to record transaction cost:", error);
    // Don't throw - this is tracking only, don't block the transaction
  }
}

/**
 * Update account balance from Hedera network
 */
export async function updateAccountBalance(
  balanceHbar: Decimal
): Promise<void> {
  try {
    const settings = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (!settings) return;

    const wasLow = settings.balanceAlertSent;
    const isNowLow = balanceHbar.lessThan(settings.lowBalanceThreshold);

    // Reset alert if balance recovered
    const balanceAlertSent = isNowLow ? wasLow : false;

    await db.hederaSetting.update({
      where: { id: settings.id },
      data: {
        currentBalance: balanceHbar,
        lastBalanceCheck: new Date(),
        balanceAlertSent,
      },
    });

    // Critical balance alert (below 50% of threshold)
    const criticalThreshold = settings.lowBalanceThreshold.dividedBy(2);
    if (balanceHbar.lessThan(criticalThreshold)) {
      await createBalanceAlert(
        "BALANCE_CRITICAL",
        "CRITICAL",
        criticalThreshold
      );
    }
  } catch (error) {
    console.error("Failed to update balance:", error);
  }
}

/**
 * Get current balance information
 */
export async function getBalanceInfo(): Promise<BalanceInfo | null> {
  try {
    const settings = await db.hederaSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (!settings) return null;

    return {
      currentBalance: settings.currentBalance || new Decimal(0),
      lowBalanceThreshold: settings.lowBalanceThreshold,
      isLow: settings.currentBalance
        ? settings.currentBalance.lessThan(settings.lowBalanceThreshold)
        : true,
      lastCheck: settings.lastBalanceCheck,
    };
  } catch (error) {
    console.error("Failed to get balance info:", error);
    return null;
  }
}

/**
 * Reset monthly budgets for all companies
 * Should be called via cron job at the start of each month
 */
export async function resetMonthlyBudgets(): Promise<void> {
  try {
    await db.companyHederaSetting.updateMany({
      where: {
        monthlyBudgetHbar: { not: null },
      },
      data: {
        currentMonthSpent: new Decimal(0),
        budgetResetDate: new Date(),
        budgetExceeded: false,
      },
    });
  } catch (error) {
    console.error("Failed to reset monthly budgets:", error);
  }
}

/**
 * Get company cost statistics
 */
export async function getCompanyCostStats(companyId: string) {
  try {
    const [companySetting, transactions] = await Promise.all([
      db.companyHederaSetting.findUnique({
        where: { companyId },
      }),
      db.hederaTransaction.findMany({
        where: { companyId, status: "CONFIRMED" },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    if (!companySetting) return null;

    const totalCost = transactions.reduce(
      (sum, tx) => sum.add(tx.costHbar || new Decimal(0)),
      new Decimal(0)
    );

    return {
      transactionCount: companySetting.transactionCount,
      currentMonthSpent: companySetting.currentMonthSpent,
      monthlyBudget: companySetting.monthlyBudgetHbar,
      budgetRemaining: companySetting.monthlyBudgetHbar
        ? companySetting.monthlyBudgetHbar.minus(
            companySetting.currentMonthSpent
          )
        : null,
      budgetExceeded: companySetting.budgetExceeded,
      totalHistoricalCost: totalCost,
      recentTransactions: transactions,
    };
  } catch (error) {
    console.error("Failed to get company cost stats:", error);
    return null;
  }
}

/**
 * Create a balance alert
 */
async function createBalanceAlert(
  alertType: string,
  severity: string,
  threshold: Decimal
): Promise<void> {
  await db.hederaCostAlert.create({
    data: {
      alertType,
      severity,
      message: `Hedera account balance below ${threshold.toString()} HBAR`,
      companyId: null,
    },
  });
}

/**
 * Create a company budget alert
 */
async function createCompanyBudgetAlert(
  companyId: string,
  alertType: string,
  severity: string,
  percentUsed: number
): Promise<void> {
  await db.hederaCostAlert.create({
    data: {
      alertType,
      severity,
      message: `Company has used ${percentUsed.toFixed(
        0
      )}% of monthly Hedera budget`,
      companyId,
    },
  });
}

/**
 * Get unacknowledged alerts
 */
export async function getUnacknowledgedAlerts(companyId?: string) {
  return db.hederaCostAlert.findMany({
    where: {
      acknowledged: false,
      OR: [{ companyId: null }, { companyId }],
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await db.hederaCostAlert.update({
    where: { id: alertId },
    data: { acknowledged: true },
  });
}
