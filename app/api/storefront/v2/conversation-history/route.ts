import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const companyId = request.nextUrl.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    // Permission check
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

    // Get the most recent conversation and its messages
    const conversation = await db.storefrontConversation.findFirst({
      where: { companyId },
      orderBy: { lastMessageAt: "desc" },
      include: {
        messages: {
          where: {
            // Only get user and assistant messages, not system messages
            role: { in: ["user", "assistant"] },
          },
          orderBy: { createdAt: "asc" },
          select: {
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [] });
    }

    // Map messages to the format expected by the UI
    const messages = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content || undefined,
    }));

    return NextResponse.json({
      messages,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Get conversation history error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation history" },
      { status: 500 }
    );
  }
}
