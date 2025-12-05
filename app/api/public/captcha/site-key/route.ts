import { NextResponse } from "next/server";
import { getCaptchaForScope } from "@/lib/captcha";

export async function GET() {
  try {
    const captcha = await getCaptchaForScope(undefined);
    if (!captcha?.isActive || !captcha?.siteKey) {
      return NextResponse.json({ active: false });
    }
    return NextResponse.json({
      active: true,
      provider: captcha.provider,
      siteKey: captcha.siteKey,
    });
  } catch (e) {
    console.error("[public captcha site-key]", e);
    return NextResponse.json({ active: false });
  }
}
