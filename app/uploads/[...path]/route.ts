import { NextRequest, NextResponse } from "next/server";
import { join, extname } from "path";
import { readFile } from "fs/promises";

const uploadsRoot = join(process.cwd(), "public", "uploads");

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  context: { params: { path?: string[] } }
) {
  try {
    const segments = context.params.path || [];
    if (segments.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const filePath = join(uploadsRoot, ...segments);

    if (!filePath.startsWith(uploadsRoot)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const file = await readFile(filePath);
    const contentType = getContentType(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Uploads route error:", error);
    return new NextResponse("Not found", { status: 404 });
  }
}

