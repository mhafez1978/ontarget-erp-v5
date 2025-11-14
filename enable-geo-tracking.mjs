import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function enableGeoTracking() {
  try {
    // Check if settings exist
    const existing = await prisma.geoTrackingSetting.findFirst();

    if (existing) {
      // Update to enable
      await prisma.geoTrackingSetting.update({
        where: { id: existing.id },
        data: { enabled: true },
      });
      console.log("✅ Geo-tracking enabled successfully!");
    } else {
      // Create new settings with enabled
      await prisma.geoTrackingSetting.create({
        data: { enabled: true },
      });
      console.log("✅ Geo-tracking settings created and enabled!");
    }

    const settings = await prisma.geoTrackingSetting.findFirst();
    console.log("Current settings:", settings);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

enableGeoTracking();
