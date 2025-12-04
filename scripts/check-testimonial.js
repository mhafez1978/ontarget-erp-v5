const { PrismaClient } = require('@prisma/client');
(async () => {
  const db = new PrismaClient();
  try {
    const r = await db.testimonial.findUnique({ where: { id: 'cmiqja54d002pxopkw9x3b9lo' } });
    console.log(JSON.stringify(r, null, 2));
  } catch (err) {
    console.error('error', err);
  } finally {
    await db.$disconnect();
  }
})();
