import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const company = await db.company.findUnique({
      where: {
        slug: slug,
        isStoreEnabled: true, // Only return companies with storefront enabled
      },
      select: {
        id: true,
        name: true,
        slug: true,
        slogan: true,
        description: true,
        logo: true,
        logoLight: true,
        logoDark: true,
        website: true,
        email: true,
        phone: true,
        isStoreEnabled: true,
        storeTheme: true,
        storeBanner: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or storefront is not enabled" },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Error fetching company by slug:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
