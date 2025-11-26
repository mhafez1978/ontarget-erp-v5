import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto";

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
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const user = validation.user;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "GLOBAL";

    if (scope !== "GLOBAL") {
      return NextResponse.json(
        { error: "Only GLOBAL scope is supported for AI provider" },
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
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
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

    if (data.scope !== "GLOBAL") {
      return NextResponse.json(
        { error: "Only GLOBAL scope is supported for AI provider" },
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

    const existing = await aiProviderClient.findFirst({
      where: { scope: "GLOBAL" },
    });

    let encryptedApiKey: string | undefined = existing?.apiKey;

    if (data.apiKey && data.apiKey.trim().length > 0) {
      encryptedApiKey = encrypt(data.apiKey.trim());
    }

    const provider =
      existing &&
      (await aiProviderClient.update({
        where: { id: existing.id },
        data: {
          provider: data.provider,
          isActive: data.isActive,
          apiKey: encryptedApiKey ?? existing.apiKey,
          model: data.model || existing.model,
          apiBase: data.apiBase || existing.apiBase,
        },
      }));

    const created =
      !existing &&
      (await aiProviderClient.create({
        data: {
          provider: data.provider,
          scope: "GLOBAL",
          isActive: data.isActive,
          apiKey: encryptedApiKey || "",
          model: data.model,
          apiBase: data.apiBase,
        },
      }));

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
