import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { generateAiStorefront } from "@/lib/ai/ai-storefront-service";
import type { ChatRequestBody, ChatResponse } from "@/lib/storefront/v2-types";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;

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
    const userWithCompanies = await db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        ownedCompanies: { where: { id: companyId }, select: { id: true } },
      },
    });

    const isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
    const ownsCompany = (userWithCompanies?.ownedCompanies || []).length > 0;

    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

    // Prepare AI input
    const aiInput = {
      company: {
        id: company.id,
        name: company.name,
        slogan: company.slogan ?? null,
        description: company.description ?? null,
        industry: company.industry ?? null,
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
    };

    // Call AI service to generate preview spec
    const result = await generateAiStorefront(aiInput as any);

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
      actions: ["apply", "export"],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
