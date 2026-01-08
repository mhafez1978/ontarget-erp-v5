import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateSessionForAPI } from "@/lib/validate-session";

export async function GET(request: NextRequest) {
  try {
    const validation = await validateSessionForAPI(request);
    if (!validation.valid) {
      return validation.response;
    }

    const { user } = validation;

    if (user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - SUPER_ADMIN only" },
        { status: 403 }
      );
    }
    // Get start and end of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch companies created today
    const companies = await db.company.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedCompanies = companies.map((company) => ({
      id: company.id,
      name: company.name,
      description: company.description,
      ownerName: company.owner.name || "Unknown",
      ownerEmail: company.owner.email || "Unknown",
      memberCount: company.members.length,
      createdAt: company.createdAt.toISOString(),
    }));

    return NextResponse.json({
      companies: formattedCompanies,
      count: formattedCompanies.length,
    });
  } catch (error) {
    console.error("Error fetching today's companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
