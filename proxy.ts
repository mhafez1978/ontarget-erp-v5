import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

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

    // Check onboarding status if accessing dashboard
    if (pathname.startsWith("/dashboard")) {
      const userId = request.cookies.get("userId")?.value;

      if (userId) {
        try {
          // Check if user is a CompanyStaff member
          const staff = await db.companyStaff.findFirst({
            where: {
              userId: userId,
            },
            include: {
              onboardingToken: true,
            },
          });

          // If user is staff and onboarding incomplete, redirect to onboarding
          if (staff && !staff.onboardingComplete) {
            // Check if onboarding token exists and is not expired
            if (staff.onboardingToken && !staff.onboardingToken.isUsed) {
              const now = new Date();
              const expiresAt = new Date(staff.onboardingToken.expiresAt);

              // Only redirect if token is still valid
              if (expiresAt > now) {
                return NextResponse.redirect(
                  new URL(
                    `/onboarding/${staff.onboardingToken.token}`,
                    request.url
                  )
                );
              }
              // If token expired, let them through but they'll see disabled state
            }
          }
        } catch (error) {
          console.error("Middleware onboarding check failed:", error);
          // Don't block access on error, just log it
        }
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
