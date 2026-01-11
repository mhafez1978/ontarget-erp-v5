/**
 * AI Storefront V3 Generation API
 *
 * POST /api/storefront/v3/generate
 * Generates a complete multi-page website optimized for SEO and accessibility
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import {
  buildCompanyContext,
  generateV3Website,
} from "@/lib/ai/v3-generation-service";
import type { AiProviderConfig, AiProviderType } from "@/lib/ai/model-client";
import { decrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const body = await request.json();
    const { companyId, userInstructions } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to company
    const userWithCompanies = await db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        ownedCompanies: { where: { id: companyId }, select: { id: true } },
        companyMemberships: {
          where: { companyId },
          select: { companyId: true },
        },
      },
    });

    const isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
    const ownsCompany = (userWithCompanies?.ownedCompanies || []).length > 0;
    const isMember = (userWithCompanies?.companyMemberships || []).length > 0;

    if (!isSuperAdmin && !ownsCompany && !isMember) {
      return NextResponse.json(
        { error: "Unauthorized - no access to this company" },
        { status: 403 }
      );
    }

    // Load AI provider configuration
    let providerConfig: AiProviderConfig | undefined;

    const aiProvider = await db.aiProviderSetting.findFirst({
      where: { scope: "GLOBAL" },
    });

    if (
      aiProvider &&
      aiProvider.isActive &&
      aiProvider.apiKey &&
      aiProvider.provider
    ) {
      const decryptedKey = decrypt(aiProvider.apiKey);
      providerConfig = {
        provider: aiProvider.provider as AiProviderType,
        apiKey: decryptedKey,
        model: aiProvider.model || undefined,
        apiBase: aiProvider.apiBase || undefined,
      };
    }

    if (!providerConfig || !providerConfig.provider) {
      return NextResponse.json(
        {
          error:
            "AI provider not configured. Please configure global AI settings first.",
        },
        { status: 400 }
      );
    }

    console.log("[V3 Generation] Starting generation for company:", companyId);

    // Build company context from database
    const context = await buildCompanyContext(companyId, db);

    console.log("[V3 Generation] Context built:", {
      company: context.companyProfile.name,
      industry: context.companyProfile.industry,
      keywords: context.seoKeywords.length,
    });

    // Generate website
    const result = await generateV3Website({
      companyId,
      context,
      userInstructions,
      providerConfig,
    });

    console.log("[V3 Generation] Generation complete:", {
      success: result.website !== null,
      qualityScore: result.qualityScore,
      errors: result.errors.length,
      warnings: result.warnings.length,
    });

    // Log actual errors if generation failed
    if (!result.website) {
      console.error("[V3 Generation] Validation errors:", result.errors);
      console.error("[V3 Generation] Warnings:", result.warnings);
    }

    if (!result.website) {
      return NextResponse.json(
        {
          error: "Failed to generate website",
          details: result.errors,
          warnings: result.warnings,
        },
        { status: 500 }
      );
    }

    // Save website to database
    const savedWebsite = await db.storefrontWebsiteV3.create({
      data: {
        companyId,
        websiteData: JSON.parse(JSON.stringify(result.website)),
        qualityScore: result.qualityScore,
        seoCompliant: result.validationResults.seoCompliance,
        accessibilityCompliant:
          result.validationResults.accessibilityCompliance,
        validationWarnings: result.warnings,
        generatedBy: user.id,
      },
    });

    console.log("[V3 Generation] Website saved:", savedWebsite.id);

    return NextResponse.json({
      success: true,
      websiteId: savedWebsite.id,
      website: result.website,
      qualityScore: result.qualityScore,
      validationResults: result.validationResults,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("[V3 Generation] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isOverloaded =
      errorMessage.includes("529") || errorMessage.includes("overloaded");
    const isRateLimit =
      errorMessage.includes("429") || errorMessage.includes("rate limit");

    return NextResponse.json(
      {
        error: isOverloaded
          ? "AI provider is temporarily overloaded. Please try again in a few moments."
          : isRateLimit
          ? "Rate limit exceeded. Please wait a moment and try again."
          : "Failed to generate website",
        details: errorMessage,
        retryable: isOverloaded || isRateLimit,
      },
      { status: isOverloaded || isRateLimit ? 503 : 500 }
    );
  }
}
