import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip setup check for API routes, static files, and setup page itself
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/onboarding") || // Allow onboarding pages
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // Check if setup is needed
    const setupUrl = new URL("/api/setup/check", request.url);
    const setupHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") || "",
    };
    const response = await fetch(setupUrl, {
      method: "GET",
      headers: setupHeaders,
    });

    if (response.ok) {
      const data = await response.json();

      // If setup is needed and user is not on setup page, redirect to setup
      if (data.needsSetup && pathname !== "/setup") {
        return NextResponse.redirect(new URL("/setup", request.url));
      }

      // If setup is complete and user is on setup page, redirect to home
      if (data.hasSetup && pathname === "/setup") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Check onboarding status if accessing dashboard
    if (pathname.startsWith("/dashboard")) {
      try {
        const onboardingUrl = new URL("/api/onboarding/check", request.url);
        const onboardingHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") || "",
        };
        const forwardedFor = request.headers.get("x-forwarded-for");
        const realIp = request.headers.get("x-real-ip");
        if (forwardedFor) {
          onboardingHeaders["x-forwarded-for"] = forwardedFor;
        }
        if (realIp) {
          onboardingHeaders["x-real-ip"] = realIp;
        }

        const onboardingResponse = await fetch(onboardingUrl, {
          method: "GET",
          headers: onboardingHeaders,
          cache: "no-store",
        });

        if (onboardingResponse.ok) {
          const onboardingData = await onboardingResponse.json();

          if (onboardingData.needsOnboarding && onboardingData.onboardingUrl) {
            return NextResponse.redirect(
              new URL(onboardingData.onboardingUrl, request.url)
            );
          }
        }
      } catch (error) {
        console.error("Proxy onboarding check failed:", error);
        // Don't block dashboard access if onboarding lookup fails
      }
    }
  } catch (error) {
    console.error("Middleware setup check failed:", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
