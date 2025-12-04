const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function approve(id) {
  try {
    const updated = await prisma.testimonial.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    console.log("Updated:", updated);
  } catch (err) {
    console.error("Error approving testimonial:", err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (!process.argv[2]) {
  console.error("Usage: node scripts/approve-testimonial.js <testimonialId>");
  process.exit(1);
}

approve(process.argv[2]);
