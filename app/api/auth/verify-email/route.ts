import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=Missing verification token", request.url)
      );
    }

    // Find user with this token
    const user = await db.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: {
          gte: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL(
          "/login?error=Invalid or expired verification token",
          request.url
        )
      );
    }

    // Mark email as verified and clear token
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    // Redirect to success page or dashboard
    return NextResponse.redirect(
      new URL("/dashboard?verified=true", request.url)
    );
  } catch (error) {
    console.error("[Verify Email] Error:", error);
    return NextResponse.redirect(
      new URL("/login?error=Verification failed", request.url)
    );
  }
}
