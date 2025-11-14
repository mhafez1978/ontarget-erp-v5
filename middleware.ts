import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip setup check for API routes, static files, and setup page itself
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/setup") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // Check if setup is needed
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/setup/check`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
