import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = await validateSession(sessionToken);
    if (!validation.valid || !validation.user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only SUPER_ADMIN can access root company
    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Super Admin only." },
        { status: 403 }
      );
    }

    // Fetch the root company
    const rootCompany = await db.company.findFirst({
      where: { isRoot: true },
      select: {
        id: true,
        name: true,
        slogan: true,
        description: true,
        logo: true,
        logoLight: true,
        logoDark: true,
        email: true,
        phone: true,
        website: true,
      },
    });

    if (!rootCompany) {
      return NextResponse.json(
        { error: "Root company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ company: rootCompany });
  } catch (error) {
    console.error("Error fetching root company:", error);
    return NextResponse.json(
      { error: "Failed to fetch root company" },
      { status: 500 }
    );
  }
}
