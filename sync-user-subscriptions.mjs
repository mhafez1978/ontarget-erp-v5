/**
 * Sync User Plans with Company Subscriptions
 *
 * This script ensures that all companies owned by users have matching
 * subscription records with the same plan as the user's plan.
 *
 * Usage: node sync-user-subscriptions.mjs
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function syncSubscriptions() {
  console.log("🔄 Starting subscription sync...\n");

  try {
    // Get all users with their owned companies
    const users = await db.user.findMany({
      include: {
        ownedCompanies: {
          include: {
            subscriberSubscriptions: true,
          },
        },
      },
    });

    // Get or create root company
    let rootCompany = await db.company.findFirst({
      where: { isRoot: true },
    });

    if (!rootCompany) {
      console.log(
        "⚠️  No root company found. Creating OnTarget ERP root company..."
      );
      const superAdmin = await db.user.findFirst({
        where: { role: "SUPER_ADMIN" },
      });

      if (!superAdmin) {
        throw new Error(
          "No SUPER_ADMIN found. Please create a SUPER_ADMIN user first."
        );
      }

      rootCompany = await db.company.create({
        data: {
          name: "OnTarget ERP",
          description: "OnTarget ERP SaaS Platform",
          isRoot: true,
          ownerId: superAdmin.id,
        },
      });
      console.log("✅ Created root company: OnTarget ERP\n");
    } else {
      console.log(`✅ Found root company: ${rootCompany.name}\n`);
    }

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const user of users) {
      if (user.ownedCompanies.length === 0) {
        skipped++;
        continue;
      }

      console.log(
        `\n👤 User: ${user.name} (${user.email}) - Plan: ${user.plan}`
      );

      for (const company of user.ownedCompanies) {
        const subscription = company.subscriberSubscriptions.find(
          (sub) => sub.rootCompanyId === rootCompany.id
        );

        if (!subscription) {
          // Create new subscription
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 30);

          await db.subscription.create({
            data: {
              rootCompanyId: rootCompany.id,
              subscriberCompanyId: company.id,
              plan: user.plan,
              status: "TRIAL",
              trialEndsAt,
            },
          });

          console.log(
            `  ✨ Created subscription for "${company.name}": ${user.plan}`
          );
          created++;
        } else if (subscription.plan !== user.plan) {
          // Update existing subscription
          await db.subscription.update({
            where: { id: subscription.id },
            data: { plan: user.plan },
          });

          console.log(
            `  🔄 Updated "${company.name}" subscription: ${subscription.plan} → ${user.plan}`
          );
          updated++;
        } else {
          console.log(
            `  ✓ "${company.name}" subscription already in sync: ${user.plan}`
          );
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary:");
    console.log(`   Created: ${created} subscription(s)`);
    console.log(`   Updated: ${updated} subscription(s)`);
    console.log(`   Skipped: ${skipped} user(s) with no companies`);
    console.log("=".repeat(60));
    console.log("\n✅ Subscription sync completed!\n");
  } catch (error) {
    console.error("❌ Error syncing subscriptions:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

syncSubscriptions();
