import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { callStorefrontModel } from "@/lib/ai/model-client";
import { decrypt } from "@/lib/crypto";
import { z } from "zod";

const testSchema = z.object({
  scope: z.literal("GLOBAL").default("GLOBAL"),
});

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Defensive guard in case Prisma Client was not regenerated after adding AiProviderSetting
    const aiProviderClient: any = (db as any).aiProviderSetting;
    if (!aiProviderClient || typeof aiProviderClient.findFirst !== "function") {
      console.error(
        "[AI Provider] Prisma client is missing AiProviderSetting model. Run `npx prisma generate` and restart the dev server."
      );
      return NextResponse.json(
        {
          error:
            "AI provider model is not available in Prisma Client. Run `npx prisma generate` and restart the server.",
        },
        { status: 500 }
      );
    }

    const provider = await aiProviderClient.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "No active AI provider configured" },
        { status: 400 }
      );
    }

    // For now, test that we can call the model and parse a simple JSON object.
    const testSchemaZod = z.object({
      ok: z.boolean(),
    });

    const messages = [
      {
        role: "system" as const,
        content:
          'Respond ONLY with JSON: { "ok": true } if you can understand this request.',
      },
      {
        role: "user" as const,
        content: "Return the JSON object now.",
      },
    ];

    const result = await callStorefrontModel(messages, testSchemaZod, {
      apiKey: decrypt(provider.apiKey),
      model: provider.model || undefined,
      apiBase: provider.apiBase || undefined,
    });

    if (!result || !result.ok) {
      return NextResponse.json(
        { error: "AI provider response was invalid" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI provider connection test succeeded",
    });
  } catch (error) {
    console.error("[AI Provider] Test error:", error);
    return NextResponse.json(
      { error: "AI provider test failed" },
      { status: 500 }
    );
  }
}
