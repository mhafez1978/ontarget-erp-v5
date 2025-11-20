import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const company = await prisma.company.findUnique({
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
