const { db } = require("./db.mjs");

(async () => {
  const prisma = db;
  try {
    const testimonials = await prisma.testimonial.findMany({
      include: { company: { select: { id: true, slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    if (!testimonials || testimonials.length === 0) {
      console.log("No testimonials found in database.");
      process.exit(0);
    }

    const grouped = testimonials.reduce((acc, t) => {
      const key = t.company?.slug || "NO_COMPANY";
      acc[key] = acc[key] || [];
      acc[key].push({
        id: t.id,
        company: t.company?.name || t.companyId,
        status: t.status,
        isFeatured: t.isFeatured,
        rating: t.rating,
        customerName: t.customerName,
        createdAt: t.createdAt,
      });
      return acc;
    }, {});

    for (const slug of Object.keys(grouped)) {
      console.log("---", slug, "---");
      grouped[slug].forEach((t) => console.log(t));
    }
  } catch (err) {
    console.error("Error querying testimonials:", err.message || err);
    process.exit(1);
  } finally {
  }
})();
