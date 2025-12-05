import * as readline from "readline";

import { db } from "./scripts/db.mjs";

const prisma = db;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function checkCompanyCatalog() {
  try {
    const companyName = await question("\n🏢 Enter company name to search: ");

    if (!companyName || companyName.trim() === "") {
      console.log("❌ Company name is required");
      rl.close();
      return;
    }

    console.log(`\n🔍 Searching for companies matching "${companyName}"...\n`);

    // Find matching companies
    const companies = await prisma.company.findMany({
      where: {
        name: { contains: companyName.trim() },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            products: true,
            services: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (companies.length === 0) {
      console.log(`❌ No companies found matching "${companyName}"`);
      rl.close();
      return;
    }

    // Display matching companies
    console.log(
      `Found ${companies.length} matching compan${
        companies.length === 1 ? "y" : "ies"
      }:\n`
    );
    companies.forEach((company, index) => {
      console.log(
        `${index + 1}. ${company.name} (${company._count.products} products, ${
          company._count.services
        } services)`
      );
    });

    let selectedCompany;
    if (companies.length === 1) {
      selectedCompany = companies[0];
      console.log(`\n✅ Using: ${selectedCompany.name}\n`);
    } else {
      const selection = await question(
        `\nSelect company number (1-${companies.length}): `
      );
      const index = parseInt(selection) - 1;
      if (index < 0 || index >= companies.length) {
        console.log("❌ Invalid selection");
        rl.close();
        return;
      }
      selectedCompany = companies[index];
      console.log(`\n✅ Selected: ${selectedCompany.name}\n`);
    }

    // Get all products
    const products = await prisma.product.findMany({
      where: { companyId: selectedCompany.id },
      select: {
        id: true,
        name: true,
        isActive: true,
        isPublished: true,
        isFeatured: true,
        price: true,
        sku: true,
        category: true,
        quantity: true,
        trackInventory: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    // Get all services
    const services = await prisma.service.findMany({
      where: { companyId: selectedCompany.id },
      select: {
        id: true,
        name: true,
        isActive: true,
        isPublished: true,
        isFeatured: true,
        price: true,
        duration: true,
        category: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    // Display Products
    console.log("📦 PRODUCTS:");
    console.log("=".repeat(100));
    if (products.length === 0) {
      console.log("  No products found\n");
    } else {
      products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Price: $${product.price}`);
        console.log(`   SKU: ${product.sku || "N/A"}`);
        console.log(`   Category: ${product.category || "N/A"}`);
        console.log(
          `   Inventory: ${product.quantity} units ${
            product.trackInventory ? "(tracked)" : "(not tracked)"
          }`
        );
        console.log(`   Created: ${product.createdAt.toLocaleDateString()}`);
        console.log(`   Status:`);
        console.log(
          `     • Active:    ${product.isActive ? "✅ YES" : "❌ NO"}`
        );
        console.log(
          `     • Published: ${product.isPublished ? "✅ YES" : "❌ NO"}`
        );
        console.log(
          `     • Featured:  ${product.isFeatured ? "⭐ YES" : "❌ NO"}`
        );
      });
    }

    // Display Services
    console.log("\n\n🛠️  SERVICES:");
    console.log("=".repeat(100));
    if (services.length === 0) {
      console.log("  No services found\n");
    } else {
      services.forEach((service, index) => {
        console.log(`\n${index + 1}. ${service.name}`);
        console.log(`   ID: ${service.id}`);
        console.log(`   Price: $${service.price}`);
        console.log(`   Duration: ${service.duration || "N/A"}`);
        console.log(`   Category: ${service.category || "N/A"}`);
        console.log(`   Created: ${service.createdAt.toLocaleDateString()}`);
        console.log(`   Status:`);
        console.log(
          `     • Active:    ${service.isActive ? "✅ YES" : "❌ NO"}`
        );
        console.log(
          `     • Published: ${service.isPublished ? "✅ YES" : "❌ NO"}`
        );
        console.log(
          `     • Featured:  ${service.isFeatured ? "⭐ YES" : "❌ NO"}`
        );
      });
    }

    // Summary
    console.log("\n\n📊 SUMMARY:");
    console.log("=".repeat(100));
    console.log(`Company: ${selectedCompany.name}`);
    console.log(`Company ID: ${selectedCompany.id}`);
    console.log(`\nTotal Products: ${products.length}`);
    if (products.length > 0) {
      console.log(
        `  • Active:    ${products.filter((p) => p.isActive).length} / ${
          products.length
        }`
      );
      console.log(
        `  • Published: ${products.filter((p) => p.isPublished).length} / ${
          products.length
        }`
      );
      console.log(
        `  • Featured:  ${products.filter((p) => p.isFeatured).length} / ${
          products.length
        }`
      );
    }
    console.log(`\nTotal Services: ${services.length}`);
    if (services.length > 0) {
      console.log(
        `  • Active:    ${services.filter((s) => s.isActive).length} / ${
          services.length
        }`
      );
      console.log(
        `  • Published: ${services.filter((s) => s.isPublished).length} / ${
          services.length
        }`
      );
      console.log(
        `  • Featured:  ${services.filter((s) => s.isFeatured).length} / ${
          services.length
        }`
      );
    }
    console.log();
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

checkCompanyCatalog();
