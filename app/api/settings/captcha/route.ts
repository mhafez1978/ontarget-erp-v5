import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCaptchaForScope } from "@/lib/captcha";
import { validateSessionForAPI } from "@/lib/validate-session";
import { decrypt, encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;
    const user = validation.user;

    type CaptchaDelegate = {
      findFirst?: (opts?: unknown) => Promise<Record<string, unknown> | null>;
      create?: (opts?: unknown) => Promise<Record<string, unknown>>;
      update?: (opts?: unknown) => Promise<Record<string, unknown>>;
    };

    const captchaProvider = (db as unknown as Record<string, unknown>)[
      "captchaProvider"
    ] as CaptchaDelegate | undefined;

    const hasModel = !!(
      captchaProvider && typeof captchaProvider.findFirst === "function"
    );

    // SUPER_ADMIN sees GLOBAL; ADMIN sees company override and global
    if (user.role === "SUPER_ADMIN") {
      const global = hasModel ? await getCaptchaForScope(undefined) : null;
      return NextResponse.json({
        scope: "GLOBAL",
        provider: global?.provider ?? "GOOGLE_RECAPTCHA",
        isActive: !!global?.isActive,
        siteKey: global?.siteKey ?? null,
        modelAvailable: !!hasModel,
      });
    }

    if (user.role === "ADMIN") {
      // Find company owned by admin (ownerId === user.id)
      const company = await db.company.findFirst({
        where: { ownerId: user.id },
      });
      if (!company) {
        return NextResponse.json(
          { error: "No company found for admin" },
          { status: 404 }
        );
      }
      const companyProvider = hasModel
        ? await getCaptchaForScope(company.id)
        : null;
      const global = hasModel ? await getCaptchaForScope(undefined) : null;
      return NextResponse.json({
        scope: company.id,
        provider: companyProvider?.provider ?? "GOOGLE_RECAPTCHA",
        isActive: !!companyProvider?.isActive,
        siteKey: companyProvider?.siteKey ?? null,
        modelAvailable: !!hasModel,
        fallback: {
          scope: "GLOBAL",
          isActive: !!global?.isActive,
          siteKey: global?.siteKey ?? null,
        },
      });
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  } catch (e) {
    console.error("[captcha settings GET]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;
    const user = validation.user;
    type CaptchaDelegate = {
      findFirst?: (opts?: unknown) => Promise<Record<string, unknown> | null>;
      create?: (opts?: unknown) => Promise<Record<string, unknown>>;
      update?: (opts?: unknown) => Promise<Record<string, unknown>>;
    };

    const captchaProvider = (db as unknown as Record<string, unknown>)[
      "captchaProvider"
    ] as CaptchaDelegate | undefined;

    const hasModel = !!(
      captchaProvider && typeof captchaProvider.findFirst === "function"
    );

    const body = await request.json();
    const { provider, siteKey, secretKey, isActive } = body as {
      provider?: string;
      siteKey?: string;
      secretKey?: string;
      isActive?: boolean;
    };

    if (!siteKey || !secretKey) {
      return NextResponse.json(
        { error: "siteKey and secretKey are required" },
        { status: 400 }
      );
    }

    if (user.role === "SUPER_ADMIN") {
      if (!hasModel) {
        return NextResponse.json(
          {
            error:
              "Captcha model is not available. Run Prisma generate/migrate.",
          },
          { status: 500 }
        );
      }
      const existing = hasModel
        ? await captchaProvider!.findFirst({
            where: { scope: "GLOBAL" },
          })
        : null;
      if (existing) {
        await captchaProvider!.update({
          where: { id: existing.id },
          data: {
            provider: "GOOGLE_RECAPTCHA",
            siteKey,
            secretKey: encrypt(secretKey),
            isActive: isActive ?? true,
            updatedAt: new Date(),
          },
        });
      } else {
        await captchaProvider!.create({
          data: {
            provider: "GOOGLE_RECAPTCHA",
            siteKey,
            secretKey: encrypt(secretKey),
            isActive: isActive ?? true,
            scope: "GLOBAL",
            createdById: user.id,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (user.role === "ADMIN") {
      const company = await db.company.findFirst({
        where: { ownerId: user.id },
      });
      if (!company) {
        return NextResponse.json(
          { error: "No company found for admin" },
          { status: 404 }
        );
      }
      if (!hasModel) {
        return NextResponse.json(
          {
            error:
              "Captcha model is not available. Run Prisma generate/migrate.",
          },
          { status: 500 }
        );
      }
      const existing = hasModel
        ? await captchaProvider!.findFirst({
            where: { scope: company.id },
          })
        : null;
      if (existing) {
        await captchaProvider!.update({
          where: { id: existing.id },
          data: {
            provider: "GOOGLE_RECAPTCHA",
            siteKey,
            secretKey: encrypt(secretKey),
            isActive: isActive ?? true,
            updatedAt: new Date(),
          },
        });
      } else {
        await captchaProvider!.create({
          data: {
            provider: "GOOGLE_RECAPTCHA",
            siteKey,
            secretKey: encrypt(secretKey),
            isActive: isActive ?? true,
            scope: company.id,
            companyId: company.id,
            createdById: user.id,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  } catch (e) {
    console.error("[captcha settings POST]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
