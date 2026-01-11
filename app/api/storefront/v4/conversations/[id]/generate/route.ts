import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { buildV4Context } from "@/lib/ai/v4-context-builder";
import { generateV4Website } from "@/lib/ai/v4-generation-service";
import type { AiProviderConfig } from "@/lib/ai/model-client";
import type { V4DesignPreferences } from "@/lib/ai/v4-conversation-types";

type AiProviderType =
  | "openai"
  | "openai-compatible"
  | "anthropic"
  | "xai"
  | "deepseek";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate session
    const sessionResult = await validateSessionForAPI(req);
    if (!sessionResult.valid) {
      return sessionResult.response;
    }

    const userId = sessionResult.user.id;
    const { id: conversationId } = await params;

    // Get provider config from body if provided
    const body = await req.json().catch(() => ({}));
    const { providerConfig } = body as { providerConfig?: AiProviderConfig };

    // Load conversation with company
    const conversation = await db.v4Conversation.findUnique({
      where: { id: conversationId },
      include: {
        company: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user owns this conversation
    if (conversation.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if conversation is complete
    if (!conversation.isComplete) {
      return NextResponse.json(
        { error: "Conversation is not complete yet" },
        { status: 400 }
      );
    }

    // Build context
    console.log(
      "[V4 Generate] Building context for company:",
      conversation.companyId
    );
    const context = await buildV4Context(conversation.companyId, db);

    // Extract preferences from conversation
    const preferences = {
      heroStyle: (conversation.heroStyle ||
        "above-fold") as V4DesignPreferences["heroStyle"],
      primaryColor: conversation.primaryColor || "#3B82F6",
      secondaryColor: conversation.secondaryColor || "#8B5CF6",
      accentColor: conversation.accentColor || "#EC4899",
      fontPairing: (conversation.fontPairing ||
        "modern") as V4DesignPreferences["fontPairing"],
      sections: {
        hero: true,
        features: false,
        products: false,
        services: false,
        team: false,
        testimonials: false,
        gallery: false,
        blog: false,
        faq: false,
        contact: true,
        ...(typeof conversation.sections === "object"
          ? conversation.sections
          : {}),
      },
    } as V4DesignPreferences;

    // Load global AI provider config if not provided
    let finalProviderConfig: AiProviderConfig | undefined = providerConfig;
    if (!finalProviderConfig) {
      const aiProviderClient = (
        db as typeof db & { aiProviderSetting?: typeof db.aiProviderSetting }
      ).aiProviderSetting;
      if (
        aiProviderClient &&
        typeof aiProviderClient.findFirst === "function"
      ) {
        const aiProvider = await aiProviderClient.findFirst({
          where: { scope: "GLOBAL", isActive: true },
        });

        if (aiProvider && aiProvider.apiKey) {
          finalProviderConfig = {
            provider: aiProvider.provider as AiProviderType,
            apiKey: decrypt(aiProvider.apiKey),
            model: aiProvider.model || undefined,
            apiBase: aiProvider.apiBase || undefined,
          };
          console.log(
            "[V4 Generate] Using global AI provider:",
            aiProvider.provider
          );
        }
      }
    }

    if (!finalProviderConfig) {
      return NextResponse.json(
        {
          error:
            "No AI provider configured. Please configure AI provider in settings.",
        },
        { status: 400 }
      );
    }

    // Generate website
    console.log(
      "[V4 Generate] Generating website with preferences:",
      preferences
    );
    const result = await generateV4Website(
      context,
      preferences,
      finalProviderConfig as AiProviderConfig // Type assertion - we checked above
    );

    if (!result.success || !result.website) {
      throw new Error(result.errors?.[0] || "Failed to generate website");
    }

    // Save website to database
    const website = await db.v4Website.create({
      data: {
        companyId: conversation.companyId,
        conversationId: conversationId,
        userId: conversation.userId,
        websiteData: result.website as object,
        preferences: preferences as object,
        qualityScore: result.qualityScore,
        creativityScore: result.creativityScore,
        isActive: false,
      },
    });

    console.log("[V4 Generate] Website saved to database:", website.id);

    return NextResponse.json({
      website: {
        id: website.id,
        data: result.website,
        qualityScore: result.qualityScore,
        creativityScore: result.creativityScore,
      },
    });
  } catch (error) {
    console.error("[V4 Generate] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate website",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
