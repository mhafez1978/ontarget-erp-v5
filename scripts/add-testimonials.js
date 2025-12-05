const { db } = require("./db.mjs");

const prisma = db;

async function addMany(companyId, count = 9) {
  const samples = Array.from({ length: count }).map((_, i) => ({
    customerName: `Auto Test ${i + 1}`,
    customerEmail: `test+guest${i + 1}@example.com`,
    customerTitle: `QA Tester ${i + 1}`,
    rating: (i % 5) + 1,
    testimonial: `This is automated testimonial #${
      i + 1
    } for manual approval testing.`,
    companyId,
    status: "PENDING",
  }));

  try {
    const created = [];
    for (const s of samples) {
      const t = await prisma.testimonial.create({ data: s });
      created.push(t);
    }

    console.log(`Created ${created.length} testimonials`);
    created.forEach((c) => console.log(c.id, c.customerName, c.status));
  } catch (err) {
    console.error("Error creating testimonials:", err.message || err);
    process.exitCode = 1;
  } finally {
  }
}

const companyId = process.argv[2];
const count = parseInt(process.argv[3] || "9", 10);

if (!companyId) {
  console.error("Usage: node scripts/add-testimonials.js <companyId> [count]");
  process.exit(1);
}

addMany(companyId, count);
