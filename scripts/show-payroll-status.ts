import { PrismaClient } from "@prisma/client";
import type { TaxConfig, TaxBreakdown } from "../lib/payroll/tax-calculator";

const prisma = new PrismaClient();

/**
 * Display comprehensive payroll system status
 */

async function showPayrollStatus() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("📊 MULTI-JURISDICTION PAYROLL SYSTEM STATUS");
  console.log("═══════════════════════════════════════════════════════\n");

  const jurisdictions = await prisma.payrollJurisdiction.findMany({
    orderBy: { code: "asc" },
  });

  jurisdictions.forEach((j) => {
    const taxConfig = j.taxConfig as unknown as TaxConfig;
    const incomeTaxType = taxConfig?.incomeTax?.type || "UNKNOWN";
    const forms = Array.isArray(j.requiredForms)
      ? j.requiredForms.join(", ")
      : typeof j.requiredForms === "string"
      ? j.requiredForms
      : "N/A";

    console.log(`✓ ${j.code.padEnd(12)} ${j.name}`);
    console.log(`  Tax Type: ${incomeTaxType}`);
    console.log(`  Filing: ${j.filingFrequency || "N/A"}`);
    console.log(`  Forms: ${forms}\n`);
  });

  // Staff with payroll config
  console.log("═══════════════════════════════════════════════════════");
  console.log("👥 STAFF WITH PAYROLL CONFIGURATION:\n");

  const staffWithPayroll = await prisma.companyStaff.findMany({
    where: {
      payrollJurisdictionId: { not: null },
    },
    include: {
      user: true,
      company: true,
      payrollJurisdiction: true,
    },
  });

  if (staffWithPayroll.length === 0) {
    console.log("⚠️  No staff configured for payroll yet\n");
  } else {
    staffWithPayroll.forEach((s) => {
      console.log(`👤 ${s.user.name}`);
      console.log(`   Company: ${s.company.name}`);
      console.log(`   Classification: ${s.employmentClassification}`);
      console.log(
        `   Pay Rate: $${s.payRate}/${s.payFrequency?.toLowerCase()}`
      );
      console.log(
        `   Jurisdiction: ${s.payrollJurisdiction?.name} (${s.payrollJurisdiction?.code})`
      );
      console.log(`   Currency: ${s.currency}\n`);
    });
  }

  // Payroll entries
  console.log("═══════════════════════════════════════════════════════");
  console.log("💰 PAYROLL ENTRIES:\n");

  const payrollEntries = await prisma.payrollEntry.findMany({
    include: {
      staff: {
        include: {
          user: true,
        },
      },
      jurisdiction: true,
      ledger: {
        include: {
          company: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (payrollEntries.length === 0) {
    console.log("⚠️  No payroll entries yet\n");
  } else {
    payrollEntries.forEach((p) => {
      const taxBreakdown = p.taxBreakdown as unknown as TaxBreakdown;
      console.log(`📋 Payroll Entry: ${p.id}`);
      console.log(`   Employee: ${p.staff.user.name}`);
      console.log(`   Company: ${p.ledger.company.name}`);
      console.log(`   Jurisdiction: ${p.jurisdiction?.name || "N/A"}`);
      console.log(
        `   Period: ${p.periodStart.toLocaleDateString()} - ${p.periodEnd.toLocaleDateString()}`
      );
      console.log(`   Pay Date: ${p.payDate.toLocaleDateString()}`);
      console.log(`   Status: ${p.status}`);
      console.log(`   ───────────────────────────────────`);
      console.log(
        `   Hours: ${p.hoursWorked || 0} regular + ${
          p.overtimeHours || 0
        } overtime`
      );
      console.log(`   Gross: ${p.currency} $${p.grossAmount}`);

      if (taxBreakdown) {
        console.log(`   Taxes:`);
        console.log(`     Federal: $${taxBreakdown.federalIncomeTax || 0}`);
        console.log(`     State: $${taxBreakdown.stateIncomeTax || 0}`);
        console.log(
          `     Social Security: $${taxBreakdown.socialSecurity || 0}`
        );
        console.log(`     Medicare: $${taxBreakdown.medicare || 0}`);
        if (taxBreakdown.stateDisabilityInsurance) {
          console.log(
            `     State Disability: $${taxBreakdown.stateDisabilityInsurance}`
          );
        }
        console.log(
          `     TOTAL TAXES: $${taxBreakdown.totals?.totalTaxes || 0}`
        );
      }

      console.log(`   💵 NET PAY: ${p.currency} $${p.netAmount}`);
      console.log(`   Created: ${p.createdAt.toLocaleString()}\n`);
    });
  }

  // Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("📈 SUMMARY STATISTICS:\n");

  const totalJurisdictions = await prisma.payrollJurisdiction.count();
  const totalStaffConfigured = await prisma.companyStaff.count({
    where: { payrollJurisdictionId: { not: null } },
  });
  const totalPayrollEntries = await prisma.payrollEntry.count();
  const totalPayrollAmount = await prisma.payrollEntry.aggregate({
    _sum: { grossAmount: true, netAmount: true },
  });

  console.log(`Jurisdictions: ${totalJurisdictions}`);
  console.log(`Staff Configured: ${totalStaffConfigured}`);
  console.log(`Total Payroll Entries: ${totalPayrollEntries}`);
  console.log(`Total Gross Paid: $${totalPayrollAmount._sum.grossAmount || 0}`);
  console.log(`Total Net Paid: $${totalPayrollAmount._sum.netAmount || 0}`);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("✅ PAYROLL SYSTEM OPERATIONAL");
  console.log("═══════════════════════════════════════════════════════\n");
}

showPayrollStatus()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
