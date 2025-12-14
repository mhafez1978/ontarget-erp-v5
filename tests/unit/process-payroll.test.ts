import { expect } from "chai";
import sinon from "sinon";
import { Decimal } from "@prisma/client/runtime/library";
import type { AuditLog, Ledger, CompanyStaff, TimeEntry } from "@prisma/client";

// Module under test
import * as payrollModule from "@/lib/payroll/process-payroll";
import { db } from "@/lib/db";
import { TaxCalculator } from "@/lib/payroll/tax-calculator";
import type { TaxBreakdown } from "@/lib/payroll/tax-calculator";
import * as audit from "@/lib/audit-log";

describe("processPayrollForCompany", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Prevent actual audit log writes during unit tests
    sandbox.stub(audit, "createAuditLog").resolves({} as AuditLog);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("returns an empty summary when there are no pending entries", async () => {
    // Replace the ledger and timeEntry delegates for this test with small fakes
    // so we don't touch the real DB.
    const originalLedger = (db as unknown as Record<string, any>).ledger;
    const originalTimeEntry = (db as unknown as Record<string, any>).timeEntry;

    try {
      (db as unknown as Record<string, unknown>).ledger = {
        ...originalLedger,
        findUnique: sandbox.stub().resolves(null),
        create: sandbox.stub().resolves({ id: "ledger-fake" } as Ledger),
      };

      (db as unknown as Record<string, unknown>).timeEntry = {
        ...originalTimeEntry,
        findMany: sandbox.stub().resolves([]),
      };

      const res = await payrollModule.processPayrollForCompany("company-123");

      expect(res.companyId).to.equal("company-123");
      expect(res.processedTimeEntries).to.equal(0);
      expect(res.payrollEntriesCreated).to.equal(0);
      expect(res.payrollEntries).to.be.an("array").that.is.empty; // eslint-disable-line @typescript-eslint/no-unused-expressions
      expect(res.currencyBreakdown).to.be.an("array").that.is.empty; // eslint-disable-line @typescript-eslint/no-unused-expressions
    } finally {
      (db as unknown as Record<string, unknown>).ledger = originalLedger;
      (db as unknown as Record<string, unknown>).timeEntry = originalTimeEntry;
    }
  });

  it("creates payroll entries and updates ledger for a single staff with valid pay rate", async () => {
    // Prepare fake data for a single staff and one time entry
    const fakeLedger = { id: "ledger-1" } as Ledger;

    const staff: Partial<CompanyStaff> = {
      id: "staff-1",
      payRate: new Decimal(20),
      payrollJurisdictionId: null,
      currency: "USD",
    };

    const entry: Partial<TimeEntry> & { staff: Partial<CompanyStaff> } = {
      id: "entry-1",
      staffId: staff.id!,
      companyId: "company-123",
      clockIn: new Date("2025-01-01T09:00:00Z"),
      clockOut: new Date("2025-01-01T17:00:00Z"),
      breakMinutes: 0,
      totalMinutes: null,
      status: "CLOCKED_OUT",
      staff,
    };

    // Replace delegate methods with stubs for the duration of this test so we
    // never call the real DB.
    const originalLedger = (db as unknown as Record<string, any>).ledger;
    const originalTimeEntry = (db as unknown as Record<string, any>).timeEntry;
    const originalPayrollEntry = (db as unknown as Record<string, any>)
      .payrollEntry;

    try {
      const ledgerFindUniqueStub = sandbox.stub().resolves(null);
      const ledgerCreateStub = sandbox.stub().resolves(fakeLedger);
      const ledgerUpdateStub = sandbox.stub().resolves({});

      const timeEntryFindManyStub = sandbox.stub().resolves([entry]);
      const timeEntryUpdateManyStub = sandbox.stub().resolves({ count: 1 });

      const payrollEntryAggregateStub = sandbox
        .stub()
        .resolves({ _sum: { grossAmount: null } });
      const payrollEntryCreateStub = sandbox
        .stub()
        .resolves({ id: "payroll-1" });

      (db as unknown as Record<string, unknown>).ledger = {
        ...originalLedger,
        findUnique: ledgerFindUniqueStub,
        create: ledgerCreateStub,
        update: ledgerUpdateStub,
      };

      (db as unknown as Record<string, unknown>).timeEntry = {
        ...originalTimeEntry,
        findMany: timeEntryFindManyStub,
        updateMany: timeEntryUpdateManyStub,
      };

      (db as unknown as Record<string, unknown>).payrollEntry = {
        ...originalPayrollEntry,
        aggregate: payrollEntryAggregateStub,
        create: payrollEntryCreateStub,
      };

      // Make TaxCalculator.calculatePayroll deterministic
      const taxResult: TaxBreakdown = {
        totals: {
          netPay: 120.0,
          totalTaxes: 40.0,
          totalDeductions: 0.0,
        },
        federalIncomeTax: 10,
        stateIncomeTax: 5,
        localIncomeTax: 0,
        socialSecurity: 10,
        medicare: 5,
        medicareAdditional: 0,
        stateUnemployment: 0,
        stateDisabilityInsurance: 0,
      };

      sandbox.stub(TaxCalculator, "calculatePayroll").returns(taxResult);

      const res = await payrollModule.processPayrollForCompany("company-123", {
        payDate: new Date("2025-01-02"),
      });

      expect(res.companyId).to.equal("company-123");
      expect(res.processedTimeEntries).to.equal(1);
      expect(res.payrollEntriesCreated).to.equal(1);
      expect(res.payrollEntries).to.be.an("array").with.lengthOf(1);

      const created = res.payrollEntries![0];
      expect(created.staffId).to.equal(staff.id);
      expect(created.currency).to.equal("USD");

      // Ensure updateMany was called with the created payroll entry id
      expect(
        (db as unknown as Record<string, any>).timeEntry.updateMany.calledOnce
      ).to.equal(true);
      // Ensure ledger.update was called to increment totalPayroll
      expect(
        (db as unknown as Record<string, any>).ledger.update.calledOnce
      ).to.equal(true);
    } finally {
      // Restore original delegates
      (db as unknown as Record<string, any>).ledger = originalLedger;
      (db as unknown as Record<string, any>).timeEntry = originalTimeEntry;
      (db as unknown as Record<string, any>).payrollEntry =
        originalPayrollEntry;
    }
  });
});
