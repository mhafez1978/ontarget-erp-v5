#!/usr/bin/env node
/**
 * Test AI Storefront generation with multiple providers
 * Tests: OpenAI GPT-4, Claude Sonnet 3.5, DeepSeek, and validates mandatory sections
 * Loads provider configs from database
 */

import { PrismaClient } from "@prisma/client";
import { decrypt } from "./lib/crypto";
import {
  generateAiStorefront,
  type AiStorefrontInput,
} from "./lib/ai/ai-storefront-service";
import type { AiProviderConfig } from "./lib/ai/model-client";

const prisma = new PrismaClient();

// Mock company data for testing
const mockCompany = {
  id: "test-company",
  name: "TechFlow Solutions",
  slogan: "Building Tomorrow's Technology Today",
  description:
    "A leading software development company specializing in AI and cloud solutions",
  industry: "Technology",
};

const mockProducts = [
  {
    id: "prod-1",
    name: "Cloud Analytics Platform",
    description: "Real-time data analytics powered by AI",
    price: 99.99,
    category: "Software",
  },
  {
    id: "prod-2",
    name: "Security Suite Pro",
    description: "Enterprise-grade security for your applications",
    price: 149.99,
    category: "Security",
  },
];

const mockServices = [
  {
    id: "svc-1",
    name: "Custom Development",
    description: "Tailored software solutions for your business",
    price: 5000.0,
    category: "Development",
    duration: null,
  },
  {
    id: "svc-2",
    name: "Cloud Migration",
    description: "Seamlessly migrate your infrastructure to the cloud",
    price: 3000.0,
    category: "Infrastructure",
    duration: 30,
  },
];

const mockTestimonials = [
  {
    id: "test-1",
    customerName: "Sarah Johnson",
    customerTitle: "CTO at DataCorp",
    testimonial:
      "TechFlow delivered an outstanding solution that transformed our business operations.",
    rating: 5,
  },
];

// Test configurations for different providers
const providers = [
  {
    name: "OpenAI GPT-4",
    config: {
      provider: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4-turbo-preview",
    },
  },
  {
    name: "Claude Sonnet 3.5",
    config: {
      provider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: "claude-3-5-sonnet-20241022",
    },
  },
];

// Load provider configs from database
async function loadProvidersFromDb() {
  const dbProviders = [];

  try {
    const allProviders = await prisma.aiProviderSetting.findMany({
      where: { isActive: true },
    });

    for (const provider of allProviders) {
      if (provider.apiKey) {
        try {
          const decryptedKey = decrypt(provider.apiKey);
          dbProviders.push({
            name: `${provider.provider.toUpperCase()} (${
              provider.model || "default"
            })`,
            config: {
              provider: provider.provider,
              apiKey: decryptedKey,
              model: provider.model || undefined,
              apiBase: provider.apiBase || undefined,
            },
          });
        } catch (error) {
          console.warn(
            `⚠️  Failed to decrypt API key for ${provider.provider}: ${error.message}`
          );
        }
      }
    }
  } catch (error) {
    console.warn(
      `⚠️  Failed to load providers from database: ${error.message}`
    );
  }

  return dbProviders;
}

// Validate that mandatory sections exist
function validateMandatorySections(spec) {
  const mandatorySections = [
    "announcement-bar",
    "header",
    "hero",
    "stats",
    "footer",
  ];
  const existingSectionTypes = new Set(spec.sections.map((s) => s.type));

  const missing = mandatorySections.filter(
    (type) => !existingSectionTypes.has(type)
  );
  return {
    valid: missing.length === 0,
    missing,
    total: spec.sections.length,
    sectionTypes: Array.from(existingSectionTypes),
  };
}

// Test with a single provider
async function testProvider(providerInfo) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${providerInfo.name}`);
  console.log(`${"=".repeat(60)}`);

  if (!providerInfo.config.apiKey) {
    console.log(`❌ Skipped - No API key configured`);
    return null;
  }

  try {
    const input: AiStorefrontInput = {
      company: mockCompany,
      products: mockProducts,
      services: mockServices,
      testimonials: mockTestimonials,
      prompt:
        "Create a modern, professional storefront that showcases our technology expertise",
      goal: "sell-products",
      tone: "serious",
      brandColors: {
        primary: "#0066CC",
        secondary: "#003366",
        accent: "#FF6600",
      },
      showLocation: true,
      showTeam: true,
      showTestimonials: true,
      blogEnabled: true,
      blogHasPosts: false,
    };

    console.log(`⏳ Generating storefront...`);
    const startTime = Date.now();
    const result = await generateAiStorefront(input, providerInfo.config);
    const duration = Date.now() - startTime;

    if (!result.spec) {
      console.log(`❌ Failed - No spec generated`);
      return null;
    }

    // Validate mandatory sections
    const validation = validateMandatorySections(result.spec);

    console.log(`\n✅ Generation completed in ${duration}ms`);
    console.log(`\n📊 Results:`);
    console.log(`   Total sections: ${validation.total}`);
    console.log(`   Section types: ${validation.sectionTypes.join(", ")}`);

    if (validation.valid) {
      console.log(`   ✅ All mandatory sections present`);
    } else {
      console.log(
        `   ❌ Missing mandatory sections: ${validation.missing.join(", ")}`
      );
    }

    // Check for images
    let imagesFound = 0;
    console.log(
      `\n[DEBUG] Checking for images in ${result.spec.sections.length} sections...`
    );

    result.spec.sections.forEach((section: any, idx: number) => {
      let sectionImages = 0;

      // Check content fields
      if (section.content?.imageUrl) {
        imagesFound++;
        sectionImages++;
      }
      if (section.content?.image) {
        imagesFound++;
        sectionImages++;
      }
      if (section.content?.backgroundImage) {
        imagesFound++;
        sectionImages++;
      }

      // Check styling fields (can be string URL or object with url property)
      if (section.styling?.backgroundImage) {
        if (typeof section.styling.backgroundImage === "string") {
          imagesFound++;
          sectionImages++;
        } else if (section.styling.backgroundImage?.url) {
          imagesFound++;
          sectionImages++;
        }
      }

      // Check arrays of items (products, services, team members, etc.)
      if (Array.isArray(section.content?.items)) {
        section.content.items.forEach((item: any) => {
          if (item.imageUrl || item.image) {
            imagesFound++;
            sectionImages++;
          }
        });
      }
      if (Array.isArray(section.content?.products)) {
        section.content.products.forEach((item: any) => {
          if (item.imageUrl || item.image) {
            imagesFound++;
            sectionImages++;
          }
        });
      }
      if (Array.isArray(section.content?.services)) {
        section.content.services.forEach((item: any) => {
          if (item.imageUrl || item.image) {
            imagesFound++;
            sectionImages++;
          }
        });
      }
      if (Array.isArray(section.content?.testimonials)) {
        section.content.testimonials.forEach((item: any) => {
          if (item.imageUrl || item.image) {
            imagesFound++;
            sectionImages++;
          }
        });
      }

      if (sectionImages > 0) {
        console.log(
          `[DEBUG] Section ${idx} (${section.type}): ${sectionImages} images`
        );
      }
    });

    console.log(`   Images found: ${imagesFound}`);

    // Check assistant message
    if (result.assistantMessage) {
      console.log(`\n💬 Assistant message:`);
      console.log(
        `   ${result.assistantMessage.substring(0, 200)}${
          result.assistantMessage.length > 200 ? "..." : ""
        }`
      );
    }

    return {
      provider: providerInfo.name,
      success: true,
      validation,
      duration,
      imagesFound,
      spec: result.spec,
    };
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    if (error.stack) {
      console.log(`   ${error.stack.split("\n")[1]?.trim()}`);
    }
    return {
      provider: providerInfo.name,
      success: false,
      error: error.message,
    };
  }
}

// Main test runner
async function runTests() {
  console.log(`\n${"█".repeat(60)}`);
  console.log(`  AI Storefront Multi-Provider Test Suite`);
  console.log(`${"█".repeat(60)}`);

  // Load providers from database
  console.log(`\n⏳ Loading provider configurations from database...`);
  const dbProviders = await loadProvidersFromDb();

  if (dbProviders.length === 0) {
    console.log(`\n❌ No active providers found in database.`);
    console.log(
      `   Please configure AI providers in your application settings.`
    );
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ Found ${dbProviders.length} provider(s):`);
  dbProviders.forEach((p) => console.log(`   - ${p.name}`));

  const results = [];

  for (const provider of dbProviders) {
    const result = await testProvider(provider);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log(`\n\n${"=".repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(60)}`);

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log(`\n📊 Validation Results:`);
    successful.forEach((result) => {
      const status = result.validation.valid ? "✅" : "❌";
      console.log(`   ${status} ${result.provider}:`);
      console.log(`      Sections: ${result.validation.total}`);
      console.log(`      Images: ${result.imagesFound}`);
      console.log(`      Duration: ${result.duration}ms`);
      if (!result.validation.valid) {
        console.log(`      Missing: ${result.validation.missing.join(", ")}`);
      }
    });
  }

  // Consistency check
  if (successful.length > 1) {
    console.log(`\n🔍 Consistency Check:`);
    const allValid = successful.every((r) => r.validation.valid);
    if (allValid) {
      console.log(`   ✅ All providers generated mandatory sections`);
    } else {
      console.log(`   ⚠️  Inconsistent results across providers`);
    }

    const sectionCounts = successful.map((r) => r.validation.total);
    const minSections = Math.min(...sectionCounts);
    const maxSections = Math.max(...sectionCounts);
    console.log(`   Section range: ${minSections}-${maxSections}`);

    const imageCounts = successful.map((r) => r.imagesFound);
    const minImages = Math.min(...imageCounts);
    const maxImages = Math.max(...imageCounts);
    console.log(`   Image range: ${minImages}-${maxImages}`);
  }

  await prisma.$disconnect();
}

runTests().catch((error) => {
  console.error("Test runner failed:", error);
  process.exit(1);
});
