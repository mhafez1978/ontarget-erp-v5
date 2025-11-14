#!/usr/bin/env node

/**
 * Reset Setup Script
 * Helps manage the initial SUPER_ADMIN setup
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  log(title, "bold");
  console.log("=".repeat(60));
}

async function main() {
  logSection("🔍 CHECKING SUPER ADMIN STATUS");

  try {
    // Find all SUPER_ADMIN users
    const superAdmins = await prisma.user.findMany({
      where: {
        role: "SUPER_ADMIN",
      },
      include: {
        companyMemberships: {
          include: {
            company: true,
          },
        },
      },
    });

    if (superAdmins.length === 0) {
      log("\n✅ No SUPER_ADMIN users found.", "green");
      log("You can run the setup script to create one.", "yellow");
      await prisma.$disconnect();
      return;
    }

    logSection("📊 EXISTING SUPER ADMIN(S)");
    log(`\nFound ${superAdmins.length} SUPER_ADMIN user(s):\n`, "yellow");

    superAdmins.forEach((admin, index) => {
      log(`${index + 1}. Name: ${admin.name}`, "blue");
      log(`   Email: ${admin.email}`, "blue");
      log(`   ID: ${admin.id}`, "blue");
      log(`   Created: ${admin.createdAt.toLocaleString()}`, "blue");
      if (admin.companyMemberships.length > 0) {
        log(`   Company: ${admin.companyMemberships[0].company.name}`, "blue");
      }
      console.log();
    });

    logSection("🔐 LOGIN CREDENTIALS");
    log("\nYou can login with:", "yellow");
    log(`Email: ${superAdmins[0].email}`, "green");
    log("Password: (the password you used during setup)", "green");
    log("\nIf you forgot the password, you have two options:\n", "yellow");
    log("Option 1: Reset the database (WARNING: Deletes ALL data)", "red");
    log("  Command: npx prisma migrate reset --force", "yellow");
    log("\nOption 2: Delete only the SUPER_ADMIN users", "red");
    log("  Run this script with: node reset-setup.mjs --delete", "yellow");
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, "red");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteSuperAdmins() {
  logSection("⚠️  DELETING SUPER ADMIN USERS");

  log("\nThis will delete all SUPER_ADMIN users and their companies.", "red");
  log("Are you sure? This action cannot be undone!\n", "red");

  // In a real scenario, you'd want to prompt for confirmation
  // For now, we'll just proceed if the --delete flag is used

  try {
    const result = await prisma.user.deleteMany({
      where: {
        role: "SUPER_ADMIN",
      },
    });

    log(`\n✅ Deleted ${result.count} SUPER_ADMIN user(s)`, "green");
    log("You can now run the setup script again.", "yellow");
    log("Visit: http://localhost:3001/setup", "blue");
  } catch (error) {
    log(`\n❌ Error deleting SUPER_ADMIN users: ${error.message}`, "red");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes("--delete")) {
  deleteSuperAdmins().catch((error) => {
    log(`\n❌ Fatal error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  });
} else {
  main().catch((error) => {
    log(`\n❌ Fatal error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  });
}
