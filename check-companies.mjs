import { db } from "./scripts/db.mjs";

const prisma = db;

async function checkSuperAdminCompanies() {
  try {
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      include: { ownedCompanies: true },
    });

    if (!superAdmin) {
      console.log("No super admin found in database");
      return;
    }

    console.log("Super Admin:", superAdmin.email);
    console.log("Companies owned:", superAdmin.ownedCompanies.length);

    if (superAdmin.ownedCompanies.length > 0) {
      console.log("\nCompanies:");
      superAdmin.ownedCompanies.forEach((company, index) => {
        console.log(`  ${index + 1}. ${company.name}`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdminCompanies();
