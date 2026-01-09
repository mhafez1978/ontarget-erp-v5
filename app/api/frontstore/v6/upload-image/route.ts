import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { validateSessionForAPI } from "@/lib/validate-session";

async function hasGlobalStorageConfigured() {
  const globalStorage = await db.storageProvider.findFirst({ where: { scope: "GLOBAL", isActive: true, isConnected: true } });
  if (!globalStorage) return null;
  const cfg = JSON.parse(globalStorage.config || "{}");
  const basePath = globalStorage.provider === "LOCAL" ? cfg.path || "../var/storage/cold" : "";
  return { configured: true, provider: globalStorage.provider, basePath };
}

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

    const userId = validation.user.id;

    const formData = await request.formData().catch(() => null);
    const body = formData ? Object.fromEntries(formData.entries()) : null;

    // Support either form-data upload or JSON with imageUrl
    const companyId = (formData?.get("companyId") as string) || (body?.companyId as string) || null;
    const sectionId = (formData?.get("sectionId") as string) || (body?.sectionId as string) || null;

    if (!companyId || !sectionId) {
      return NextResponse.json({ error: "companyId and sectionId are required" }, { status: 400 });
    }

    // Authorization: check if user is super admin or owns the company
    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true, ownedCompanies: { select: { id: true } } } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const ownsCompany = user.ownedCompanies.some((c) => c.id === companyId);
    if (!isSuperAdmin && !ownsCompany) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const storageCfg = await hasGlobalStorageConfigured();

    // Determine image source
    const file = formData?.get("image") as File | undefined;
    const imageUrlParam = (formData?.get("imageUrl") as string) || (body?.imageUrl as string) || null;

    if (!file && !imageUrlParam) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Fetch buffer
    let buffer: Buffer;
    let originalName = `image-${Date.now()}.jpg`;

    if (file) {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      originalName = file.name;
    } else {
      // Fetch external URL
      const resp = await fetch(imageUrlParam as string);
      if (!resp.ok) return NextResponse.json({ error: "Failed to fetch remote image" }, { status: 400 });
      const arr = await resp.arrayBuffer();
      buffer = Buffer.from(arr);
    }

    // Use sharp to optimize and convert to jpeg
    let sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();
    const maxDimension = 2000;
    if (metadata.width && metadata.height && (metadata.width > maxDimension || metadata.height > maxDimension)) {
      sharpInstance = sharpInstance.resize(maxDimension, maxDimension, { fit: "inside", withoutEnlargement: true });
    }
    sharpInstance = sharpInstance.jpeg({ quality: 92, progressive: true });
    const processed = await sharpInstance.toBuffer();

    // Save to cold storage under {basePath}/{companyName}/ai-images/v6/
    if (!storageCfg) return NextResponse.json({ error: "No global storage configured" }, { status: 500 });

    const company = await db.company.findUnique({ where: { id: companyId }, select: { name: true } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${sectionId}-${uniqueSuffix}.jpg`;
    const uploadDir = join(storageCfg.basePath, company.name, "ai-images", "v6");
    await mkdir(uploadDir, { recursive: true });
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, processed);

    const publicUrl = `/uploads/${company.name}/ai-images/v6/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
