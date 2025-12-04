import { expect } from "chai";
import { startNext, stopNext, baseUrl } from "./server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session-manager";

describe("Integration: Payroll end-to-end flow", function () {
  this.timeout(120000);

  let company: any;
  let staffUser: any;
  let adminUser: any;
  let staffStaff: any; // companyStaff record for the staff user
  let adminStaff: any; // companyStaff for admin
  let staffSession: any;
  let adminSession: any;

  before(async () => {
    // Start Next dev server
    await startNext();

    // Create test company and users in DB
    company = await db.company.create({
      data: {
        name: `Test Company - payroll e2e ${Date.now()}`,
        slug: `test-payroll-e2e-${Date.now()}`,
      },
    });

    staffUser = await db.user.create({
      data: {
        name: "E2E Staff",
        email: `staff+${Date.now()}@example.test`,
        role: "STAFF",
        isActive: true,
      },
    });

    adminUser = await db.user.create({
      data: {
        name: "E2E Admin",
        email: `admin+${Date.now()}@example.test`,
        role: "ADMIN",
        isActive: true,
      },
    });

    // Create companyStaff
    staffStaff = await db.companyStaff.create({
      data: {
        userId: staffUser.id,
        companyId: company.id,
        role: "STAFF",
        payRate: 25.0,
        canReceivePayroll: true,
        currency: "USD",
      },
    });

    adminStaff = await db.companyStaff.create({
      data: {
        userId: adminUser.id,
        companyId: company.id,
        role: "ADMIN",
      },
    });

    // Create sessions
    staffSession = await createSession({ userId: staffUser.id });
    adminSession = await createSession({ userId: adminUser.id });
  });

  after(async () => {
    // Cleanup created test rows - best effort
    try {
      await db.timeEntry.deleteMany({ where: { companyId: company.id } });
      await db.payrollEntry.deleteMany({
        where: { ledger: { companyId: company.id } },
      });
      await db.ledger.deleteMany({ where: { companyId: company.id } });
      await db.companyStaff.deleteMany({ where: { companyId: company.id } });
      await db.user.deleteMany({
        where: { id: { in: [staffUser.id, adminUser.id] } },
      });
      await db.company.delete({ where: { id: company.id } });
      await db.session.deleteMany({
        where: { userId: { in: [staffUser.id, adminUser.id] } },
      });
    } catch (err) {
      // ignore cleanup errors
      console.warn("E2E payroll cleanup error:", err);
    }

    await stopNext();
  });

  it("staff clocks in/out -> admin approves -> run payroll -> creates payroll entry and updates ledger", async () => {
    // Staff: clock in
    const clockInRes = await fetch(`${baseUrl}/api/time-tracking/clock-in`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `sessionToken=${staffSession.sessionToken}`,
      },
      body: JSON.stringify({ companyId: company.id }),
    });

    expect(clockInRes.ok).to.equal(true);
    const clockInBody = await clockInRes.json();
    const timeEntry = clockInBody.timeEntry;
    expect(timeEntry).to.have.property("id");

    // Move clockIn earlier so the later clock-out records hours
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    await db.timeEntry.update({
      where: { id: timeEntry.id },
      data: { clockIn: eightHoursAgo },
    });

    // Staff: clock out
    const clockOutRes = await fetch(`${baseUrl}/api/time-tracking/clock-out`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `sessionToken=${staffSession.sessionToken}`,
      },
      body: JSON.stringify({ companyId: company.id }),
    });

    expect(clockOutRes.ok).to.equal(true);
    const clockOutBody = await clockOutRes.json();
    expect(clockOutBody.timeEntry.status).to.equal("CLOCKED_OUT");

    const completeEntry = await db.timeEntry.findUnique({
      where: { id: timeEntry.id },
    });
    expect(completeEntry?.totalMinutes).to.be.greaterThan(0);

    // Admin: approve the entry
    const approveRes = await fetch(`${baseUrl}/api/time-tracking/approve`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `sessionToken=${adminSession.sessionToken}`,
      },
      body: JSON.stringify({ entryId: timeEntry.id }),
    });

    expect(approveRes.ok).to.equal(true);
    const approveBody = await approveRes.json();
    expect(approveBody.entry.isApproved).to.equal(true);

    // Admin: run payroll
    const payRes = await fetch(`${baseUrl}/api/payroll/process`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `sessionToken=${adminSession.sessionToken}`,
      },
      body: JSON.stringify({ companyId: company.id }),
    });

    expect(payRes.ok).to.equal(true);
    const payBody = await payRes.json();
    expect(payBody.success).to.equal(true);

    // Verify payroll entry created
    const createdPayroll = await db.payrollEntry.findFirst({
      where: { staffId: staffStaff.id },
    });
    expect(createdPayroll).to.exist;

    // Verify ledger updated
    const ledger = await db.ledger.findUnique({
      where: { companyId: company.id },
    });
    expect(ledger).to.exist;
    // ledger.totalPayroll should reflect gross > 0
    expect(Number(ledger?.totalPayroll || 0)).to.be.greaterThan(0);
  });
});
