import { NextRequest, NextResponse } from "next/server";
import { getCaptchaForScope } from "@/lib/captcha";

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get("host") || "";
    const isLocalhostRequest =
      host.includes("localhost") || host.includes("127.0.0.1");
    const bypassActive =
      (process.env.NODE_ENV !== "production" &&
        String(process.env.CAPTCHA_BYPASS || "").toLowerCase() === "true") ||
      (isLocalhostRequest &&
        String(process.env.CAPTCHA_ALLOW_LOCALHOST || "").toLowerCase() ===
          "true");
    const captcha = await getCaptchaForScope(undefined);
    if (!captcha?.isActive || !captcha?.siteKey) {
      return NextResponse.json({ active: false, bypassActive });
    }
    return NextResponse.json({
      active: true,
      provider: captcha.provider,
      siteKey: captcha.siteKey,
      bypassActive,
    });
  } catch (e) {
    console.error("[public captcha site-key]", e);
    return NextResponse.json({ active: false });
  }
}
