import { db } from "./lib/db";

async function checkCurrentState() {
  console.log("=== CURRENT DATABASE STATE ===\n");

  try {
    // Companies
    const companies = await db.company.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        country: true,
        countryCode: true,
        _count: {
          select: {
            staff: true,
          },
        },
      },
    });
    console.log("📊 Companies:");
    companies.forEach((c) => {
      console.log(
        `  - ${c.name} (${c.country || "N/A"}) - ${c._count.staff} staff`
      );
    });

    // Staff
    const staff = await db.companyStaff.findMany({
      take: 10,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    });
    console.log("\n👥 Staff Members:");
    staff.forEach((s) => {
      console.log(
        `  - ${s.user.name || s.user.email} @ ${s.company.name} (${
          s.employmentType
        }) - ${s.country || "N/A"}`
      );
    });

    // Time Entries
    const timeEntries = await db.timeEntry.findMany({
      take: 10,
      orderBy: {
        clockIn: "desc",
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
    console.log("\n⏰ Recent Time Entries:");
    timeEntries.forEach((te) => {
      console.log(
        `  - ${te.staff.user.name || te.staff.user.email}: ${
          te.totalHours || "N/A"
        }hrs - ${te.status} - Approved: ${te.isApproved}`
      );
    });

    // Payroll Entries
    const payrollCount = await db.payrollEntry.count();
    console.log("\n💰 Payroll Entries Count:", payrollCount);

    await db.$disconnect();
  } catch (error) {
    console.error("Error:", error);
    await db.$disconnect();
    process.exit(1);
  }
}

checkCurrentState();
