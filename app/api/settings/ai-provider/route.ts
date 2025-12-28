import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { encrypt } from "@/lib/crypto";

// Defensive guard shape for Prisma client delegate when client generation is missing
// Keep the shape intentionally loose so runtime checks guard older deployments.
type AiProviderDelegate = {
  findFirst?: (opts?: unknown) => Promise<Record<string, unknown> | null>;
  update?: (opts?: unknown) => Promise<Record<string, unknown> | null>;
  create?: (opts?: unknown) => Promise<Record<string, unknown>>;
};

const aiProviderSchema = z.object({
  scope: z.literal("GLOBAL"),
  provider: z.string().default("openai"),
  isActive: z.boolean(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  apiBase: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) {
      return validation.response;
    }

    const user = validation.user;
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "GLOBAL";

    // Check if this is a read-only status check
    const checkOnly = searchParams.get("checkOnly") === "true";

    // Only super admins can access full settings, but anyone can check status
    if (!checkOnly && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    if (scope !== "GLOBAL") {
      return NextResponse.json(
        { error: "Only GLOBAL scope is supported for AI provider" },
        { status: 400 }
      );
    }

    // Defensive guard in case Prisma Client was not regenerated after adding AiProviderSetting
    const aiProviderClient = (db as unknown as Record<string, unknown>)[
      "aiProviderSetting"
    ] as AiProviderDelegate | undefined;

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
      where: { scope: "GLOBAL" },
    });

    if (!provider) {
      return NextResponse.json({ provider: null });
    }

    return NextResponse.json({
      provider: {
        id: provider.id,
        provider: provider.provider,
        scope: provider.scope,
        isActive: provider.isActive,
        model: provider.model,
        apiBase: provider.apiBase,
        hasApiKey: !!provider.apiKey,
      },
    });
  } catch (error) {
    console.error("[AI Provider] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI provider settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
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

    const body = await req.json();
    const data = aiProviderSchema.parse(body);

    console.log("[AI Provider] POST received data:", {
      provider: data.provider,
      model: data.model,
      apiBase: data.apiBase,
      isActive: data.isActive,
      hasApiKey: !!data.apiKey,
      apiKeyLength: data.apiKey?.length || 0,
    });

    if (data.scope !== "GLOBAL") {
      return NextResponse.json(
        { error: "Only GLOBAL scope is supported for AI provider" },
        { status: 400 }
      );
    }

    // Defensive guard in case Prisma Client was not regenerated after adding AiProviderSetting
    const aiProviderClient = (db as unknown as Record<string, unknown>)[
      "aiProviderSetting"
    ] as AiProviderDelegate | undefined;
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

    const existing = await aiProviderClient.findFirst({
      where: { scope: "GLOBAL" },
    });

    let encryptedApiKey: string | undefined = undefined;
    if (existing && typeof existing.apiKey === "string") {
      encryptedApiKey = existing.apiKey;
    }

    if (data.apiKey && data.apiKey.trim().length > 0) {
      encryptedApiKey = encrypt(data.apiKey.trim());
    }

    const provider =
      existing && typeof aiProviderClient.update === "function"
        ? await aiProviderClient.update({
            where: { id: existing.id },
            data: {
              provider: data.provider,
              isActive: data.isActive,
              apiKey: encryptedApiKey ?? existing.apiKey,
              model: data.model || existing.model,
              apiBase: data.apiBase || existing.apiBase,
            },
          })
        : undefined;

    console.log("[AI Provider] Update result:", {
      updated: !!provider,
      id: provider?.id,
      provider: provider?.provider,
      model: provider?.model,
    });

    const created =
      !existing && typeof aiProviderClient.create === "function"
        ? await aiProviderClient.create({
            data: {
              provider: data.provider,
              scope: "GLOBAL",
              isActive: data.isActive,
              apiKey: encryptedApiKey || "",
              model: data.model,
              apiBase: data.apiBase,
            },
          })
        : undefined;

    return NextResponse.json({
      provider: {
        id: (provider || created)!.id,
        provider: (provider || created)!.provider,
        scope: (provider || created)!.scope,
        isActive: (provider || created)!.isActive,
        model: (provider || created)!.model,
        apiBase: (provider || created)!.apiBase,
        hasApiKey: !!(provider || created)!.apiKey,
      },
    });
  } catch (error) {
    console.error("[AI Provider] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save AI provider settings" },
      { status: 500 }
    );
  }
}
