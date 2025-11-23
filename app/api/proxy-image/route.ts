import { NextRequest, NextResponse } from "next/server";

/**
 * Image Proxy API Route
 *
 * Proxies external images (like Google profile pictures) through our server
 * to avoid rate limiting from external CDNs. Adds caching headers to reduce
 * repeated requests.
 *
 * Usage: /api/proxy-image?url=https://lh3.googleusercontent.com/...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 }
      );
    }

    // Validate URL is from allowed domains
    const allowedDomains = [
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "platform-lookaside.fbsbx.com", // Facebook
      "graph.facebook.com",
      "pbs.twimg.com", // Twitter
      "media.licdn.com", // LinkedIn
    ];

    let urlObj: URL;
    try {
      urlObj = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const isAllowed = allowedDomains.some(
      (domain) =>
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Domain not allowed" },
        { status: 403 }
      );
    }

    // Fetch the image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const imageResponse = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "OnTarget-ERP/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${imageResponse.status}` },
        { status: imageResponse.status }
      );
    }

    const contentType = imageResponse.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "URL does not point to an image" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Return the image with aggressive caching headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        "CDN-Cache-Control": "public, max-age=31536000",
        "Vercel-CDN-Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
