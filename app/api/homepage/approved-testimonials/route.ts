import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const root = await db.company.findFirst({
      where: { isRoot: true },
      select: { id: true },
    });
    if (!root) return NextResponse.json({ testimonials: [] });

    const testimonials = await db.testimonial.findMany({
      where: { companyId: root.id, status: "APPROVED", isFeatured: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      take: 24,
      select: {
        id: true,
        customerName: true,
        testimonial: true,
        customerPhoto: true,
      },
    });

    return NextResponse.json({ testimonials });
  } catch (err) {
    console.error("approved testimonials error:", err);
    return NextResponse.json({ testimonials: [] }, { status: 500 });
  }
}
