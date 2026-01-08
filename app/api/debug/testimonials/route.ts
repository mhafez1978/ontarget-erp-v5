import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Validate session (admin-only)
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response as NextResponse;

    const user = validation.user;
    if (!user || !(user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Admin role required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status") || "all";
    const limit = Math.min(1000, Number(searchParams.get("limit") || 100));

    const where: Prisma.TestimonialWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (status && status !== "all") where.status = status.toUpperCase();

    console.log("[Debug Testimonials] where:", where);

    const totalCount = await db.testimonial.count();
    const companyCount = companyId
      ? await db.testimonial.count({ where: { companyId } })
      : null;

    const testimonials = await db.testimonial.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    // Company aggregates (which companyIds actually have testimonials?)
    let companyAggregates: Array<{ companyId: string; count: number }> = [];
    let companySamples: Array<{
      companyId: string;
      count: number;
      sample: {
        id: string;
        customerName: string | null;
        createdAt: Date;
        status: string;
      } | null;
    }> = [];
    try {
      // Use raw SQL to aggregate by companyId (safe and avoids Prisma groupBy TS issues)
      const raw = await db.$queryRaw<
        Array<{ companyId: string; count: bigint }>
      >`
        SELECT companyId, COUNT(*) as count
        FROM testimonial
        GROUP BY companyId
        ORDER BY count DESC
        LIMIT ${100}
      `;

      companyAggregates = raw.map((r) => ({
        companyId: r.companyId,
        count: Number(r.count),
      }));

      // Small sample per top companies
      const top = companyAggregates.slice(0, 10);
      companySamples = await Promise.all(
        top.map(async (a) => ({
          companyId: a.companyId,
          count: a.count,
          sample: await db.testimonial.findFirst({
            where: { companyId: a.companyId },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              customerName: true,
              createdAt: true,
              status: true,
            },
          }),
        }))
      );
    } catch (e) {
      console.error("[Debug Testimonials] Aggregation failed:", e);
    }

    // Try to read current DB name (MySQL)
    let dbName: string | null = null;
    try {
      const dbRes = await db.$queryRaw<
        Array<{ db: string }>
      >`SELECT DATABASE() as db`;
      dbName = dbRes[0]?.db ?? null;
    } catch (e) {
      console.error("[Debug Testimonials] Failed to read DB name:", e);
    }

    return NextResponse.json({
      totalCount,
      companyCount,
      dbName,
      returned: testimonials.length,
      testimonials,
      companyAggregates,
      companySamples,
    });
  } catch (error) {
    console.error("[Debug Testimonials] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug testimonials" },
      { status: 500 }
    );
  }
}
