import { db } from "./db";
import { decrypt } from "./encryption";

export type CaptchaProvider = "GOOGLE_RECAPTCHA";

export type CaptchaSettings = {
  provider: CaptchaProvider;
  siteKey: string;
  secretKey: string;
  scope: string; // "GLOBAL" or companyId
  isActive: boolean;
} | null;

interface CaptchaRecord {
  siteKey?: string | null;
  secretKey?: string | null;
  scope: string;
  isActive: boolean;
}

interface CaptchaRepo {
  findFirst: (args: {
    where: { scope: string; isActive: boolean };
  }) => Promise<CaptchaRecord | null>;
}

export async function getCaptchaForScope(
  companyId?: string
): Promise<CaptchaSettings> {
  const repo = (db as unknown as { captchaProvider?: CaptchaRepo })
    .captchaProvider;
  if (!repo || typeof repo.findFirst !== "function") {
    return null;
  }

  if (companyId) {
    const companyProvider = await repo.findFirst({
      where: { scope: companyId, isActive: true },
    });
    if (companyProvider?.siteKey && companyProvider?.secretKey) {
      return {
        provider: "GOOGLE_RECAPTCHA",
        siteKey: companyProvider.siteKey,
        secretKey: decrypt(companyProvider.secretKey!),
        scope: companyProvider.scope,
        isActive: companyProvider.isActive,
      };
    }
  }

  const globalProvider = await repo.findFirst({
    where: { scope: "GLOBAL", isActive: true },
  });
  if (globalProvider?.siteKey && globalProvider?.secretKey) {
    return {
      provider: "GOOGLE_RECAPTCHA",
      siteKey: globalProvider.siteKey,
      secretKey: decrypt(globalProvider.secretKey!),
      scope: globalProvider.scope,
      isActive: globalProvider.isActive,
    };
  }
  return null;
}

export async function verifyGoogleCaptcha(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const resp = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }
    );
    const data = (await resp.json()) as { success?: boolean; score?: number };
    if (!data?.success) return false;
    if (typeof data?.score === "number" && data.score < 0.5) return false;
    return true;
  } catch (e) {
    console.error("[captcha] Verification error:", e);
    return false;
  }
}

export async function verifyGoogleCaptchaDetailed(
  token: string,
  secret: string
): Promise<{
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}> {
  try {
    const resp = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token }),
      }
    );
    const data = (await resp.json()) as Record<string, unknown> | null;

    // Normalize to the typed response shape
    const dataObj = data as Record<string, unknown>;
    const score: number | undefined =
      typeof dataObj?.score === "number" ? dataObj.score : undefined;
    const action: string | undefined =
      typeof dataObj?.action === "string" ? dataObj.action : undefined;
    const challenge_ts: string | undefined =
      typeof dataObj?.challenge_ts === "string"
        ? dataObj.challenge_ts
        : undefined;
    const hostname: string | undefined =
      typeof dataObj?.hostname === "string" ? dataObj.hostname : undefined;
    const errorCodes: string[] | undefined = Array.isArray(
      dataObj?.["error-codes"]
    )
      ? (dataObj["error-codes"] as string[])
      : undefined;

    const result = {
      success: !!dataObj?.success,
      score,
      action,
      challenge_ts,
      hostname,
      "error-codes": errorCodes,
    };

    return result;
  } catch (e) {
    console.error("[captcha] Detailed verification error:", e);
    return { success: false, "error-codes": ["exception"] };
  }
}
