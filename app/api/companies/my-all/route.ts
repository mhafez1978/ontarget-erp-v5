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

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all companies the user owns or is a member of
    const ownedCompanies = await db.company.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        logo: true,
        createdAt: true,
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

    const memberCompanies = await db.companyMember.findMany({
      where: {
        userId: user.id,
        companyId: {
          notIn: ownedCompanies.map((c) => c.id), // Exclude companies already owned
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            createdAt: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    // Combine and format companies
    const companies = [
      ...ownedCompanies.map((company) => ({
        ...company,
        isOwner: true,
        memberCount: company._count.members,
      })),
      ...memberCompanies.map((membership) => ({
        ...membership.company,
        isOwner: false,
        role: membership.role,
        memberCount: membership.company._count.members,
      })),
    ];

    return NextResponse.json({
      success: true,
      companies,
      count: companies.length,
    });
  } catch (error) {
    console.error("Error fetching user companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
