import type { NextRequest } from "next/server";

/**
 * Resolve the public origin for a request even when the app is running
 * behind a proxy/load balancer (Coolify, Nginx, etc).
 */
export function getRequestOrigin(request: NextRequest): string {
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ||
    request.headers.get("x-forwarded-protocol");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost) {
    const proto =
      forwardedProto ||
      (forwardedHost.includes("localhost") ? "http" : "https");
    return `${proto}://${forwardedHost}`;
  }

  const defaultOrigin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.INTERNAL_APP_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";

  return defaultOrigin;
}

