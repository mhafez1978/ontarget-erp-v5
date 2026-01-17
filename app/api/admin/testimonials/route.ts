import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

// GET - Fetch all testimonials for a company (admin only)
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const session = validation.user;

    if (!session.email) {
      return NextResponse.json(
        { error: "Email not found in session" },
        { status: 400 }
      );
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
      user.ownedCompanies.some((c: { id: string }) => c.id === companyId) ||
      user.companyMemberships.some(
        (m: { companyId: string }) => m.companyId === companyId
      );

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

    console.log("[Testimonials API] Company ID:", companyId);
    console.log("[Testimonials API] Status filter:", status);
    console.log("[Testimonials API] Where clause:", whereClause);

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

    console.log("[Testimonials API] Found testimonials:", testimonials.length);
    console.log(
      "[Testimonials API] First testimonial:",
      testimonials[0]
        ? {
            id: testimonials[0].id,
            companyId: testimonials[0].companyId,
            status: testimonials[0].status,
            customerName: testimonials[0].customerName,
          }
        : "none"
    );

    // Optional debug output: returns user's company ownership/membership info and DB diagnostics
    const debug = searchParams.get("debug");
    if (debug === "true") {
      const ownedCompanyIds = user.ownedCompanies.map(
        (c: { id: string }) => c.id
      );
      const membershipCompanyIds = user.companyMemberships.map(
        (m: { companyId: string }) => m.companyId
      );

      // Additional DB diagnostics to help troubleshoot production vs local differences
      let dbInfo: {
        totalCount?: number;
        companyCount?: number;
        sample?: unknown;
        dbName?: string | null;
        error?: string;
      } = {};
      try {
        const totalCount = await db.testimonial.count();
        const companyCount = await db.testimonial.count({
          where: { companyId },
        });
        const sample = await db.testimonial.findFirst({
          where: { companyId },
          orderBy: { createdAt: "desc" },
        });
        // Attempt to read current database name (MySQL)
        const dbNameRes = (await db.$queryRaw`SELECT DATABASE() as db`) as {
          db: string;
        }[];
        const dbName = Array.isArray(dbNameRes)
          ? dbNameRes[0]?.db ?? null
          : (dbNameRes as { db: string })?.db ?? null;
        dbInfo = { totalCount, companyCount, sample, dbName };
      } catch (e) {
        console.error("Debug DB query failed:", e);
        dbInfo = { error: String(e) };
      }

      return NextResponse.json({
        testimonials,
        debug: {
          ownedCompanyIds,
          membershipCompanyIds,
          whereClause,
          dbInfo,
        },
      });
    }

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
