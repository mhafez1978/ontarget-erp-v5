import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { ImageProviderType } from "@prisma/client";
import { encrypt, decrypt } from "@/lib/encryption";
import { validateSessionForAPI } from "@/lib/validate-session";
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from "@/lib/audit-log";

type ImageProviderRequestBody = {
  provider: ImageProviderType;
  isActive?: boolean;
  scope: string;
  apiKey?: string;
  apiSecret?: string;
};

export async function GET(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    // GLOBAL scope allowed only to SUPER_ADMIN
    if (scope === "GLOBAL") {
      if (user.role !== "SUPER_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const setting = await db.imageProvider.findFirst({
        where: { scope: "GLOBAL" },
      });
      return NextResponse.json({
        provider: setting
          ? {
              provider: setting.provider,
              apiKey: setting.apiKey ? "••••••••" : "",
            }
          : null,
      });
    }

    // Only GLOBAL scope supported
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) return validation.response;
    const user = validation.user;

    const body = await req.json();
    const { provider, isActive, scope, apiKey, apiSecret } =
      body as ImageProviderRequestBody;

    // Encrypt provided secrets ahead of DB write. If encryption fails, abort and log.
    let encryptedApiKey: string | undefined = undefined;
    let encryptedApiSecret: string | undefined = undefined;
    try {
      if (apiKey) encryptedApiKey = encrypt(apiKey);
      if (apiSecret) encryptedApiSecret = encrypt(apiSecret);
    } catch (e) {
      console.warn("Failed to encrypt image provider keys", e);
      return NextResponse.json(
        { error: "Failed to save settings" },
        { status: 500 }
      );
    }

    if (!provider || !["UNSPLASH", "PEXELS"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    if (scope === "GLOBAL") {
      if (user.role !== "SUPER_ADMIN")
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const existing = await db.imageProvider.findFirst({
        where: { scope: "GLOBAL" },
      });
      if (existing) {
        const updated = await db.imageProvider.update({
          where: { id: existing.id },
          data: {
            provider,
            isActive: !!isActive,
            apiKey: encryptedApiKey,
            apiSecret: encryptedApiSecret,
            updatedAt: new Date(),
          },
        });

        // Audit log: global provider updated
        try {
          await createAuditLog({
            action: AUDIT_ACTIONS.SETTINGS_UPDATED,
            userId: user.id,
            companyId: null,
            entityType: ENTITY_TYPES.SETTINGS,
            entityId: "image-provider:GLOBAL",
            description: `Global image provider updated to ${provider}`,
            metadata: {
              provider,
              isActive: !!isActive,
              hasApiKey: !!apiKey,
            },
          });
        } catch (e) {
          console.error(
            "Failed to create audit log for image provider update",
            e
          );
        }

        return NextResponse.json({ provider: updated });
      } else {
        const created = await db.imageProvider.create({
          data: {
            provider,
            isActive: !!isActive,
            scope: "GLOBAL",
            apiKey: encryptedApiKey,
            apiSecret: encryptedApiSecret,
            createdById: user.id,
          },
        });

        // Audit log: global provider created
        try {
          await createAuditLog({
            action: AUDIT_ACTIONS.SETTINGS_UPDATED,
            userId: user.id,
            companyId: null,
            entityType: ENTITY_TYPES.SETTINGS,
            entityId: "image-provider:GLOBAL",
            description: `Global image provider created: ${provider}`,
            metadata: {
              provider,
              isActive: !!isActive,
              hasApiKey: !!apiKey,
            },
          });
        } catch (e) {
          console.error(
            "Failed to create audit log for image provider creation",
            e
          );
        }

        return NextResponse.json({ provider: created });
      }
    }

    // Only GLOBAL scope supported; company-scoped configuration is not allowed
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
