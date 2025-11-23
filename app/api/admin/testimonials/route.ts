import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/session-manager";

// GET - Fetch all testimonials for a company (admin only)
export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sessionToken")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate session
    const validation = await validateSession(sessionToken);

    if (!validation.valid || !validation.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = validation.user;

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with company access
    const user = await db.user.findUnique({
      where: { email: session.email },
      include: {
        ownedCompanies: true,
        companyMemberships: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED, or "all"

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this company
    const hasAccess =
      user.ownedCompanies.some((c) => c.id === companyId) ||
      user.companyMemberships.some((m) => m.companyId === companyId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }

    // Build query
    const whereClause: { companyId: string; status?: string } = { companyId };
    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    // Fetch testimonials
    const testimonials = await db.testimonial.findMany({
      where: whereClause,
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
