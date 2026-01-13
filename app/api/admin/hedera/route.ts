import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { encrypt, maskSensitiveData } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const user = validation.user;

    // Only SUPER_ADMIN and ADMIN may access; ADMINs see only companies they own
    if (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const setting = await db.hederaSetting.findFirst();

    // Mask secrets for safe display
    const safe = setting
      ? {
          ...setting,
          hederaHexKey: maskSensitiveData(setting.hederaHexKey || ""),
          hederaDerKey: maskSensitiveData(setting.hederaDerKey || ""),
          hederaDerPub: maskSensitiveData(setting.hederaDerPub || ""),
          hashSalt: maskSensitiveData(setting.hashSalt || ""),
        }
      : null;

    let companies;

    if (user.role === "SUPER_ADMIN") {
      // Show root company and any companies owned by this super admin
      companies = await db.company.findMany({
        where: { OR: [{ ownerId: user.id }, { isRoot: true }] },
        select: {
          id: true,
          name: true,
          companyHederaSetting: true,
        },
        orderBy: { name: "asc" },
      });
    } else {
      // ADMIN: only companies owned by this admin
      companies = await db.company.findMany({
        where: { ownerId: user.id },
        select: {
          id: true,
          name: true,
          companyHederaSetting: true,
        },
        orderBy: { name: "asc" },
      });

      // If ADMIN doesn't own any companies, deny access to the admin hedra page
      if (!companies || companies.length === 0) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

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
      hederaHexKey,
      hederaDerKey,
      hederaDerPub,
      topicId,
      hashSalt,
      isActive,
      network,
      enableCompanies, // optional array of company ids to enable
    } = body;

    // Encrypt sensitive fields
    const encryptedHexKey = hederaHexKey ? encrypt(hederaHexKey) : undefined;
    const encryptedDerKey = hederaDerKey ? encrypt(hederaDerKey) : undefined;
    const encryptedDerPub = hederaDerPub ? encrypt(hederaDerPub) : undefined;
    const encryptedSalt = hashSalt ? encrypt(hashSalt) : undefined;

    const existing = await db.hederaSetting.findFirst();
    let setting;
    if (existing) {
      setting = await db.hederaSetting.update({
        where: { id: existing.id },
        data: {
          hederaAccount,
          hederaHexKey: encryptedHexKey,
          hederaDerKey: encryptedDerKey,
          hederaDerPub: encryptedDerPub,
          topicId,
          hashSalt: encryptedSalt,
          isActive,
          network,
        },
      });
    } else {
      setting = await db.hederaSetting.create({
        data: {
          hederaAccount,
          hederaHexKey: encryptedHexKey,
          hederaDerKey: encryptedDerKey,
          hederaDerPub: encryptedDerPub,
          topicId,
          hashSalt: encryptedSalt,
          isActive,
          network,
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
