import { db } from "../lib/db";
import { TaxCalculator } from "../lib/payroll/tax-calculator";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Test the multi-jurisdiction payroll system with real data
 *
 * Steps:
 * 1. Update Worker1 Staff with payroll configuration
 * 2. Calculate payroll for existing time entry
 * 3. Create PayrollEntry record
 * 4. Display detailed breakdown
 */

async function testPayrollSystem() {
  console.log("🧪 Testing Multi-Jurisdiction Payroll System\n");

  // Step 1: Find Worker1 Staff
  const staff = await db.companyStaff.findFirst({
    where: {
      user: {
        name: { contains: "Worker1 Staff" },
      },
    },
    include: {
      user: true,
      company: true,
    },
  });

  if (!staff) {
    console.error("❌ Worker1 Staff not found");
    return;
  }

  console.log(`👤 Found: ${staff.user.name} at ${staff.company.name}`);

  // Step 2: Get CA jurisdiction
  const caJurisdiction = await db.payrollJurisdiction.findUnique({
    where: { code: "US-CA" },
  });

  if (!caJurisdiction) {
    console.error("❌ US-CA jurisdiction not found");
    return;
  }

  console.log(`📍 Jurisdiction: ${caJurisdiction.name}\n`);

  // Step 3: Update staff with payroll configuration
  const updatedStaff = await db.companyStaff.update({
    where: { id: staff.id },
    data: {
      payrollJurisdictionId: caJurisdiction.id,
      employmentClassification: "W2_EMPLOYEE",
      payRate: new Decimal(25.0), // $25/hour
      payFrequency: "HOURLY",
      currency: "USD",
      countryCode: "US",
      taxWithholdingConfig: {
        filingStatus: "SINGLE",
        allowances: 1,
        additionalWithholding: 0,
      },
    },
  });

  console.log("✅ Updated staff with payroll configuration:");
  console.log(`   Classification: ${updatedStaff.employmentClassification}`);
  console.log(`   Pay Rate: $${updatedStaff.payRate}/hour`);
  console.log(`   Pay Frequency: ${updatedStaff.payFrequency}`);
  console.log(`   Currency: ${updatedStaff.currency}`);
  console.log(`   Jurisdiction: ${caJurisdiction.code}\n`);

  // Step 4: Find active time entry
  const timeEntry = await db.timeEntry.findFirst({
    where: {
      staffId: staff.id,
      status: "CLOCKED_IN",
    },
  });

  if (!timeEntry) {
    console.log("⚠️  No active time entry found for Worker1 Staff");
    console.log("   Creating a test time entry with 80 hours...\n");

    const testEntry = await db.timeEntry.create({
      data: {
        staffId: staff.id,
        companyId: staff.companyId,
        clockIn: new Date("2025-01-01T09:00:00Z"),
        clockOut: new Date("2025-01-15T17:00:00Z"),
        totalHours: new Decimal(80.0),
        status: "CLOCKED_OUT",
        isApproved: true,
        approvedBy: staff.id,
        approvedAt: new Date(),
      },
    });

    console.log(`✅ Created test time entry: ${testEntry.totalHours} hours\n`);

    // Calculate payroll for 80 hours
    await calculateAndCreatePayroll(
      updatedStaff,
      testEntry,
      caJurisdiction,
      new Decimal(80.0),
      staff.company,
      { name: staff.user.name ?? "Unknown" }
    );
  } else {
    console.log(`⏰ Found time entry: ${timeEntry.id}`);
    console.log(`   Status: ${timeEntry.status}`);

    // For demonstration, let's assume 80 hours for bi-weekly period
    const hoursWorked = new Decimal(80.0);
    console.log(`   Calculating for: ${hoursWorked} hours\n`);

    await calculateAndCreatePayroll(
      updatedStaff,
      timeEntry,
      caJurisdiction,
      hoursWorked,
      staff.company,
      { name: staff.user.name ?? "Unknown" }
    );
  }
}

async function calculateAndCreatePayroll(
  staff: {
    id: string;
    companyId: string;
    payRate: Decimal | null;
    currency: string | null;
    employmentClassification: string | null;
    taxWithholdingConfig: unknown;
  },
  timeEntry: { id: string },
  jurisdiction: { id: string; name: string; code: string; taxConfig: unknown },
  hoursWorked: Decimal,
  company: { name: string },
  user: { name: string }
) {
  console.log("💰 Calculating Payroll...\n");

  // Calculate gross pay
  const payRate = new Decimal(staff.payRate ?? 0);
  const grossPay = payRate.mul(hoursWorked);

  console.log(`📊 Gross Pay Calculation:`);
  console.log(`   Hours: ${hoursWorked}`);
  console.log(`   Rate: $${payRate}/hour`);
  console.log(`   Gross: $${grossPay.toFixed(2)}\n`);

  // Get tax configuration
  const taxConfig =
    jurisdiction.taxConfig as unknown as import("../lib/payroll/tax-calculator").TaxConfig;

  // Calculate taxes using TaxCalculator
  const taxBreakdown = TaxCalculator.calculatePayroll(grossPay, taxConfig, {
    withholding:
      staff.taxWithholdingConfig as unknown as import("../lib/payroll/tax-calculator").TaxWithholdingConfig,
    yearToDateGross: 0, // Assuming first paycheck
  });

  console.log(`📋 Tax Breakdown:`);
  console.log(
    `   Federal Income Tax:    $${taxBreakdown.federalIncomeTax.toFixed(2)}`
  );
  console.log(
    `   State Income Tax (CA): $${taxBreakdown.stateIncomeTax.toFixed(2)}`
  );
  console.log(
    `   Local Income Tax:      $${taxBreakdown.localIncomeTax.toFixed(2)}`
  );
  console.log(
    `   Social Security:       $${taxBreakdown.socialSecurity.toFixed(2)}`
  );
  console.log(`   Medicare:              $${taxBreakdown.medicare.toFixed(2)}`);
  console.log(
    `   Medicare Additional:   $${taxBreakdown.medicareAdditional.toFixed(2)}`
  );
  console.log(
    `   State Disability (CA): $${taxBreakdown.stateDisabilityInsurance.toFixed(
      2
    )}`
  );
  console.log(`   ────────────────────────────────────`);
  console.log(
    `   Total Taxes:           $${taxBreakdown.totals.totalTaxes.toFixed(2)}`
  );
  console.log(
    `   Total Deductions:      $${taxBreakdown.totals.totalDeductions.toFixed(
      2
    )}`
  );
  console.log(`   ────────────────────────────────────`);
  console.log(
    `   💵 NET PAY:            $${taxBreakdown.totals.netPay.toFixed(2)}\n`
  );

  // Get or create ledger for company
  let ledger = await db.ledger.findUnique({
    where: { companyId: staff.companyId },
  });

  if (!ledger) {
    console.log("📊 Creating ledger for company...");
    ledger = await db.ledger.create({
      data: {
        companyId: staff.companyId,
        totalRevenue: new Decimal(0),
        totalExpenses: new Decimal(0),
        totalPayroll: new Decimal(0),
        currentBalance: new Decimal(0),
      },
    });
    console.log(`✅ Ledger created: ${ledger.id}\n`);
  } else {
    console.log(`✅ Using existing ledger: ${ledger.id}\n`);
  }

  // Create PayrollEntry
  const payrollEntry = await db.payrollEntry.create({
    data: {
      ledgerId: ledger.id,
      staffId: staff.id,
      jurisdictionId: jurisdiction.id,
      periodStart: new Date("2025-01-01"),
      periodEnd: new Date("2025-01-15"),
      payDate: new Date("2025-01-20"),
      currency: staff.currency ?? "USD",
      hoursWorked: hoursWorked,
      overtimeHours: new Decimal(0),
      grossAmount: grossPay,
      netAmount: new Decimal(taxBreakdown.totals.netPay),
      taxBreakdown:
        taxBreakdown as unknown as import("@prisma/client").Prisma.InputJsonValue,
      status: "PENDING",
    },
  });

  // Link time entry to payroll entry
  await db.timeEntry.update({
    where: { id: timeEntry.id },
    data: { payrollEntryId: payrollEntry.id },
  });

  console.log(`✅ PayrollEntry created: ${payrollEntry.id}`);
  console.log(`   Status: ${payrollEntry.status}`);
  console.log(
    `   Pay Period: ${payrollEntry.periodStart.toLocaleDateString()} - ${payrollEntry.periodEnd.toLocaleDateString()}`
  );
  console.log(`   Pay Date: ${payrollEntry.payDate.toLocaleDateString()}\n`);

  // Display summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("✨ PAYROLL CALCULATION COMPLETE");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`Employee:     ${user.name}`);
  console.log(`Company:      ${company.name}`);
  console.log(`Jurisdiction: ${jurisdiction.name} (${jurisdiction.code})`);
  console.log(`Classification: ${staff.employmentClassification}`);
  console.log(`───────────────────────────────────────────────────────`);
  console.log(`Hours Worked: ${hoursWorked}`);
  console.log(`Pay Rate:     $${payRate}/hour`);
  console.log(`Gross Pay:    $${grossPay.toFixed(2)}`);
  console.log(`───────────────────────────────────────────────────────`);
  console.log(`Taxes:        $${taxBreakdown.totals.totalTaxes.toFixed(2)}`);
  console.log(
    `Deductions:   $${taxBreakdown.totals.totalDeductions.toFixed(2)}`
  );
  console.log(`───────────────────────────────────────────────────────`);
  console.log(`💵 NET PAY:   $${taxBreakdown.totals.netPay.toFixed(2)}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

testPayrollSystem()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
