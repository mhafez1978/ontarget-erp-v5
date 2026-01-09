import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/lib/validate-session";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";

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
    const { provider } = body;

    const config = await db.videoProviderConfig.findFirst({
      where: { scope: "GLOBAL" },
    });
    if (!config)
      return NextResponse.json(
        { error: "Video Provider not configured" },
        { status: 400 }
      );

    if (provider === "ltx") {
      if (!config.ltxApiKey)
        return NextResponse.json(
          { error: "LTX API key not configured" },
          { status: 400 }
        );
      const key = decrypt(config.ltxApiKey);
      try {
        const resp = await fetch("https://api.ltx.studio/v1/generate", {
          method: "OPTIONS",
          headers: { Authorization: `Bearer ${key}` },
        });
        if (resp.status === 401)
          return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
          );
        if (!resp.ok) {
          return NextResponse.json(
            { ok: false, status: resp.status, statusText: resp.statusText },
            { status: 502 }
          );
        }
        return NextResponse.json({ ok: true });
      } catch (err) {
        console.error("LTX test failed:", err);
        return NextResponse.json(
          { ok: false, error: String(err) },
          { status: 500 }
        );
      }
    }

    if (provider === "huggingface") {
      if (!config.hfApiToken)
        return NextResponse.json(
          { error: "Hugging Face token not configured" },
          { status: 400 }
        );
      const key = decrypt(config.hfApiToken);
      try {
        const resp = await fetch(
          "https://api-inference.huggingface.co/models",
          { headers: { Authorization: `Bearer ${key}` } }
        );
        if (resp.status === 401)
          return NextResponse.json(
            { ok: false, error: "Unauthorized" },
            { status: 401 }
          );
        if (!resp.ok)
          return NextResponse.json(
            { ok: false, status: resp.status, statusText: resp.statusText },
            { status: 502 }
          );
        return NextResponse.json({ ok: true });
      } catch (err) {
        console.error("Hugging Face test failed:", err);
        return NextResponse.json(
          { ok: false, error: String(err) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  } catch (error) {
    console.error("Video provider test error:", error);
    return NextResponse.json(
      { error: "Failed to test provider" },
      { status: 500 }
    );
  }
}
