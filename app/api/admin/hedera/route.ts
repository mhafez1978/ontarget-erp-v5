import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { encrypt, maskSensitiveData } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const setting = await db.hederaSetting.findFirst();

    // Mask secrets for safe display
    const safe = setting
      ? {
          ...setting,
          hederaKey: maskSensitiveData(setting.hederaKey || ""),
          hashSalt: maskSensitiveData(setting.hashSalt || ""),
        }
      : null;

    const companies = await db.company.findMany({
      select: {
        id: true,
        name: true,
        companyHederaSetting: true,
      },
    });

    return NextResponse.json({ success: true, setting: safe, companies });
  } catch (error) {
    console.error("GET /api/admin/hedera error:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      hederaAccount,
      hederaKey,
      topicId,
      hashSalt,
      isActive,
      useTestnet,
      enableCompanies, // optional array of company ids to enable
    } = body;

    // Encrypt sensitive fields
    const encryptedKey = hederaKey ? encrypt(hederaKey) : undefined;
    const encryptedSalt = hashSalt ? encrypt(hashSalt) : undefined;

    const existing = await db.hederaSetting.findFirst();
    let setting;
    if (existing) {
      setting = await db.hederaSetting.update({
        where: { id: existing.id },
        data: {
          hederaAccount,
          hederaKey: encryptedKey,
          topicId,
          hashSalt: encryptedSalt,
          isActive,
          useTestnet,
        },
      });
    } else {
      setting = await db.hederaSetting.create({
        data: {
          hederaAccount,
          hederaKey: encryptedKey,
          topicId,
          hashSalt: encryptedSalt,
          isActive,
          useTestnet,
        },
      });
    }

    // If companies to enable are provided, update CompanyHederaSetting
    if (Array.isArray(enableCompanies) && enableCompanies.length > 0) {
      for (const companyId of enableCompanies) {
        await db.companyHederaSetting.upsert({
          where: { companyId },
          create: {
            companyId,
            enabled: true,
            enabledAt: new Date(),
            enabledById: user.id,
          },
          update: {
            enabled: true,
            enabledAt: new Date(),
            enabledById: user.id,
          },
        });

        await db.hederaCompanyAudit.create({
          data: {
            companyId,
            actorId: user.id,
            action: "ENABLE",
            details: { enabledBy: user.id },
          },
        });
      }
    }

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error("POST /api/admin/hedera error:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
