import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const providers = await db.oAuthProviderSetting.findMany({
      select: {
        id: true,
        provider: true,
        enabled: true,
        clientId: true,
        clientSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error fetching OAuth providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch OAuth providers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, enabled, clientId, clientSecret } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

    // Check if provider settings exist
    const existingProvider = await db.oAuthProviderSetting.findUnique({
      where: { provider },
    });

    let providerSettings;
    if (existingProvider) {
      // Update existing provider
      providerSettings = await db.oAuthProviderSetting.update({
        where: { provider },
        data: {
          enabled,
          ...(clientId !== undefined && { clientId }),
          ...(clientSecret !== undefined && { clientSecret }),
        },
        select: {
          id: true,
          provider: true,
          enabled: true,
          clientId: true,
          updatedAt: true,
        },
      });
    } else {
      // Create new provider
      providerSettings = await db.oAuthProviderSetting.create({
        data: {
          provider,
          enabled,
          clientId,
          clientSecret,
        },
        select: {
          id: true,
          provider: true,
          enabled: true,
          clientId: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({ success: true, provider: providerSettings });
  } catch (error) {
    console.error("Error updating OAuth provider:", error);
    return NextResponse.json(
      { error: "Failed to update OAuth provider" },
      { status: 500 }
    );
  }
}
