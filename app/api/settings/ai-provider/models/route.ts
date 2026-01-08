import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAvailableModels, clearModelCache } from "@/lib/ai/model-fetcher";
import { decrypt } from "@/lib/crypto";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function POST(request: NextRequest) {
  try {
    console.log("[Models API] POST request received");

    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      console.log("[Models API] Validation failed");
      return validation.response;
    }

    const { provider, forceRefresh } = await request.json();

    console.log(
      `[Models API] Fetching models for provider: ${provider}, forceRefresh: ${forceRefresh}`
    );

    if (!provider || !["openai", "anthropic", "deepseek"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    // Get API key from settings
    const settings = await db.aiProviderSetting.findFirst({
      where: { provider: provider.toUpperCase() },
    });

    if (!settings?.apiKey) {
      return NextResponse.json(
        { error: "API key not configured for this provider" },
        { status: 400 }
      );
    }

    // Decrypt the API key before using it
    const decryptedKey = decrypt(settings.apiKey);

    if (!decryptedKey) {
      return NextResponse.json(
        { error: "Failed to decrypt API key" },
        { status: 500 }
      );
    }

    // Clear cache if force refresh
    if (forceRefresh) {
      clearModelCache(provider);
    }

    // Fetch available models with decrypted key
    const models = await getAvailableModels(
      provider as "openai" | "anthropic" | "deepseek",
      decryptedKey
    );

    return NextResponse.json({
      success: true,
      provider,
      models,
      count: models.length,
      cached: !forceRefresh,
    });
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch models",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get("provider");

    if (!provider || !["openai", "anthropic", "deepseek"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid or missing provider parameter" },
        { status: 400 }
      );
    }

    // Get API key from settings
    const settings = await db.aiProviderSetting.findFirst({
      where: { provider: provider.toUpperCase() },
    });

    if (!settings?.apiKey) {
      return NextResponse.json(
        { error: "API key not configured for this provider" },
        { status: 400 }
      );
    }

    // Decrypt the API key before using it
    const decryptedKey = decrypt(settings.apiKey);

    if (!decryptedKey) {
      return NextResponse.json(
        { error: "Failed to decrypt API key" },
        { status: 500 }
      );
    }

    // Fetch available models (will use cache if available)
    const models = await getAvailableModels(
      provider as "openai" | "anthropic" | "deepseek",
      decryptedKey
    );

    return NextResponse.json({
      provider,
      models,
      count: models.length,
    });
  } catch (error) {
    console.error("Failed to get models:", error);
    return NextResponse.json(
      {
        error: "Failed to get models",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
