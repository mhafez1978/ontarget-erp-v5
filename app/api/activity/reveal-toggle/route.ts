import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit-log";
import { z } from "zod";

const bodySchema = z.object({
  toggledOn: z.boolean(),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    const { user } = validation as { user: { id: string } };

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { toggledOn, context } = parsed.data;

    // Create an audit log entry (no PAN or PII in metadata)
    await createAuditLog({
      action: AUDIT_ACTIONS.PAYMENT_REVEAL_TOGGLED,
      userId: user?.id ?? null,
      description: `User ${toggledOn ? "opened" : "closed"} card reveal (${
        context || "unknown"
      })`,
      metadata: {
        toggledOn,
        context: context || null,
        note: "No PAN or card digits are recorded",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record reveal toggle:", error);
    return NextResponse.json(
      { error: "Failed to record event" },
      { status: 500 }
    );
  }
}
