import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const { id } = await params;

    const conversation = await db.storefrontConversation.findUnique({
      where: { id },
    });
    if (!conversation)
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );

    // Permission check - user must be SUPER_ADMIN or owner of company
    const userWithCompanies = await db.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        ownedCompanies: {
          where: { id: conversation.companyId },
          select: { id: true },
        },
      },
    });

    const isSuperAdmin = userWithCompanies?.role === "SUPER_ADMIN";
    const ownsCompany = (userWithCompanies?.ownedCompanies || []).length > 0;

    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const messages = await db.storefrontMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: {
        specVersion: {
          select: {
            id: true,
            spec: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
