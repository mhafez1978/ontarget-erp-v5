import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

// GET - Fetch approved testimonials for a storefront
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;

    // Find company by slug
    const company = await db.company.findUnique({
      where: { slug },
    });

    if (!company) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Get approved testimonials
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
        rating: true,
        testimonial: true,
        isFeatured: true,
        createdAt: true,
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

// POST - Submit a new testimonial (from storefront customers)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = await request.json();

    const { customerName, customerEmail, customerTitle, rating, testimonial } =
      body;

    // Validation
    if (!customerName || !customerEmail || !testimonial) {
      return NextResponse.json(
        { error: "Name, email, and testimonial are required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Find company by slug
    const company = await db.company.findUnique({
      where: { slug },
    });

    if (!company) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Create testimonial (pending approval)
    const newTestimonial = await db.testimonial.create({
      data: {
        companyId: company.id,
        customerName,
        customerEmail,
        customerTitle: customerTitle || null,
        rating: parseInt(rating),
        testimonial,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message:
          "Thank you! Your testimonial has been submitted and is pending approval.",
        id: newTestimonial.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting testimonial:", error);
    return NextResponse.json(
      { error: "Failed to submit testimonial" },
      { status: 500 }
    );
  }
}
