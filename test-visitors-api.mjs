import { db } from "./scripts/db.mjs";

const prisma = db;

async function testVisitorsAPI() {
  console.log("🔍 Testing Visitors Tracking...\n");

  try {
    // 1. Check geo-tracking settings
    console.log("1️⃣ Checking geo-tracking settings...");
    const settings = await prisma.geoTrackingSetting.findFirst();
    console.log("   Settings:", settings);
    console.log("   Enabled:", settings?.enabled ? "✅ YES" : "❌ NO");
    console.log("");

    // 2. Get all visitors from last 24 hours
    console.log("2️⃣ Fetching visitors from last 24 hours...");
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const visitors = await prisma.visitorTracking.findMany({
      where: {
        visitedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        visitedAt: "desc",
      },
      take: 50,
    });

    console.log(`   Found ${visitors.length} visitors in the last 24 hours`);
    console.log("");

    // 3. Display visitor details
    if (visitors.length > 0) {
      console.log("3️⃣ Visitor Details:");
      console.log("   ==================");
      visitors.forEach((visitor, index) => {
        console.log(`   Visitor #${index + 1}:`);
        console.log(`   - ID: ${visitor.id}`);
        console.log(`   - IP: ${visitor.ipAddress}`);
        console.log(`   - IPv4: ${visitor.ipv4 || "N/A"}`);
        console.log(`   - IPv6: ${visitor.ipv6 || "N/A"}`);
        console.log(
          `   - Location: ${
            [visitor.city, visitor.state, visitor.country]
              .filter(Boolean)
              .join(", ") || "Unknown"
          }`
        );
        console.log(`   - Flag: ${visitor.countryFlag || "N/A"}`);
        console.log(`   - Landing Page: ${visitor.landingPage || "N/A"}`);
        console.log(`   - Visited At: ${visitor.visitedAt.toLocaleString()}`);
        console.log(`   - Referrer: ${visitor.referrer || "Direct"}`);
        console.log("   ==================");
      });
    } else {
      console.log("3️⃣ No visitors found!");
      console.log("   Possible reasons:");
      console.log("   - Geo-tracking is disabled");
      console.log("   - No one visited the homepage in the last 24 hours");
      console.log("   - Visitor tracking failed to record");
    }
    console.log("");

    // 4. Get total count of all visitors ever
    console.log("4️⃣ All-time visitor stats...");
    const totalVisitors = await prisma.visitorTracking.count();
    console.log(`   Total visitors ever recorded: ${totalVisitors}`);

    if (totalVisitors > 0) {
      const oldestVisitor = await prisma.visitorTracking.findFirst({
        orderBy: { visitedAt: "asc" },
      });
      const newestVisitor = await prisma.visitorTracking.findFirst({
        orderBy: { visitedAt: "desc" },
      });
      console.log(
        `   First visit: ${oldestVisitor?.visitedAt.toLocaleString()}`
      );
      console.log(
        `   Latest visit: ${newestVisitor?.visitedAt.toLocaleString()}`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testVisitorsAPI();
