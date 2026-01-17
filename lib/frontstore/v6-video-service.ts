import fetch from "node-fetch";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import { getCompanyStorage, getSuperAdminStorage } from "@/lib/storage-service";
import { decrypt } from "@/lib/encryption";
import type { VideoProviderConfig, Company } from "@/generated/prisma/client";

function normalizeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export interface VideoRequest {
  companyId: string;
  sectionId: string;
  variantId: string;
  prompt: string;
  duration?: number;
  resolution?: string;
}

export async function generateAIVideo(
  req: VideoRequest
): Promise<{ url: string; provider: string }> {
  // Fetch provider config (GLOBAL)
  const config = (await db.videoProviderConfig.findFirst({
    where: { scope: "GLOBAL" },
  })) as VideoProviderConfig | null;

  const primary = config?.primaryProvider || "ltx";

  // Try LTX if enabled and primary
  if (primary === "ltx" && config?.ltxEnabled && config.ltxApiKey) {
    try {
      const key = decrypt(config.ltxApiKey);
      const secret = config.ltxSecret ? decrypt(config.ltxSecret) : undefined;
      const videoUrl = await generateWithLTX(req, key, secret);
      const saved = await saveVideoToColdStorage(
        req.companyId,
        req.sectionId,
        req.variantId,
        videoUrl,
        "ltx"
      );
      return { url: saved, provider: "ltx" };
    } catch (err: unknown) {
      const msg = normalizeError(err);
      console.error("LTX generation failed:", msg);
      // fallback to Hugging Face
    }
  }

  // Try Hugging Face if enabled
  if (config?.hfEnabled && config.hfApiToken) {
    try {
      const key = decrypt(config.hfApiToken);
      const videoUrl = await generateWithHuggingFace(req, key);
      const saved = await saveVideoToColdStorage(
        req.companyId,
        req.sectionId,
        req.variantId,
        videoUrl,
        "huggingface"
      );
      return { url: saved, provider: "huggingface" };
    } catch (err: unknown) {
      const msg = normalizeError(err);
      console.error("Hugging Face generation failed:", msg);
    }
  }

  // Last resort: use sample video
  const sample =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const saved = await saveVideoToColdStorage(
    req.companyId,
    req.sectionId,
    req.variantId,
    sample,
    "sample"
  );
  return { url: saved, provider: "sample" };
}

async function generateWithLTX(
  req: VideoRequest,
  apiKey: string,
  secret?: string
): Promise<string> {
  // Note: LTX API details are hypothetical. Here we POST a request and expect a JSON { video_url }
  const resp = await fetch("https://api.ltx.studio/v1/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(secret ? { "X-API-Secret": secret } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: req.prompt,
      duration: req.duration || 4,
      resolution: req.resolution || "1920x1080",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LTX error: ${resp.status} ${text}`);
  }

  const data: any = await resp.json();
  if (data?.video_url) return data.video_url;
  if (data?.artifact_url) return data.artifact_url;
  throw new Error("LTX did not return a video URL");
}

async function generateWithHuggingFace(
  req: VideoRequest,
  apiToken: string
): Promise<string> {
  // Hypothetical: call HF model inference endpoint
  const modelEndpoint =
    "https://api-inference.huggingface.co/models/stabilityai/stable-video-diffusion";
  const resp = await fetch(modelEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: req.prompt,
      options: { duration: req.duration || 4 },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HuggingFace error: ${resp.status} ${text}`);
  }

  const data: any = await resp.json();
  // HF may return an array of results or a link; try to find a URL
  if (data?.video_url) return data.video_url;
  if (Array.isArray(data) && data[0]?.url) return data[0].url;

  // If response was a binary, the actual download may need different handling; throw for now
  throw new Error("HuggingFace did not return a video URL");
}

async function saveVideoToColdStorage(
  companyId: string,
  sectionId: string,
  variantId: string,
  videoUrl: string,
  provider: string
): Promise<string> {
  // Get company name
  const company = (await db.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  })) as Company | null;
  if (!company) throw new Error("Company not found");

  // Get global storage
  const global = await getSuperAdminStorage();
  const basePath = global?.config?.path || "../var/storage/cold";

  // Download video
  const resp = await fetch(videoUrl);
  if (!resp.ok) throw new Error(`Failed to download video: ${resp.status}`);
  const buffer = Buffer.from(await resp.arrayBuffer());

  const timestamp = Date.now();
  const filename = `v6-hero-${sectionId}-${variantId}-${timestamp}.mp4`;
  const uploadDir = path.join(
    basePath as string,
    company.name,
    "ai-videos",
    "v6"
  );

  await fs.mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, buffer);

  // Return a public path; we follow the temp image behavior and return /uploads/... path
  const publicPath = `/uploads/${company.name}/ai-videos/v6/${filename}`;
  return publicPath;
}
