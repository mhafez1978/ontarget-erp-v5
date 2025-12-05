import { db } from "./scripts/db.mjs";

const prisma = db;

async function main() {
  const rootCompany = await prisma.company.findFirst({
    where: { isRoot: true },
    select: {
      id: true,
      name: true,
      logo: true,
      logoLight: true,
      logoDark: true,
    },
  });

  console.log("Root Company Data:");
  console.log(JSON.stringify(rootCompany, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
