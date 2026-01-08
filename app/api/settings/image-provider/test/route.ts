import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { validateSessionForAPI } from "@/lib/validate-session";

type ImageProviderRequestBody = {
  provider: string;
  apiKey?: string;
  apiSecret?: string;
};

export async function POST(req: NextRequest) {
  try {
    const validation = await validateSessionForAPI(req);
    if (!validation.valid) return validation.response as NextResponse;
    const user = validation.user;

    const body = await req.json();
    const { provider, apiKey, apiSecret } = body as ImageProviderRequestBody;

    // Only SUPER_ADMIN can test global settings
    if (user.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let key = apiKey;
    let secret = apiSecret;

    // If no key provided in body, load GLOBAL from DB
    if (!key) {
      const setting = await db.imageProvider.findFirst({
        where: { scope: "GLOBAL" },
      });
      if (setting?.apiKey) {
        key = decrypt(setting.apiKey);
      }
      if (setting?.apiSecret) {
        secret = decrypt(setting.apiSecret);
      }
    }

    if (!provider || !["UNSPLASH", "PEXELS"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    if (!key)
      return NextResponse.json(
        { error: "No API key provided" },
        { status: 400 }
      );

    if (provider === "UNSPLASH") {
      // Use Unsplash search endpoint
      const qs = encodeURIComponent("test");
      const r = await fetch(
        `https://api.unsplash.com/search/photos?query=${qs}&per_page=1`,
        { headers: { Authorization: `Client-ID ${key}` } }
      );
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        return NextResponse.json(
          { error: `Unsplash error: ${r.status} ${txt}` },
          { status: 400 }
        );
      }
      const j = await r.json();
      if (j && j.results && j.results.length > 0)
        return NextResponse.json({ ok: true });
      return NextResponse.json(
        { error: "No results from Unsplash" },
        { status: 400 }
      );
    }

    if (provider === "PEXELS") {
      const qs = encodeURIComponent("test");
      const r = await fetch(
        `https://api.pexels.com/v1/search?query=${qs}&per_page=1`,
        { headers: { Authorization: key } }
      );
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        return NextResponse.json(
          { error: `Pexels error: ${r.status} ${txt}` },
          { status: 400 }
        );
      }
      const j = await r.json();
      if (j && j.photos && j.photos.length > 0)
        return NextResponse.json({ ok: true });
      return NextResponse.json(
        { error: "No results from Pexels" },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Not implemented" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to test provider" },
      { status: 500 }
    );
  }
}
