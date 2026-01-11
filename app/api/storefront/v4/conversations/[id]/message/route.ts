import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { buildV4Context } from "@/lib/ai/v4-context-builder";
import { continueConversation } from "@/lib/ai/v4-conversation-service";
import type { AiProviderConfig } from "@/lib/ai/model-client";

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
    const body = await req.json();
    const { message, providerConfig } = body as {
      message: string;
      providerConfig?: AiProviderConfig;
    };

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Load conversation with messages
    const conversation = await db.v4Conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
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

    // Check if conversation is already complete
    if (conversation.isComplete) {
      return NextResponse.json(
        { error: "Conversation is already complete" },
        { status: 400 }
      );
    }

    // Build context
    console.log(
      "[V4 Message] Building context for company:",
      conversation.companyId
    );
    const context = await buildV4Context(conversation.companyId, db);

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
            "[V4 Message] Using global AI provider:",
            aiProvider.provider
          );
        }
      }
    }

    // Ensure we have AI provider config
    if (!finalProviderConfig) {
      return NextResponse.json(
        { error: "No AI provider configured" },
        { status: 500 }
      );
    }

    // Reconstruct conversation object
    const conversationObj = {
      id: conversation.id,
      companyId: conversation.companyId,
      userId: conversation.userId,
      phase: conversation.phase as
        | "greeting"
        | "understanding-business"
        | "design-style"
        | "hero-preferences"
        | "color-selection"
        | "typography"
        | "layout-preferences"
        | "final-confirmation"
        | "generating"
        | "complete",
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.createdAt,
        phase: msg.phase as
          | "greeting"
          | "understanding-business"
          | "design-style"
          | "hero-preferences"
          | "color-selection"
          | "typography"
          | "layout-preferences"
          | "final-confirmation"
          | "generating"
          | "complete",
      })),
      preferences: {
        heroStyle: conversation.heroStyle as
          | "compact"
          | "split-screen"
          | "full-screen"
          | "above-fold"
          | undefined,
        primaryColor: conversation.primaryColor || undefined,
        secondaryColor: conversation.secondaryColor || undefined,
        accentColor: conversation.accentColor || undefined,
        fontPairing: conversation.fontPairing as
          | "playful"
          | "minimal"
          | "bold"
          | "modern"
          | "classic"
          | undefined,
        sections:
          (conversation.sections as {
            hero: boolean;
            features: boolean;
            products: boolean;
            services: boolean;
            team: boolean;
            testimonials: boolean;
            gallery: boolean;
            blog: boolean;
            faq: boolean;
            contact: boolean;
          }) || {},
      },
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    // Continue conversation with AI
    console.log(
      "[V4 Message] Continuing conversation, phase:",
      conversation.phase
    );
    const result = await continueConversation(
      conversationObj,
      message,
      context,
      finalProviderConfig
    );

    // Update conversation in database
    await db.v4Conversation.update({
      where: { id: conversationId },
      data: {
        phase: result.phase,
        heroStyle: result.preferences.heroStyle || null,
        primaryColor: result.preferences.primaryColor || null,
        secondaryColor: result.preferences.secondaryColor || null,
        accentColor: result.preferences.accentColor || null,
        fontPairing: result.preferences.fontPairing || null,
        sections:
          (result.preferences.sections as Record<string, boolean>) || undefined,
        isComplete: result.phase === "complete",
      },
    });

    // Save new messages (user message + AI response)
    await db.v4Message.createMany({
      data: [
        {
          conversationId,
          role: "user",
          content: message,
          phase: conversation.phase, // Use previous phase for user message
        },
        {
          conversationId,
          role: "assistant",
          content: result.messages[result.messages.length - 1].content,
          phase: result.phase, // Use new phase for AI response
        },
      ],
    });

    // Return updated conversation
    return NextResponse.json({
      conversation: {
        id: conversationId,
        companyId: conversation.companyId,
        userId: conversation.userId,
        phase: result.phase,
        isComplete: result.phase === "complete",
        messages: result.messages,
        preferences: result.preferences,
      },
      isComplete: result.phase === "complete",
    });
  } catch (error) {
    console.error("[V4 Message] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
