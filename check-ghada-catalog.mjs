import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkGhadaCatalog() {
  try {
    // Find Ghada company
    const company = await prisma.company.findFirst({
      where: {
        OR: [
          { name: { contains: "Ghada", mode: "insensitive" } },
          { name: { contains: "غادة", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!company) {
      console.log("❌ Ghada company not found");
      return;
    }

    console.log(`\n✅ Found company: ${company.name} (${company.id})\n`);

    // Get all products
    const products = await prisma.product.findMany({
      where: { companyId: company.id },
      select: {
        id: true,
        name: true,
        isActive: true,
        isPublished: true,
        isFeatured: true,
        price: true,
        sku: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });

    // Get all services
    const services = await prisma.service.findMany({
      where: { companyId: company.id },
      select: {
        id: true,
        name: true,
        isActive: true,
        isPublished: true,
        isFeatured: true,
        price: true,
        duration: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });

    // Display Products
    console.log("📦 PRODUCTS:");
    console.log("=".repeat(80));
    if (products.length === 0) {
      console.log("  No products found\n");
    } else {
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Price: $${product.price}`);
        console.log(`   SKU: ${product.sku || "N/A"}`);
        console.log(`   Category: ${product.category || "N/A"}`);
        console.log(`   Status:`);
        console.log(`     • Active: ${product.isActive ? "✅ YES" : "❌ NO"}`);
        console.log(
          `     • Published: ${product.isPublished ? "✅ YES" : "❌ NO"}`
        );
        console.log(
          `     • Featured: ${product.isFeatured ? "⭐ YES" : "❌ NO"}`
        );
      });
    }

    // Display Services
    console.log("\n\n🛠️  SERVICES:");
    console.log("=".repeat(80));
    if (services.length === 0) {
      console.log("  No services found\n");
    } else {
      services.forEach((service, index) => {
        console.log(`\n${index + 1}. ${service.name}`);
        console.log(`   ID: ${service.id}`);
        console.log(`   Price: $${service.price}`);
        console.log(`   Duration: ${service.duration || "N/A"}`);
        console.log(`   Category: ${service.category || "N/A"}`);
        console.log(`   Status:`);
        console.log(`     • Active: ${service.isActive ? "✅ YES" : "❌ NO"}`);
        console.log(
          `     • Published: ${service.isPublished ? "✅ YES" : "❌ NO"}`
        );
        console.log(
          `     • Featured: ${service.isFeatured ? "⭐ YES" : "❌ NO"}`
        );
      });
    }

    // Summary
    console.log("\n\n📊 SUMMARY:");
    console.log("=".repeat(80));
    console.log(`Total Products: ${products.length}`);
    console.log(`  • Active: ${products.filter((p) => p.isActive).length}`);
    console.log(
      `  • Published: ${products.filter((p) => p.isPublished).length}`
    );
    console.log(`  • Featured: ${products.filter((p) => p.isFeatured).length}`);
    console.log(`\nTotal Services: ${services.length}`);
    console.log(`  • Active: ${services.filter((s) => s.isActive).length}`);
    console.log(
      `  • Published: ${services.filter((s) => s.isPublished).length}`
    );
    console.log(`  • Featured: ${services.filter((s) => s.isFeatured).length}`);
    console.log();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGhadaCatalog();
