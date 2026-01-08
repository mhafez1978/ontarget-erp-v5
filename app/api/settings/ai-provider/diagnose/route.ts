import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { decrypt, isEncrypted } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) return validation.response as NextResponse;

    const user = validation.user;
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const aiProviderClient = db.aiProviderSetting;
    if (!aiProviderClient || typeof aiProviderClient.findFirst !== "function") {
      return NextResponse.json(
        { error: "AiProviderSetting model is not available" },
        { status: 500 }
      );
    }

    const provider = await aiProviderClient.findFirst({
      where: { scope: "GLOBAL" },
    });
    if (!provider) return NextResponse.json({ provider: null });

    const hasApiKey = !!provider.apiKey;
    let decryptable = false;
    let decryptError: string | null = null;

    if (hasApiKey) {
      try {
        // Attempt to decrypt to validate encryption key without returning the key
        const maybe = decrypt(provider.apiKey as string);
        decryptable = typeof maybe === "string" && maybe.length > 0;
      } catch (err: unknown) {
        decryptError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({
      provider: {
        id: provider.id,
        provider: provider.provider,
        scope: provider.scope,
        isActive: provider.isActive,
        model: provider.model || null,
        apiBase: provider.apiBase || null,
        hasApiKey,
        apiKeyEncrypted: hasApiKey
          ? isEncrypted(provider.apiKey as string)
          : false,
        decryptable,
        decryptError,
      },
    });
  } catch (error) {
    console.error("[AI Provider] Diagnose error:", error);
    return NextResponse.json({ error: "Diagnose failed" }, { status: 500 });
  }
}
