import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    // Only SUPER_ADMIN can fetch full settings
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const config = await db.videoProviderConfig.findFirst({
      where: { scope: "GLOBAL" },
    });
    if (!config) return NextResponse.json({ config: null });

    return NextResponse.json({
      config: {
        id: config.id,
        ltxEnabled: config.ltxEnabled,
        hfEnabled: config.hfEnabled,
        primaryProvider: config.primaryProvider,
        hasLtxApiKey: !!config.ltxApiKey,
        hasLtxSecret: !!config.ltxSecret,
        hasHfApiToken: !!config.hfApiToken,
        lastTestedAt: config.lastTestedAt,
        isConnected: config.isConnected,
        lastError: config.lastError,
      },
    });
  } catch (error) {
    console.error("[Video Provider] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video provider config" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Super Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      ltxApiKey,
      ltxSecret,
      hfApiToken,
      ltxEnabled,
      hfEnabled,
      primaryProvider,
    } = body;

    const existing = await db.videoProviderConfig.findFirst({
      where: { scope: "GLOBAL" },
    });

    const encryptedLtxApiKey =
      ltxApiKey && ltxApiKey.trim().length > 0
        ? encrypt(ltxApiKey.trim())
        : existing?.ltxApiKey;
    const encryptedLtxSecret =
      ltxSecret && ltxSecret.trim().length > 0
        ? encrypt(ltxSecret.trim())
        : existing?.ltxSecret;
    const encryptedHfApiToken =
      hfApiToken && hfApiToken.trim().length > 0
        ? encrypt(hfApiToken.trim())
        : existing?.hfApiToken;

    const upsert = existing
      ? await db.videoProviderConfig.update({
          where: { id: existing.id },
          data: {
            ltxApiKey: encryptedLtxApiKey ?? null,
            ltxSecret: encryptedLtxSecret ?? null,
            hfApiToken: encryptedHfApiToken ?? null,
            ltxEnabled: Boolean(ltxEnabled),
            hfEnabled: Boolean(hfEnabled),
            primaryProvider: primaryProvider || existing.primaryProvider,
          },
        })
      : await db.videoProviderConfig.create({
          data: {
            scope: "GLOBAL",
            ltxApiKey: encryptedLtxApiKey ?? null,
            ltxSecret: encryptedLtxSecret ?? null,
            hfApiToken: encryptedHfApiToken ?? null,
            ltxEnabled: Boolean(ltxEnabled),
            hfEnabled: Boolean(hfEnabled),
            primaryProvider: primaryProvider || "ltx",
            createdById: user.id,
          },
        });

    return NextResponse.json({ success: true, id: upsert.id });
  } catch (error) {
    console.error("[Video Provider] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save video provider config" },
      { status: 500 }
    );
  }
}
