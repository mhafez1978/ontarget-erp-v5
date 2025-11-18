import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch all OAuth provider settings
    const providers = await db.oAuthProviderSetting.findMany({
      select: {
        id: true,
        provider: true,
        enabled: true,
        clientId: true,
        // Don't expose clientSecret
      },
    });

    // Transform to a more user-friendly format
    const emailProviders: Record<
      string,
      { enabled: boolean; clientId: string | null }
    > = {};

    // List of all supported providers
    const supportedProviders = [
      "google",
      "microsoft",
      "yahoo",
      "github",
      "linkedin",
      "yandex",
      "wechat",
      "line",
    ];

    supportedProviders.forEach((providerName) => {
      emailProviders[providerName] = providers.find(
        (p) => p.provider === providerName
      ) || {
        enabled: false,
        clientId: null,
      };
    });

    return NextResponse.json({
      success: true,
      providers: emailProviders,
    });
  } catch (error) {
    console.error("Error fetching email providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch email providers" },
      { status: 500 }
    );
  }
}
