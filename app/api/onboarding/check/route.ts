import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ needsOnboarding: false });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ needsOnboarding: false });
    }

    const userId = validation.user.id;

    // Get user with staff records
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        companyStaff: {
          include: {
            onboardingToken: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.companyStaff.length) {
      return NextResponse.json({ needsOnboarding: false });
    }

    // Check if any staff record needs onboarding
    for (const staff of user.companyStaff) {
      if (!staff.onboardingComplete && staff.onboardingToken) {
        const token = staff.onboardingToken;

        // Check if token is still valid
        if (!token.isUsed && new Date() < token.expiresAt) {
          return NextResponse.json({
            needsOnboarding: true,
            onboardingUrl: `/onboarding/${token.token}`,
            company: {
              name: staff.company ? staff.company.name : "your company",
            },
          });
        }
      }
    }

    return NextResponse.json({ needsOnboarding: false });
  } catch (error) {
    console.error("[Check Onboarding Error]:", error);
    return NextResponse.json({ needsOnboarding: false });
  }
}
