import fetch from "node-fetch";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { getSuperAdminStorage } from "@/lib/storage-service";
import { decrypt } from "@/lib/encryption";

function normalizeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export interface ImageRequest {
  companyId: string;
  sectionId: string;
  variantId: string;
  prompt: string;
}

export async function generateHeroImage(
  req: ImageRequest
): Promise<{ url: string; provider: string }> {
  try {
    // Find active image provider (company-scoped first, fallback to GLOBAL)
    const companyProvider = await db.imageProvider.findFirst({
      where: { scope: req.companyId, isActive: true },
    });
    const globalProvider = await db.imageProvider.findFirst({
      where: { scope: "GLOBAL", isActive: true },
    });
    const provider = (companyProvider || globalProvider) as
      | typeof companyProvider
      | null;

    let imageUrl: string | null = null;
    let providerName = provider?.provider?.toString() || "unsplash-fallback";

    // Build query from prompt (simple): use main nouns; keep it short
    const query = encodeURIComponent(
      req.prompt.replace(/[^a-zA-Z0-9 ,]/g, "").slice(0, 200)
    );

    if (provider && provider.provider === "UNSPLASH") {
      try {
        const apiKey = provider.apiKey ? decrypt(provider.apiKey) : undefined;
        const url = apiKey
          ? `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&w=1600&h=900`
          : `https://source.unsplash.com/featured/1600x900?${query}`;
        const headers: Record<string, string> = {};
        if (apiKey) headers["Authorization"] = `Client-ID ${apiKey}`;
        const resp = await fetch(url, { headers });
        if (!resp.ok) throw new Error(`Unsplash error ${resp.status}`);
        type UnsplashResp = { urls?: { full?: string; raw?: string } };
        let data: UnsplashResp = { urls: { full: resp.url } };
        if (apiKey) {
          data = (await resp
            .json()
            .catch(() => ({} as Record<string, unknown>))) as UnsplashResp;
        }
        imageUrl = data.urls?.full || data.urls?.raw || resp.url;
        providerName = "unsplash";
      } catch (err) {
        console.warn("Unsplash fetch failed:", normalizeError(err));
      }
    }

    if (!imageUrl && provider && provider.provider === "PEXELS") {
      try {
        const apiKey = provider.apiKey ? decrypt(provider.apiKey) : undefined;
        if (!apiKey) throw new Error("Pexels API key missing");
        const url = `https://api.pexels.com/v1/search?query=${query}&per_page=1`;
        const resp = await fetch(url, { headers: { Authorization: apiKey } });
        if (!resp.ok) throw new Error(`Pexels error ${resp.status}`);
        type PexelsResp = {
          photos?: Array<{ src?: { large?: string; original?: string } }>;
        };
        const pdata = (await resp
          .json()
          .catch(() => ({} as Record<string, unknown>))) as PexelsResp;
        imageUrl =
          pdata.photos && pdata.photos.length > 0
            ? pdata.photos[0].src?.large ||
              pdata.photos[0].src?.original ||
              null
            : null;
        providerName = "pexels";
      } catch (err) {
        console.warn("Pexels fetch failed:", normalizeError(err));
      }
    }

    // Fallback: use source.unsplash.com random with prompt
    if (!imageUrl) {
      imageUrl = `https://source.unsplash.com/featured/1600x900?${query}`;
      providerName = "unsplash-fallback";
    }

    // Download image
    const resp = await fetch(imageUrl);
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
    const arrayBuf = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    // Optimize via sharp
    let sharpInstance = sharp(buffer);
    const maxDimension = 2000;
    // Resize defensively (withoutEnlargement prevents upscaling)
    sharpInstance = sharpInstance.resize(maxDimension, maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    });
    sharpInstance = sharpInstance.jpeg({ quality: 92, progressive: true });
    const processed = await sharpInstance.toBuffer();

    // Save to cold storage under {basePath}/{companyName}/ai-images/v6/
    const global = await getSuperAdminStorage();
    const basePath = global?.config?.path || "../var/storage/cold";

    const company = await db.company.findUnique({
      where: { id: req.companyId },
      select: { name: true },
    });
    if (!company) throw new Error("Company not found");

    const timestamp = Date.now();
    const filename = `v6-hero-${req.sectionId}-${req.variantId}-${timestamp}.jpg`;
    const uploadDir = path.join(
      basePath as string,
      company.name,
      "ai-images",
      "v6"
    );
    await fs.mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, processed);

    const publicPath = `/uploads/${company.name}/ai-images/v6/${filename}`;

    return { url: publicPath, provider: providerName };
  } catch (err) {
    console.error("generateHeroImage error:", normalizeError(err));
    // fallback to a public unsplash endpoint
    const fallback = `https://source.unsplash.com/featured/1600x900?sig=${Date.now()}`;
    return { url: fallback, provider: "fallback" };
  }
}
