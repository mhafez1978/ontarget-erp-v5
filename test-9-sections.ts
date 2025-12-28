import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { generateAiStorefront } from "./lib/ai/ai-storefront-service";
import { decrypt } from "./lib/crypto";
import type { AiProviderConfig, AiProviderType } from "./lib/ai/model-client";

// Load environment variables from .env.local
config({ path: ".env.local" });

const prisma = new PrismaClient();

async function test() {
  try {
    console.log("🔍 Finding test company...");
    const company = await prisma.company.findFirst({
      where: { name: { contains: "MOVE" } },
      include: {
        products: { take: 5 },
        services: { take: 5 },
        testimonials: { take: 3 },
        staff: {
          take: 5,
          include: {
            user: true,
          },
        },
        locations: { take: 1 },
      },
    });

    if (!company) {
      console.error("❌ Company not found");
      return;
    }

    console.log(`✓ Found: ${company.name}`);

    // Load AI provider config from database (like the API route does)
    let providerConfig: AiProviderConfig | undefined;
    console.log("\n🔑 Loading AI provider settings from database...");

    const aiProvider = await (prisma as any).aiProviderSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (aiProvider && aiProvider.apiKey) {
      try {
        providerConfig = {
          provider: aiProvider.provider as AiProviderType,
          apiKey: decrypt(aiProvider.apiKey),
          model: aiProvider.model || undefined,
          apiBase: aiProvider.apiBase || undefined,
        };
        console.log(
          `✓ Loaded ${aiProvider.provider} provider with model: ${
            aiProvider.model || "default"
          }`
        );
      } catch (err) {
        console.warn("⚠️ Failed to decrypt API key:", err);
      }
    } else {
      console.warn("⚠️ No active AI provider found in database");
    }

    // Call the AI service directly
    console.log("\n🚀 Calling AI generation service...");
    const result = await generateAiStorefront(
      {
        company,
        products: (company.products || []).map((p) => ({
          ...p,
          price: Number(p.price),
        })),
        services: (company.services || []).map((s) => ({
          ...s,
          price: Number(s.price),
          duration: s.duration ? Number(s.duration) : null,
        })),
        testimonials: company.testimonials || [],
        team: (company.staff || []).map((s) => ({
          name: s.user.name || null,
          role: s.jobTitle || s.role || "Team Member",
          bio: s.bio || null,
          image: s.user.image || null,
        })),
        locations: company.locations || [],
        prompt:
          "Create a modern, professional website with bold colors and clean layout",
        conversationHistory: [],
        goal: "lead-gen",
        tone: "serious",
      },
      providerConfig
    );

    if (!result.spec) {
      console.error("❌ No spec generated");
      console.error("Message:", result.assistantMessage);
      return;
    }

    console.log("\n✅ Generation successful!");

    const sections = result.spec.sections;
    console.log(`\n📊 SECTIONS GENERATED (${sections.length} total):`);
    sections.forEach((section, i) => {
      console.log(`  ${i + 1}. ${section.type} (order: ${section.order})`);
    });

    // Check for required 9 sections
    const requiredSections = [
      "announcement-bar",
      "header",
      "hero",
      "stats",
      "features",
      "case studies",
      "testimonials",
      "cta-band",
      "footer",
    ];

    const generatedTypes = sections.map((s) => s.type);
    console.log("\n✅ REQUIRED 9 SECTIONS CHECK:");

    let allPresent = true;
    requiredSections.forEach((type) => {
      const present = generatedTypes.includes(type);
      console.log(`  ${present ? "✅" : "❌"} ${type}`);
      if (!present) allPresent = false;
    });

    // Check for optional sections
    const optionalTypes = generatedTypes.filter(
      (type) => !requiredSections.includes(type)
    );
    if (optionalTypes.length > 0) {
      console.log("\n📦 OPTIONAL SECTIONS INCLUDED:");
      optionalTypes.forEach((type) => console.log(`  ✅ ${type}`));
    }

    console.log("\n" + "=".repeat(60));
    if (allPresent) {
      console.log("✅ SUCCESS! All 9 mandatory sections present");
    } else {
      console.log("❌ FAILED! Some mandatory sections missing");
    }
    console.log("=".repeat(60));

    if (result.assistantMessage) {
      console.log(
        "\n💬 AI Response:",
        result.assistantMessage.substring(0, 200) + "..."
      );
    }
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
