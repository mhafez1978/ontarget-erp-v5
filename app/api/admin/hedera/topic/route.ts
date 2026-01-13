import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createTopic } from "@/lib/hedera/service";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const memo = body?.memo ?? null;
    const network = body?.network ?? null;

    const topicId = await createTopic(network, memo);
    if (!topicId) {
      return NextResponse.json(
        { error: "Failed to create topic" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, topicId });
  } catch (error) {
    console.error("POST /api/admin/hedera/topic error:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
