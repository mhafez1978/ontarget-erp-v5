import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const testimonialSchema = z.object({
  companyId: z.string(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerTitle: z.string().optional(),
  testimonial: z.string().min(20),
  rating: z.number().min(1).max(5),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const validatedData = testimonialSchema.parse(body);

    // Verify company exists
    const company = await db.company.findUnique({
      where: { slug },
    });

    if (!company || company.id !== validatedData.companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Create testimonial with PENDING status
    const testimonial = await db.testimonial.create({
      data: {
        companyId: validatedData.companyId,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerTitle: validatedData.customerTitle || null,
        testimonial: validatedData.testimonial,
        rating: validatedData.rating,
        status: "PENDING",
      },
    });

    // TODO: Send notification email to company admins about new testimonial

    return NextResponse.json({
      success: true,
      message: "Testimonial submitted successfully and is pending approval",
      testimonialId: testimonial.id,
    });
  } catch (error) {
    console.error("Testimonial submission error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid testimonial data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to submit testimonial" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch approved testimonials for a company
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find company
    const company = await db.company.findUnique({
      where: { slug },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Fetch approved testimonials
    const testimonials = await db.testimonial.findMany({
      where: {
        companyId: company.id,
        status: "APPROVED",
      },
      orderBy: [
        { isFeatured: "desc" },
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        customerName: true,
        customerTitle: true,
        customerPhoto: true,
        testimonial: true,
        rating: true,
        isFeatured: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      testimonials,
      count: testimonials.length,
    });
  } catch (error) {
    console.error("Testimonials fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
