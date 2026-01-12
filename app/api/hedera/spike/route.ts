import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { op, message } = body;

    if (op === "createTopic") {
      const svcPath = "@/lib/hedera/service";
      const { createTopic } = await import(svcPath);
      const topicId = await createTopic(true);
      return NextResponse.json({ success: true, topicId });
    }

    if (op === "submitMessage") {
      if (!body.topicId || !message) {
        return NextResponse.json(
          { error: "topicId and message are required" },
          { status: 400 }
        );
      }

      const svcPath = "@/lib/hedera/service";
      const { submitMessage } = await import(svcPath);
      const res = await submitMessage(body.topicId, message, true);
      return NextResponse.json({ success: true, res });
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  } catch (error) {
    console.error("Hedera spike error:", error);
    return NextResponse.json({ error: "Hedera spike failed" }, { status: 500 });
  }
}
