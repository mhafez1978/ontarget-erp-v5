import { db } from "./lib/db";

async function checkUser() {
  const user = await db.user.findUnique({
    where: { email: "movewebdesign@gmail.com" },
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("User:", user.name, "- Role:", user.role);

  const staff = await db.companyStaff.findMany({
    where: { userId: user.id },
    include: {
      company: true,
      payrollJurisdiction: true,
    },
  });

  console.log("\nCompanies you are staff at:");
  staff.forEach((s) => {
    console.log(
      "  -",
      s.company.name,
      "(Role:",
      s.role,
      ") - ID:",
      s.companyId
    );
    console.log("    Employment:", s.employmentType);
    console.log(
      "    Payroll Configured:",
      s.payrollJurisdictionId ? "YES" : "NO"
    );
    if (s.payrollJurisdictionId) {
      console.log("    Pay Rate:", s.payRate?.toString() || "N/A");
      console.log("    Jurisdiction:", s.payrollJurisdiction?.code || "N/A");
    }
  });

  await db.$disconnect();
}

checkUser();
