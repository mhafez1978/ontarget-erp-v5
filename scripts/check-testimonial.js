const { db } = require("./db.mjs");
(async () => {
  const prisma = db;
  try {
    const r = await prisma.testimonial.findUnique({
      where: { id: "cmiqja54d002pxopkw9x3b9lo" },
    });
    console.log(JSON.stringify(r, null, 2));
  } catch (err) {
    console.error("error", err);
  } finally {
  }
})();
