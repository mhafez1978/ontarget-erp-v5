import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  TaxCalculator,
  type TaxConfig,
  type TaxWithholdingConfig,
} from "./tax-calculator";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import type {
  PayrollProcessResult,
  PayrollProcessResultEntry,
  PayrollProcessSkippedEntry,
  PayrollSummaryCurrencyTotal,
} from "./types";

const { Decimal } = Prisma;

const DEFAULT_TAX_CONFIG: TaxConfig = {
  incomeTax: { type: "NONE" },
  payrollTaxes: {},
};

interface PayrollProcessOptions {
  payDate?: Date;
  cutoff?: Date;
}

/**
 * Processes approved time entries for a company and creates payroll entries.
 * Returns a summary of what was created along with any skipped entries.
 */
export async function processPayrollForCompany(
  companyId: string,
  options?: PayrollProcessOptions
): Promise<PayrollProcessResult> {
  const payDate = options?.payDate ? new Date(options.payDate) : new Date();

  // Don't eagerly query for the ledger — we only need it when we actually have
  // pending payroll entries to process. Deferring the lookup/creation avoids
  // unnecessary DB writes and simplifies unit testing.
  let ledger: { id: string; totalPayroll: Prisma.Decimal } | null = null;

  const pendingEntries = await db.timeEntry.findMany({
    where: {
      companyId,
      isApproved: true,
      status: "CLOCKED_OUT",
      payrollEntryId: null,
      ...(options?.cutoff ? { clockOut: { lt: options.cutoff } } : {}),
    },
    include: {
      staff: {
        include: {
          payrollJurisdiction: true,
        },
      },
    },
    orderBy: { clockIn: "asc" },
  });

  if (pendingEntries.length === 0) {
    return {
      companyId,
      processedTimeEntries: 0,
      payrollEntriesCreated: 0,
      currencyBreakdown: [],
      payrollEntries: [],
    };
  }

  // If we have pending entries and a ledger hasn't been resolved yet, try to
  // find the company's ledger and create one if necessary.
  ledger = await db.ledger.findUnique({ where: { companyId } });
  if (!ledger) {
    ledger = await db.ledger.create({
      data: {
        companyId,
        totalRevenue: new Decimal(0),
        totalExpenses: new Decimal(0),
        totalPayroll: new Decimal(0),
        currentBalance: new Decimal(0),
      },
    });
  }

  type PendingEntry = (typeof pendingEntries)[number];

  const staffGroups = new Map<
    string,
    { staff: PendingEntry["staff"]; entries: PendingEntry[] }
  >();

  for (const entry of pendingEntries) {
    if (!entry.staff) {
      continue;
    }

    const group = staffGroups.get(entry.staffId);
    if (group) {
      group.entries.push(entry);
    } else {
      staffGroups.set(entry.staffId, {
        staff: entry.staff,
        entries: [entry],
      });
    }
  }

  const payrollEntries: PayrollProcessResultEntry[] = [];
  const skippedTimeEntries: PayrollProcessSkippedEntry[] = [];
  const currencyTotals = new Map<
    string,
    { gross: number; net: number; taxes: number; entries: number }
  >();
  let processedEntriesCount = 0;
  let totalPayrollDelta = new Decimal(0);

  for (const { staff, entries } of staffGroups.values()) {
    const payRate = staff.payRate ? new Decimal(staff.payRate) : new Decimal(0);
    if (payRate.lte(0)) {
      const reason = "Missing or invalid pay rate";
      skippedTimeEntries.push({
        entryId: entries[0].id,
        staffId: staff.id,
        reason,
      });
      // Audit and defensive log
      try {
        await createAuditLog({
          action: AUDIT_ACTIONS.PAYROLL_ENTRY_SKIPPED,
          companyId,
          entityType: "TimeEntry",
          entityId: entries[0].id,
          description: `Skipped payroll processing for staff ${staff.id}: ${reason}`,
          metadata: { staffId: staff.id, reason },
        });
      } catch (err) {
        console.error(
          "Failed to write audit log for skipped payroll entry:",
          err
        );
      }

      console.warn(`Payroll: skipping staff ${staff.id} - ${reason}`);
      continue;
    }

    const clockInTimes = entries.map((entry) => entry.clockIn.getTime());
    const clockOutTimes = entries.map(
      (entry) => entry.clockOut?.getTime() ?? entry.clockIn.getTime()
    );

    const periodStart = new Date(Math.min(...clockInTimes));
    const periodEnd = new Date(Math.max(...clockOutTimes));

    const totalMinutes = entries.reduce((sum, entry) => {
      if (entry.totalMinutes !== null && entry.totalMinutes !== undefined) {
        return sum + entry.totalMinutes;
      }

      if (entry.clockOut) {
        const durationMinutes = Math.floor(
          (entry.clockOut.getTime() - entry.clockIn.getTime()) / 60000 -
            (entry.breakMinutes || 0)
        );
        return sum + Math.max(0, durationMinutes);
      }

      return sum;
    }, 0);

    if (totalMinutes <= 0) {
      const reason = "No recorded hours on approved entries";
      skippedTimeEntries.push({
        entryId: entries[0].id,
        staffId: staff.id,
        reason,
      });
      try {
        await createAuditLog({
          action: AUDIT_ACTIONS.PAYROLL_ENTRY_SKIPPED,
          companyId,
          entityType: "TimeEntry",
          entityId: entries[0].id,
          description: `Skipped payroll processing for staff ${staff.id}: ${reason}`,
          metadata: { staffId: staff.id, reason },
        });
      } catch (err) {
        console.error(
          "Failed to write audit log for skipped payroll entry:",
          err
        );
      }

      console.warn(`Payroll: skipping staff ${staff.id} - ${reason}`);
      continue;
    }

    const hoursWorked = new Decimal(totalMinutes).div(60);
    const grossPay = payRate.mul(hoursWorked);

    const yearStart = new Date(payDate.getFullYear(), 0, 1);
    const priorPayroll = await db.payrollEntry.aggregate({
      where: {
        staffId: staff.id,
        payDate: {
          gte: yearStart,
          lt: payDate,
        },
      },
      _sum: {
        grossAmount: true,
      },
    });

    const yearToDateGross = priorPayroll._sum.grossAmount
      ? parseFloat(priorPayroll._sum.grossAmount.toString())
      : 0;

    const jurisdictionTaxConfig = staff.payrollJurisdiction?.taxConfig as
      | TaxConfig
      | undefined;

    const taxConfig = jurisdictionTaxConfig || DEFAULT_TAX_CONFIG;

    const withholdingConfig = staff.taxWithholdingConfig as
      | TaxWithholdingConfig
      | undefined;

    const taxBreakdown = TaxCalculator.calculatePayroll(grossPay, taxConfig, {
      withholding: withholdingConfig,
      yearToDateGross,
    });

    const netPay = new Decimal(taxBreakdown.totals.netPay);
    const taxes = new Decimal(taxBreakdown.totals.totalTaxes);
    const deductions = new Decimal(taxBreakdown.totals.totalDeductions);
    const currency = staff.currency || "USD";

    const payrollEntry = await db.payrollEntry.create({
      data: {
        ledgerId: ledger.id,
        staffId: staff.id,
        jurisdictionId: staff.payrollJurisdictionId,
        periodStart,
        periodEnd,
        payDate,
        currency,
        hoursWorked,
        overtimeHours: new Decimal(0),
        grossAmount: grossPay,
        taxWithheld: taxes,
        deductions,
        netAmount: netPay,
        taxBreakdown: taxBreakdown as unknown as Prisma.InputJsonValue,
        status: "PENDING",
      },
    });

    // Audit the creation of the payroll entry
    try {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYROLL_ENTRY_CREATED,
        companyId,
        entityType: "PayrollEntry",
        entityId: payrollEntry.id,
        description: `Payroll entry created for staff ${staff.id}`,
        metadata: {
          staffId: staff.id,
          payrollEntryId: payrollEntry.id,
          gross: payrollEntry.grossAmount?.toString?.() ?? null,
          net: payrollEntry.netAmount?.toString?.() ?? null,
        },
      });
    } catch (err) {
      console.error(
        "Failed to write audit log for payroll entry creation:",
        err
      );
    }

    await db.timeEntry.updateMany({
      where: {
        id: {
          in: entries.map((entry) => entry.id),
        },
      },
      data: {
        payrollEntryId: payrollEntry.id,
      },
    });

    const currencySummary = currencyTotals.get(currency) || {
      gross: 0,
      net: 0,
      taxes: 0,
      entries: 0,
    };
    currencySummary.gross += parseFloat(grossPay.toFixed(2));
    currencySummary.net += parseFloat(netPay.toFixed(2));
    currencySummary.taxes += parseFloat(taxes.toFixed(2));
    currencySummary.entries += 1;
    currencyTotals.set(currency, currencySummary);

    payrollEntries.push({
      payrollEntryId: payrollEntry.id,
      staffId: staff.id,
      currency,
      grossAmount: grossPay.toFixed(2),
      netAmount: netPay.toFixed(2),
      taxes: taxes.toFixed(2),
    });

    processedEntriesCount += entries.length;
    totalPayrollDelta = totalPayrollDelta.add(grossPay);
  }

  if (totalPayrollDelta.gt(0)) {
    await db.ledger.update({
      where: { id: ledger.id },
      data: {
        totalPayroll: {
          increment: totalPayrollDelta,
        },
      },
    });

    // Log the payroll run
    try {
      await createAuditLog({
        action: AUDIT_ACTIONS.PAYROLL_RUN,
        companyId,
        entityType: "Ledger",
        entityId: ledger.id,
        description: `Payroll run processed: gross delta ${totalPayrollDelta.toFixed(
          2
        )}`,
        metadata: {
          delta: totalPayrollDelta.toFixed(2),
          entriesProcessed: processedEntriesCount,
        },
      });
    } catch (err) {
      console.error("Failed to write audit log for payroll run:", err);
    }
  }

  const currencyBreakdown: PayrollSummaryCurrencyTotal[] = Array.from(
    currencyTotals.entries()
  ).map(([currency, totals]) => ({
    currency,
    gross: totals.gross.toFixed(2),
    net: totals.net.toFixed(2),
    taxes: totals.taxes.toFixed(2),
    entries: totals.entries,
  }));

  return {
    companyId,
    processedTimeEntries: processedEntriesCount,
    payrollEntriesCreated: payrollEntries.length,
    currencyBreakdown,
    payrollEntries,
    skippedTimeEntries: skippedTimeEntries.length
      ? skippedTimeEntries
      : undefined,
  };
}
