import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");

    // Find company by slug
    const company = await db.company.findUnique({
      where: { slug },
      select: { id: true, isStoreEnabled: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!company.isStoreEnabled) {
      return NextResponse.json(
        { error: "Store is not enabled" },
        { status: 403 }
      );
    }

    // Build where clause
    const where = {
      companyId: company.id,
      isPublished: true,
      isActive: true,
      ...(category && { category }),
      ...(featured === "true" && { isFeatured: true }),
    };

    // Fetch products
    const products = await db.product.findMany({
      where,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
