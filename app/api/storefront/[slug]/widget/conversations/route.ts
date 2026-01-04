import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const company = await db.company.findUnique({ where: { slug } });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Prefer a visitor-scoped conversation when available (via cookie)
    // Accept either a per-store cookie or a generic cookie
    const cookieConvId =
      request.cookies.get(`widgetConversationId_${slug}`)?.value ||
      request.cookies.get("widgetConversationId")?.value;
    let conversation = null;

    if (cookieConvId) {
      conversation = await db.storefrontConversation.findFirst({
        where: { id: cookieConvId, companyId: company.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    // Fallback: only return a 'guest' conversation (createdBy is null) so admin/staff chats aren't shown to anonymous visitors
    if (!conversation) {
      conversation = await db.storefrontConversation.findFirst({
        where: { companyId: company.id, createdBy: null },
        orderBy: { createdAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (!conversation)
      return NextResponse.json({ messages: [], conversationId: null });

    return NextResponse.json({
      messages: conversation.messages,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("[widget/conversations] GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { role, content } = body;

    if (!role || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const company = await db.company.findUnique({ where: { slug } });
    if (!company)
      return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Prefer an existing visitor-scoped conversation from cookie if present
    const cookieConvId =
      request.cookies.get(`widgetConversationId_${slug}`)?.value ||
      request.cookies.get("widgetConversationId")?.value;

    let conversation = null;
    if (cookieConvId) {
      conversation = await db.storefrontConversation.findFirst({
        where: { id: cookieConvId, companyId: company.id },
      });
    }

    // Fallback: use/create a guest conversation (createdBy is null). Avoid reusing admin/staff conversations.
    if (!conversation) {
      conversation = await db.storefrontConversation.findFirst({
        where: { companyId: company.id, createdBy: null },
      });
      if (!conversation) {
        conversation = await db.storefrontConversation.create({
          data: { companyId: company.id },
        });
      }
    }

    const message = await db.storefrontMessage.create({
      data: {
        conversationId: conversation.id,
        role,
        content,
        isPreviewOnly: false,
      },
    });

    // Update lastMessageAt
    await db.storefrontConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Return conversationId so clients can persist a visitor-scoped cookie
    return NextResponse.json({ message, conversationId: conversation.id });
  } catch (error) {
    console.error("[widget/conversations] POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
