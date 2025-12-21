import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper to get the internal URL for server-side fetches
// We force HTTP and localhost to avoid SSL errors during internal checks
const getInternalUrl = (path: string) => {
  const port = process.env.PORT || "3000";
  // Use 127.0.0.1 to avoid potential IPv6 lookup delays with 'localhost'
  return `http://127.0.0.1:${port}${path}`;
};

async function safeFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    console.log(err instanceof Error ? err.message : JSON.stringify(err));
    // normalize the error so callers can inspect it without throwing
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add cache control headers for static assets
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    /\.(jpg|jpeg|png|gif|svg|ico|webp|avif|woff|woff2|ttf|otf)$/.test(pathname)
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
    return response;
  }

  // Cache API routes with shorter duration
  if (pathname.startsWith("/api/")) {
    if (
      pathname.startsWith("/api/globe/markers") ||
      pathname.startsWith("/api/storefront/")
    ) {
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=10, stale-while-revalidate=30"
      );
    }
  }

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Cross-Origin-Opener-Policy",
    "same-origin-allow-popups"
  );
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://photon.komoot.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob:",
    "connect-src 'self' https://api.stripe.com https://photon.komoot.io https://maps.googleapis.com https://accounts.google.com https://github.com https://login.microsoftonline.com https://api.line.me https://www.linkedin.com https://open.weixin.qq.com https://login.yahoo.com https://oauth.yandex.com wss: ws:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://github.com https://login.microsoftonline.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://github.com https://login.microsoftonline.com https://access.line.me https://www.linkedin.com https://api.login.yahoo.com https://oauth.yandex.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // HSTS (HTTP Strict Transport Security)
  // Only enable in production with HTTPS
  const isProduction = process.env.NODE_ENV === "production";
  const isHttps = request.nextUrl.protocol === "https:";
  if (isProduction && isHttps) {
    // Start with 1 day (86400 seconds), increase to 1 year (31536000) after testing
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Performance hints
  response.headers.set(
    "Link",
    "</fonts/geist-sans.woff2>; rel=preload; as=font; crossorigin=anonymous"
  );

  // Skip setup check for API routes, static files, and setup page itself
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/onboarding") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // 1. Determine the Public Base URL for Redirects
  // We use the request origin so redirects respect the user's protocol (https)
  const publicBaseUrl = request.nextUrl.origin;

  try {
    // --- SETUP CHECK ---

    // Use INTERNAL HTTP URL for the fetch to avoid SSL errors
    const setupCheckUrl = getInternalUrl("/api/setup/check");

    const setupHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    };

    const response = await safeFetch(setupCheckUrl, {
      method: "GET",
      headers: setupHeaders,
      cache: "no-store",
    });

    if (!response) {
      // Log less aggressively if it's just a connection refused (startup)
      console.warn(
        `Middleware: Could not reach internal setup check at ${setupCheckUrl}`
      );
    } else if (response.ok) {
      const data = await response.json();

      // If setup is needed and user is not on setup page, redirect to setup
      if (data.needsSetup && pathname !== "/setup") {
        const redirectResponse = NextResponse.redirect(
          new URL("/setup", publicBaseUrl)
        );
        // Copy headers to redirect response
        response.headers.forEach((value, key) => {
          redirectResponse.headers.set(key, value);
        });
        return redirectResponse;
      }

      // If setup is complete and user is on setup page, redirect to home
      if (data.hasSetup && pathname === "/setup") {
        const redirectResponse = NextResponse.redirect(
          new URL("/", publicBaseUrl)
        );
        // Copy headers to redirect response
        response.headers.forEach((value, key) => {
          redirectResponse.headers.set(key, value);
        });
        return redirectResponse;
      }
    }

    // --- ONBOARDING CHECK ---
    if (pathname.startsWith("/dashboard")) {
      try {
        // Use INTERNAL HTTP URL for the fetch
        const onboardingCheckUrl = getInternalUrl("/api/onboarding/check");

        const onboardingHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        };

        // Forward IP headers for security checks
        const forwardedFor = request.headers.get("x-forwarded-for");
        const realIp = request.headers.get("x-real-ip");
        if (forwardedFor) onboardingHeaders["x-forwarded-for"] = forwardedFor;
        if (realIp) onboardingHeaders["x-real-ip"] = realIp;

        const onboardingResponse = await safeFetch(onboardingCheckUrl, {
          method: "GET",
          headers: onboardingHeaders,
          cache: "no-store",
        });

        if (!onboardingResponse) {
          // Silent fail or low-level warn to prevent log spam
        } else if (onboardingResponse.ok) {
          const onboardingData = await onboardingResponse.json();

          if (onboardingData.needsOnboarding && onboardingData.onboardingUrl) {
            // Redirect using the Public URL
            const redirectResponse = NextResponse.redirect(
              new URL(onboardingData.onboardingUrl, publicBaseUrl)
            );
            // Copy headers to redirect response
            onboardingResponse.headers.forEach((value, key) => {
              redirectResponse.headers.set(key, value);
            });
            return redirectResponse;
          }
        }
      } catch (error) {
        console.error("Proxy onboarding check failed:", error);
      }
    }
  } catch (error) {
    console.error("Middleware setup check failed (unexpected error):", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export default proxy;
