import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { buildV4Context } from "@/lib/ai/v4-context-builder";
import { startConversation } from "@/lib/ai/v4-conversation-service";
import type { AiProviderConfig } from "@/lib/ai/model-client";

type AiProviderType =
  | "openai"
  | "openai-compatible"
  | "anthropic"
  | "xai"
  | "deepseek";

export async function POST(req: NextRequest) {
  try {
    // Validate session
    const sessionResult = await validateSessionForAPI(req);
    if (!sessionResult.valid) {
      return sessionResult.response;
    }

    const userId = sessionResult.user.id;
    const body = await req.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const company = await db.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 404 }
      );
    }

    // Build context from database
    console.log("[V4 Start] Building context for company:", companyId);
    const context = await buildV4Context(companyId, db);

    // Load global AI provider config
    let providerConfig: AiProviderConfig | undefined;
    const aiProviderClient = (
      db as typeof db & { aiProviderSetting?: typeof db.aiProviderSetting }
    ).aiProviderSetting;
    if (aiProviderClient && typeof aiProviderClient.findFirst === "function") {
      const aiProvider = await aiProviderClient.findFirst({
        where: { scope: "GLOBAL", isActive: true },
      });

      if (aiProvider && aiProvider.apiKey) {
        providerConfig = {
          provider: aiProvider.provider as AiProviderType,
          apiKey: decrypt(aiProvider.apiKey),
          model: aiProvider.model || undefined,
          apiBase: aiProvider.apiBase || undefined,
        };
        console.log(
          "[V4 Start] Using global AI provider:",
          aiProvider.provider,
          aiProvider.model
        );
      }
    }

    if (!providerConfig) {
      console.warn("[V4 Start] No global AI provider configured");
    }

    // Start conversation with AI
    console.log("[V4 Start] Starting conversation with AI");
    const conversationResult = await startConversation(
      companyId,
      userId,
      context,
      providerConfig
    );

    // Save conversation to database
    const dbConversation = await db.v4Conversation.create({
      data: {
        companyId,
        userId,
        phase: conversationResult.phase,
        isComplete: false,
      },
    });

    // Save initial messages
    await db.v4Message.createMany({
      data: conversationResult.messages.map((msg) => ({
        conversationId: dbConversation.id,
        role: msg.role,
        content: msg.content,
        phase: conversationResult.phase,
      })),
    });

    // Return conversation with messages
    return NextResponse.json({
      conversation: {
        id: dbConversation.id,
        companyId: dbConversation.companyId,
        userId: dbConversation.userId,
        phase: dbConversation.phase,
        isComplete: dbConversation.isComplete,
        messages: conversationResult.messages,
        preferences: {},
      },
    });
  } catch (error) {
    console.error("[V4 Start] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to start conversation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
