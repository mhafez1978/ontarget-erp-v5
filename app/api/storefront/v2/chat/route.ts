import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { canUseAiStorefront } from "@/lib/billing/plan-gating";
import { generateAiStorefront } from "@/lib/ai/ai-storefront-service";
import type { AiProviderConfig, AiProviderType } from "@/lib/ai/model-client";
import { decrypt } from "@/lib/crypto";
import type { ChatRequestBody, ChatResponse } from "@/lib/storefront/v2-types";
import {
  extractColorsFromLogo,
  canExtractColors,
} from "@/lib/utils/color-extraction";

export async function POST(request: NextRequest) {
  try {
    // Public mode allows bypassing auth for testing. Enable by setting
    // FRONTSTORE_V2_PUBLIC=true in your environment (dev only).
    const isPublic = process.env.FRONTSTORE_V2_PUBLIC === "true";
    let user: { id: string; role: string };

    if (isPublic) {
      console.warn(
        "[AI Storefront] FRONTSTORE_V2_PUBLIC enabled — bypassing auth for testing"
      );
      user = { id: "public", role: "PUBLIC" };
    } else {
      const validation = await validateSessionForAPI(request);
      if (!validation.valid) {
        return validation.response;
      }

      user = validation.user;
    }

    const body = (await request.json()) as ChatRequestBody;
    const { companyId, conversationId, message, previewOnly, intentHints } =
      body;

    if (!companyId || !message) {
      return NextResponse.json(
        { error: "companyId and message are required" },
        { status: 400 }
      );
    }

    // Permission check: SUPER_ADMIN or company owner or owned companies
    let isSuperAdmin = false;
    let ownsCompany = false;
    let userPlan: string | undefined;

    if (!isPublic) {
      const userWithCompanies = await db.user.findUnique({
        where: { id: user.id },
        select: {
          role: true,
          plan: true,
          ownedCompanies: { where: { id: companyId }, select: { id: true } },
        },
      });
      isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
      ownsCompany = (userWithCompanies?.ownedCompanies || []).length > 0;
      userPlan = userWithCompanies?.plan;

      // Plan gating: only allowed plans can use AI storefront (unless SUPER_ADMIN)
      if (!isSuperAdmin && !canUseAiStorefront(userPlan)) {
        return NextResponse.json(
          { error: "AI Storefront is not available for your plan" },
          { status: 403 }
        );
      }

      if (!isSuperAdmin && !ownsCompany) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else {
      // In public mode, we allow calls for testing but do not grant admin rights
      isSuperAdmin = false;
      ownsCompany = true; // allow company-scoped testing
    }

    // Fetch company data
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slogan: true,
        description: true,
        industry: true,
        storeBlogEnabled: true,
        logo: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Find or create conversation
    let conversation = null;
    if (conversationId) {
      conversation = await db.storefrontConversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation || conversation.companyId !== companyId) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    } else {
      conversation = await db.storefrontConversation.create({
        data: { companyId, createdBy: user.id, status: "OPEN" },
      });
    }

    // Persist user message
    const userMessage = await db.storefrontMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
        isPreviewOnly: !!previewOnly,
      },
    });

    // Load conversation history if continuing an existing conversation
    let conversationHistory: Array<{ role: string; content: string }> = [];
    let previousSpec: any = null;

    if (conversationId) {
      const previousMessages = await db.storefrontMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 10, // Last 10 messages for context
        select: {
          role: true,
          content: true,
          specVersionId: true,
        },
      });

      conversationHistory = previousMessages
        .filter((m) => m.content)
        .map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content || "",
        }));

      // Load the most recent spec version to use as baseline
      const lastSpecVersion = await db.storefrontSpecVersion.findFirst({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        select: { spec: true },
      });

      if (lastSpecVersion) {
        previousSpec = lastSpecVersion.spec;
      }
    }

    // Gather storefront preview data (small samples)
    const [products, services, testimonials, postsCount] = await Promise.all([
      db.product.findMany({
        where: { companyId, isPublished: true, isActive: true },
        take: 12,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
        },
      }),
      db.service.findMany({
        where: { companyId, isPublished: true, isActive: true },
        take: 12,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
          duration: true,
        },
      }),
      db.testimonial.findMany({
        where: { companyId, status: "APPROVED" },
        take: 10,
        select: {
          id: true,
          customerName: true,
          customerTitle: true,
          testimonial: true,
          rating: true,
        },
      }),
      db.storefrontPost.count({ where: { companyId } }),
    ]);

    // Map to AiStorefrontInput summaries
    const mappedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      price: Number((p as any).price ?? 0),
      category: p.category ?? null,
    }));
    const mappedServices = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? null,
      price: Number((s as any).price ?? 0),
      category: s.category ?? null,
      duration: s.duration ?? null,
    }));
    const mappedTestimonials = testimonials.map((t) => ({
      id: t.id,
      customerName: t.customerName,
      customerTitle: t.customerTitle ?? null,
      testimonial: t.testimonial,
      rating: t.rating,
    }));

    // Extract logo colors if available
    let extractedBrandColors = null;
    if (company.logo && canExtractColors(company.logo)) {
      try {
        console.log("[AI Storefront] Extracting colors from logo...");
        extractedBrandColors = await extractColorsFromLogo(company.logo);
        console.log("[AI Storefront] Extracted colors:", {
          primary: extractedBrandColors.primarySuggestion,
          secondary: extractedBrandColors.secondarySuggestion,
          isDark: extractedBrandColors.isDarkLogo,
          isLight: extractedBrandColors.isLightLogo,
        });
      } catch (err) {
        console.warn("[AI Storefront] Failed to extract logo colors:", err);
      }
    }

    // Prepare AI input
    const aiInput = {
      company: {
        id: company.id,
        name: company.name,
        slogan: company.slogan ?? null,
        description: company.description ?? null,
        industry: company.industry ?? null,
        logo: company.logo,
        extractedBrandColors: extractedBrandColors || undefined,
      },
      products: mappedProducts,
      services: mappedServices,
      testimonials: mappedTestimonials,
      brandColors: undefined,
      heroLayout: intentHints?.style === "center" ? "center" : "left",
      showLocation: true,
      showTeam: true,
      showTestimonials: true,
      blogEnabled: !!company.storeBlogEnabled,
      blogHasPosts: postsCount > 0,
      contact: {},
      prompt: message,
      goal: (intentHints?.goal as any) ?? "lead-gen",
      tone: (intentHints?.style === "playful" ? "playful" : "serious") as any,
      includeProducts: intentHints?.emphasis === "products" || true,
      includeServices: intentHints?.emphasis === "services" || true,
      includePosts: !!company.storeBlogEnabled,
      conversationHistory,
      previousSpec,
    };

    // Load global AI provider config, if any (so admin settings apply)
    let providerConfig: AiProviderConfig | undefined;
    const aiProviderClient = (db as unknown as Record<string, unknown>)[
      "aiProviderSetting"
    ] as
      | { findFirst?: (opts?: unknown) => Promise<unknown | null> }
      | undefined;
    if (aiProviderClient && typeof aiProviderClient.findFirst === "function") {
      try {
        const aiProvider = (await aiProviderClient.findFirst({
          where: { scope: "GLOBAL", isActive: true },
        })) as Record<string, unknown> | null;
        if (aiProvider) {
          // If apiKey is present as a string, attempt to decrypt it. Otherwise
          // log a helpful message so admins know to re-save the provider key.
          if (typeof aiProvider.apiKey === "string" && aiProvider.apiKey) {
            try {
              providerConfig = {
                provider: (aiProvider.provider as AiProviderType) || "openai",
                apiKey: decrypt(aiProvider.apiKey as string),
                model:
                  typeof aiProvider.model === "string"
                    ? (aiProvider.model as string)
                    : undefined,
                apiBase:
                  typeof aiProvider.apiBase === "string"
                    ? (aiProvider.apiBase as string)
                    : undefined,
              };
            } catch (dErr) {
              console.warn(
                "[AI Storefront] Failed to decrypt stored AI provider key; ensure ENCRYPTION_KEY matches the value used when saving the provider",
                dErr
              );
            }
          } else {
            console.warn(
              "[AI Storefront] AI provider record found but apiKey is empty — re-enter the API key in Settings > AI Provider and toggle active."
            );
          }
        }
      } catch (e) {
        console.warn("Failed to load AI provider settings:", e);
      }
    }

    // Call AI service to generate preview spec (pass provider config so admin setting is honored)
    const result = await generateAiStorefront(aiInput as any, providerConfig);

    if (result.safety && result.safety.blocked) {
      // Persist AI blocked message
      const blockedMessage = await db.storefrontMessage.create({
        data: {
          conversationId: conversation.id,
          role: "ai",
          content: "Generation blocked due to unsafe content.",
          isPreviewOnly: true,
        },
      });

      return NextResponse.json({
        messages: [userMessage, blockedMessage],
        specDelta: null,
      } as ChatResponse);
    }
    // If the model wants to ask a clarifying question, return it as an AI message
    if (result.shouldAsk && result.assistantMessage) {
      const aiMessage = await db.storefrontMessage.create({
        data: {
          conversationId: conversation.id,
          role: "ai",
          content: result.assistantMessage,
          isPreviewOnly: true,
        },
      });

      await db.storefrontConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      const messages = [userMessage, aiMessage].map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role as "user" | "ai" | "system",
        content: m.content ?? null,
        toolsUsed: null,
        specVersionId: (m as any).specVersionId ?? null,
        isApplied: m.isApplied,
        isPreviewOnly: m.isPreviewOnly,
        createdAt: m.createdAt.toISOString(),
      }));

      const response: ChatResponse = {
        messages,
        specDelta: null,
        previewSpec: null,
        versionId: null,
        conversationId: conversation.id,
        actions: [],
      };

      (response as any).modelUsed = !!(result as any).usedModel;
      (response as any).providerUsed = !!providerConfig;

      return NextResponse.json(response);
    }

    // Persist spec version (preview)
    const specVersion = await db.storefrontSpecVersion.create({
      data: {
        companyId,
        spec: result.spec as any,
        createdBy: user.id,
        messageId: null,
      },
    });

    // Persist AI message linking to spec version
    const aiMessage = await db.storefrontMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ai",
        content: "AI generated a storefront preview.",
        specVersionId: specVersion.id,
        isPreviewOnly: true,
      },
    });

    // Update conversation lastMessageAt
    await db.storefrontConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    const messages = [userMessage, aiMessage].map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role as "user" | "ai" | "system",
      content: m.content ?? null,
      toolsUsed: null,
      specVersionId: (m as any).specVersionId ?? null,
      isApplied: m.isApplied,
      isPreviewOnly: m.isPreviewOnly,
      createdAt: m.createdAt.toISOString(),
    }));

    const response: ChatResponse = {
      messages,
      specDelta: result.spec,
      previewSpec: result.spec,
      versionId: specVersion.id,
      conversationId: conversation.id,
      actions: ["apply", "export"],
    };

    // Include debug info so UI can surface whether a remote model was used
    (response as any).modelUsed = !!result.usedModel;
    (response as any).providerUsed = !!providerConfig;

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
