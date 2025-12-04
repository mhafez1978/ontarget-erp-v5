import { expect } from "chai";
import sinon from "sinon";
import { Decimal } from "@prisma/client/runtime/library";

// Module under test
import * as payrollModule from "@/lib/payroll/process-payroll";
import { db } from "@/lib/db";
import { TaxCalculator } from "@/lib/payroll/tax-calculator";
import * as audit from "@/lib/audit-log";

describe("processPayrollForCompany", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Prevent actual audit log writes during unit tests
    sandbox.stub(audit, "createAuditLog").resolves({} as any);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("returns an empty summary when there are no pending entries", async () => {
    // Replace the ledger and timeEntry delegates for this test with small fakes
    // so we don't touch the real DB.
    const originalLedger = (db as any).ledger;
    const originalTimeEntry = (db as any).timeEntry;

    try {
      (db as any).ledger = {
        ...originalLedger,
        findUnique: sandbox.stub().resolves(null as any),
        create: sandbox.stub().resolves({ id: "ledger-fake" } as any),
      } as any;

      (db as any).timeEntry = {
        ...originalTimeEntry,
        findMany: sandbox.stub().resolves([] as any),
      } as any;

      const res = await payrollModule.processPayrollForCompany("company-123");

      expect(res.companyId).to.equal("company-123");
      expect(res.processedTimeEntries).to.equal(0);
      expect(res.payrollEntriesCreated).to.equal(0);
      expect(res.payrollEntries).to.be.an("array").that.is.empty;
      expect(res.currencyBreakdown).to.be.an("array").that.is.empty;
    } finally {
      (db as any).ledger = originalLedger;
      (db as any).timeEntry = originalTimeEntry;
    }
  });

  it("creates payroll entries and updates ledger for a single staff with valid pay rate", async () => {
    // Prepare fake data for a single staff and one time entry
    const fakeLedger = { id: "ledger-1" } as any;

    const staff = {
      id: "staff-1",
      payRate: new Decimal(20),
      payrollJurisdiction: null,
      payrollJurisdictionId: null,
      currency: "USD",
    } as any;

    const entry = {
      id: "entry-1",
      staffId: staff.id,
      companyId: "company-123",
      clockIn: new Date("2025-01-01T09:00:00Z"),
      clockOut: new Date("2025-01-01T17:00:00Z"),
      breakMinutes: 0,
      totalMinutes: null,
      status: "CLOCKED_OUT",
      staff,
    } as any;

    // Replace delegate methods with stubs for the duration of this test so we
    // never call the real DB.
    const originalLedger = (db as any).ledger;
    const originalTimeEntry = (db as any).timeEntry;
    const originalPayrollEntry = (db as any).payrollEntry;

    try {
      const ledgerFindUniqueStub = sandbox.stub().resolves(null as any);
      const ledgerCreateStub = sandbox.stub().resolves(fakeLedger as any);
      const ledgerUpdateStub = sandbox.stub().resolves({} as any);

      const timeEntryFindManyStub = sandbox.stub().resolves([entry] as any);
      const timeEntryUpdateManyStub = sandbox
        .stub()
        .resolves({ count: 1 } as any);

      const payrollEntryAggregateStub = sandbox
        .stub()
        .resolves({ _sum: { grossAmount: null } } as any);
      const payrollEntryCreateStub = sandbox
        .stub()
        .resolves({ id: "payroll-1" } as any);

      (db as any).ledger = {
        ...originalLedger,
        findUnique: ledgerFindUniqueStub,
        create: ledgerCreateStub,
        update: ledgerUpdateStub,
      } as any;

      (db as any).timeEntry = {
        ...originalTimeEntry,
        findMany: timeEntryFindManyStub,
        updateMany: timeEntryUpdateManyStub,
      } as any;

      (db as any).payrollEntry = {
        ...originalPayrollEntry,
        aggregate: payrollEntryAggregateStub,
        create: payrollEntryCreateStub,
      } as any;

      // Make TaxCalculator.calculatePayroll deterministic
      const taxResult = {
        totals: {
          netPay: "120.00",
          totalTaxes: "40.00",
          totalDeductions: "0.00",
        },
        federalIncomeTax: 10,
        stateIncomeTax: 5,
        localIncomeTax: 0,
        socialSecurity: 10,
        medicare: 5,
        medicareAdditional: 0,
        stateDisabilityInsurance: 0,
      } as any;

      sandbox.stub(TaxCalculator, "calculatePayroll").returns(taxResult as any);

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
      expect((db as any).timeEntry.updateMany.calledOnce).to.equal(true);
      // Ensure ledger.update was called to increment totalPayroll
      expect((db as any).ledger.update.calledOnce).to.equal(true);
    } finally {
      // Restore original delegates
      (db as any).ledger = originalLedger;
      (db as any).timeEntry = originalTimeEntry;
      (db as any).payrollEntry = originalPayrollEntry;
    }
  });
});
