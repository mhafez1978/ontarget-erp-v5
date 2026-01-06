import { db } from "@/lib/db";

export async function seed() {
  try {
    const slug = "movewebdesign";
    const company = await db.company.findUnique({ where: { slug } });
    if (!company) {
      console.error(`Company with slug=${slug} not found. Aborting.`);
      return;
    }

    const products = [
      {
        name: "Website Design — Starter",
        description:
          "A responsive brochure website for small businesses. Includes up to 5 pages and basic SEO.",
        price: "899.00",
        sku: "MWD-WEB-START",
        category: "Web Design",
        isPublished: true,
        isFeatured: true,
      },
      {
        name: "Website Design — Professional",
        description:
          "A professional custom website with improved performance, SEO optimization, and CMS integration.",
        price: "2499.00",
        sku: "MWD-WEB-PRO",
        category: "Web Design",
        isPublished: true,
        isFeatured: true,
      },
      {
        name: "E-commerce Starter",
        description:
          "Online store setup with product catalog, payment gateway integration, and shipping configuration.",
        price: "3499.00",
        sku: "MWD-ECOMM-START",
        category: "E-commerce",
        isPublished: true,
        isFeatured: false,
      },
      {
        name: "SEO & Marketing Package",
        description:
          "On-page SEO, Google Search Console setup, and a 3-month content/keyword plan to improve visibility.",
        price: "799.00",
        sku: "MWD-SEO-BASE",
        category: "Marketing",
        isPublished: true,
        isFeatured: false,
      },
      {
        name: "Maintenance Retainer — Monthly",
        description:
          "Ongoing site maintenance, updates, backups and minor content tweaks (per month).",
        price: "149.00",
        sku: "MWD-MAINT-MO",
        category: "Maintenance",
        isPublished: true,
        isFeatured: false,
      },
    ];

    for (const p of products) {
      const existing = await db.product.findFirst({
        where: { companyId: company.id, sku: p.sku },
      });
      if (existing) {
        console.log(`Product ${p.sku} already exists — skipping`);
        continue;
      }
      const created = await db.product.create({
        data: {
          ...p,
          price: p.price,
          companyId: company.id,
        },
      });
      console.log(`Created product: ${created.name} (${created.id})`);
    }

    console.log("Seeding complete");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await db.$disconnect();
  }
}

// Run when invoked directly
if (require.main === module) {
  seed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
