import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    // Validate session (admin-only)
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) return validation.response;

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

    const where: any = {};
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

    // Try to read current DB name (MySQL)
    let dbName: string | null = null;
    try {
      const dbRes: any = await db.$queryRaw`SELECT DATABASE() as db`;
      dbName = Array.isArray(dbRes) ? dbRes[0]?.db ?? null : dbRes?.db ?? null;
    } catch (e) {
      console.error("[Debug Testimonials] Failed to read DB name:", e);
    }

    return NextResponse.json({
      totalCount,
      companyCount,
      dbName,
      returned: testimonials.length,
      testimonials,
    });
  } catch (error) {
    console.error("[Debug Testimonials] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug testimonials" },
      { status: 500 }
    );
  }
}
