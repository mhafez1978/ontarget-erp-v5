import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { generateAiStorefront } from "./lib/ai/ai-storefront-service";
import { decrypt } from "./lib/crypto";
import type { AiProviderConfig, AiProviderType } from "./lib/ai/model-client";

config({ path: ".env.local" });

const prisma = new PrismaClient();

// Different prompt styles to test variety
const TEST_PROMPTS: Array<{
  name: string;
  prompt: string;
  tone: "playful" | "serious" | "luxury" | "minimal";
}> = [
  {
    name: "Modern Professional",
    prompt:
      "Create a modern, professional website with bold colors and clean layout",
    tone: "serious",
  },
  {
    name: "Creative & Playful",
    prompt:
      "Design a vibrant, creative website with playful colors and fun animations. Make it energetic and eye-catching",
    tone: "playful",
  },
  {
    name: "Minimalist Elegant",
    prompt:
      "Create an elegant, minimalist design with lots of white space, subtle colors, and refined typography",
    tone: "minimal",
  },
  {
    name: "Bold & Edgy",
    prompt:
      "Design a bold, edgy website with dark colors, dramatic contrasts, and modern brutalist style",
    tone: "luxury",
  },
];

async function testVariety() {
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

    console.log(`✓ Found: ${company.name}\n`);

    // Load AI provider config
    let providerConfig: AiProviderConfig | undefined;
    const aiProvider = await (prisma as any).aiProviderSetting.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (aiProvider && aiProvider.apiKey) {
      providerConfig = {
        provider: aiProvider.provider as AiProviderType,
        apiKey: decrypt(aiProvider.apiKey),
        model: aiProvider.model || undefined,
        apiBase: aiProvider.apiBase || undefined,
      };
      console.log(`✓ Using ${aiProvider.provider} (${aiProvider.model})\n`);
    }

    console.log("=".repeat(70));
    console.log("🎨 TESTING DESIGN VARIETY WITH DIFFERENT PROMPTS");
    console.log("=".repeat(70) + "\n");

    for (const testCase of TEST_PROMPTS) {
      console.log(`\n${"─".repeat(70)}`);
      console.log(`📝 TEST: ${testCase.name}`);
      console.log(`${"─".repeat(70)}`);
      console.log(`Prompt: "${testCase.prompt}"`);
      console.log(`Tone: ${testCase.tone}\n`);

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
          prompt: testCase.prompt,
          conversationHistory: [],
          goal: "lead-gen",
          tone: testCase.tone,
        },
        providerConfig
      );

      if (!result.spec) {
        console.error("❌ No spec generated");
        continue;
      }

      const { meta } = result.spec;
      console.log("🎨 DESIGN GENERATED:");
      console.log(`  Layout Style: ${meta.layoutStyle || "default"}`);
      console.log(`  Primary Color: ${meta.primaryColor || "N/A"}`);
      console.log(`  Secondary Color: ${meta.secondaryColor || "N/A"}`);
      console.log(`  Accent Color: ${meta.accentColor || "N/A"}`);
      console.log(`  Background: ${meta.backgroundColor || "N/A"}`);
      console.log(`  Button Style: ${meta.buttonStyle || "N/A"}`);
      console.log(`  Corner Style: ${meta.cornerStyle || "N/A"}`);
      console.log(`  Hero Size: ${meta.heroSize || "N/A"}`);

      const sections = result.spec.sections;
      console.log(`\n📊 Sections (${sections.length} total):`);
      sections.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.type} (order: ${s.order})`);
      });

      if (result.assistantMessage) {
        const msg = result.assistantMessage.substring(0, 150);
        console.log(`\n💬 AI: ${msg}${msg.length >= 150 ? "..." : ""}`);
      }

      // Small delay between calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ VARIETY TEST COMPLETE");
    console.log("=".repeat(70));
    console.log("\n🎯 KEY OBSERVATIONS:");
    console.log("  • Each prompt should produce different colors");
    console.log("  • Layout styles should vary (hero-left, centered, etc.)");
    console.log("  • Button/corner styles should adapt to tone");
    console.log("  • All designs have exactly 9 mandatory sections\n");
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testVariety();
