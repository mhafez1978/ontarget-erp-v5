import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{
    companyId: string;
  }>;
}

// GET - fetch approved testimonials for a company by ID
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { companyId } = await context.params;

    const company = await db.company.findUnique({ where: { id: companyId } });

    if (!company) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const testimonials = await db.testimonial.findMany({
      where: { companyId: company.id, status: "APPROVED" },
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
    console.error("Error fetching testimonials by-id:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

// POST - submit a testimonial for a company by id (guest)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { companyId } = await context.params;
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      customerTitle,
      rating,
      testimonial,
      customerPhoto,
    } = body;

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

    if (customerPhoto && typeof customerPhoto !== "string") {
      return NextResponse.json(
        { error: "Invalid customerPhoto" },
        { status: 400 }
      );
    }

    // simple limit to prevent extremely large payloads for base64 image data
    // allow up to ~8MB of characters to accommodate base64 overhead from a ~6MB file
    const MAX_CUSTOMER_PHOTO_CHARS = 8_000_000;
    if (customerPhoto && customerPhoto.length > MAX_CUSTOMER_PHOTO_CHARS) {
      return NextResponse.json(
        {
          error: `customerPhoto is too large. Max ${MAX_CUSTOMER_PHOTO_CHARS} characters. Received ${customerPhoto.length}`,
        },
        { status: 400 }
      );
    }

    const company = await db.company.findUnique({ where: { id: companyId } });

    if (!company) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const newTestimonial = await db.testimonial.create({
      data: {
        companyId: company.id,
        customerName,
        customerEmail,
        customerTitle: customerTitle || null,
        customerPhoto: customerPhoto || null,
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
    console.error("Error submitting testimonial by-id:", error);
    return NextResponse.json(
      { error: "Failed to submit testimonial" },
      { status: 500 }
    );
  }
}
