import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get user from cookie
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and check if SUPER_ADMIN
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - SUPER_ADMIN only" },
        { status: 403 }
      );
    }

    // Fetch all companies with owner info and member count
    const companies = await db.company.findMany({
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedCompanies = companies.map((company) => ({
      id: company.id,
      name: company.name,
      description: company.description,
      logo: company.logo,
      ownerName: company.owner.name,
      ownerEmail: company.owner.email,
      memberCount: company._count.members,
      createdAt: company.createdAt,
    }));

    return NextResponse.json({
      success: true,
      companies: formattedCompanies,
      count: formattedCompanies.length,
    });
  } catch (error) {
    console.error("Error fetching all companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
