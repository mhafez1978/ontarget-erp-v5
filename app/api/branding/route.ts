import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    // If user is authenticated, check for company-specific white-label branding
    if (sessionToken) {
      const validation = await validateSession(sessionToken);
      
      if (validation.valid && validation.user) {
        const userId = validation.user.id;
        
        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            companyMemberships: {
              select: {
                companyId: true,
                company: {
                  select: {
                    name: true,
                    slogan: true,
                    logo: true,
                    logoLight: true,
                    logoDark: true,
                    subscriberSubscriptions: {
                      where: {
                        OR: [{ status: "ACTIVE" }, { status: "TRIAL" }],
                        plan: {
                          in: ["GROWTH", "ENTERPRISE"],
                        },
                      },
                      select: {
                        id: true,
                      },
                    },
                  },
                },
              },
              take: 1,
            },
          },
        });

      // Check if user has a company with white-label eligible subscription
      const membership = user?.companyMemberships[0];
      if (
        membership &&
        membership.company.subscriberSubscriptions.length > 0 &&
        (membership.company.logoLight ||
          membership.company.logoDark ||
          membership.company.logo)
      ) {
        // Return company-specific branding
        return NextResponse.json({
          name: membership.company.name,
          slogan: membership.company.slogan || "People Driven & AI Insight",
          logo: membership.company.logo,
          logoLight: membership.company.logoLight,
          logoDark: membership.company.logoDark,
          isWhiteLabel: true,
        });
      }
    }
  }

    // Fallback to root company (OnTarget ERP branding)
    const rootCompany = await db.company.findFirst({
      where: { isRoot: true },
      select: {
        name: true,
        slogan: true,
        logo: true,
        logoLight: true,
        logoDark: true,
      },
    });

    if (!rootCompany) {
      // Fallback to default branding if no root company exists
      return NextResponse.json({
        name: "OnTarget ERP",
        slogan: "People Driven & AI Insight",
        logo: null,
        logoLight: null,
        logoDark: null,
        isWhiteLabel: false,
      });
    }

    return NextResponse.json({
      name: rootCompany.name,
      slogan: rootCompany.slogan || "People Driven & AI Insight",
      logo: rootCompany.logo,
      logoLight: rootCompany.logoLight,
      logoDark: rootCompany.logoDark,
      isWhiteLabel: false,
    });
  } catch (error) {
    console.error("Failed to fetch branding:", error);

    // Return default branding on error
    return NextResponse.json({
      name: "OnTarget ERP",
      slogan: "People Driven & AI Insight",
      logo: null,
      logoLight: null,
      logoDark: null,
      isWhiteLabel: false,
    });
  }
}
